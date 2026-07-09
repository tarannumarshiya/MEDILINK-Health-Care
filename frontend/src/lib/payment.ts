/**
 * payment.ts — single payment engine for the whole app.
 *
 * PAYMENTS_MODE=mock  → simulated instant success (demo / no real Razorpay call)
 * PAYMENTS_MODE=live  → real Razorpay checkout (plug in real keys, no code change)
 */

import { apiFetch } from "@/lib/apiFetch";

export type PaymentResult =
  | { success: true;  paymentId: string; orderId: string; method: string }
  | { success: false; error: string };

export interface PayOptions {
  /** Amount in INR (NOT paise — we convert internally) */
  amount: number;
  description: string;
  /** Invoice / order reference shown in Razorpay modal */
  invoiceCode: string;
  /** Source table context for server-side DB writes */
  purpose?: "invoice" | "pharmacy_order";
  /** The DB row id of the source record */
  referenceId?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (result: PaymentResult & { success: true }) => void;
  onFailure?: (result: PaymentResult & { success: false }) => void;
}

// ─── Mock flow ────────────────────────────────────────────────────────────────
async function runMockPayment(opts: PayOptions): Promise<void> {
  await new Promise(r => setTimeout(r, 900));
  const mockOrderId = `mock_order_${Date.now()}`;
  const mockPayId   = `mock_pay_${Date.now()}`;

  // Call /api/payment/verify so the server writes to DB (same as live)
  const verifyRes = await apiFetch("/api/payment/verify", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id:   mockOrderId,
      razorpay_payment_id: mockPayId,
      razorpay_signature:  "mock_signature",
      invoiceCode:  opts.invoiceCode,
      purpose:      opts.purpose ?? "invoice",
      referenceId:  opts.referenceId,
      amount:       opts.amount,
    }),
  });
  if (!verifyRes.ok) {
    opts.onFailure?.({ success: false, error: "Mock payment verification failed." });
    return;
  }
  opts.onSuccess({ success: true, paymentId: mockPayId, orderId: mockOrderId, method: "mock_upi" });
}

// ─── Live flow (Razorpay Checkout SDK) ────────────────────────────────────────
async function runLivePayment(opts: PayOptions): Promise<void> {
  // 1. Create an order on our server (which calls Razorpay Orders API)
  const orderRes = await apiFetch("/api/payment/create-order", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      invoiceCode: opts.invoiceCode,
      purpose:     opts.purpose ?? "invoice",
      referenceId: opts.referenceId,
    }),
  });
  if (!orderRes.ok) {
    opts.onFailure?.({ success: false, error: "Failed to create payment order." });
    return;
  }
  const { orderId } = await orderRes.json();

  // 2. Fetch Razorpay key ID dynamically
  const keyRes = await apiFetch("/api/payment/public-settings");
  if (!keyRes.ok) {
    opts.onFailure?.({ success: false, error: "Failed to load payment settings." });
    return;
  }
  const { RAZORPAY_KEY_ID: rzpKey } = await keyRes.json();
  if (!rzpKey) {
    opts.onFailure?.({ success: false, error: "Razorpay is not configured." });
    return;
  }

  // 3. Open Razorpay Checkout modal
  // @ts-expect-error Razorpay is loaded via external script tag
  const rzp = new window.Razorpay({
    key:         rzpKey,
    amount:      opts.amount * 100, // paise
    currency:    "INR",
    name:        "Medilink Healthcare",
    description: opts.description,
    order_id:    orderId,
    prefill:     opts.prefill ?? {},
    handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
      // 3. Verify signature on server
      const verifyRes = await apiFetch("/api/payment/verify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...response,
          invoiceCode: opts.invoiceCode,
          purpose:     opts.purpose ?? "invoice",
          referenceId: opts.referenceId,
          amount:      opts.amount,
        }),
      });
      if (!verifyRes.ok) {
        opts.onFailure?.({ success: false, error: "Payment verification failed." });
        return;
      }
      opts.onSuccess({
        success:   true,
        paymentId: response.razorpay_payment_id,
        orderId:   response.razorpay_order_id,
        method:    "razorpay",
      });
    },
    modal: {
      ondismiss: () => opts.onFailure?.({ success: false, error: "Payment cancelled by user." }),
    },
  });
  rzp.open();
}

// ─── Public entry point ───────────────────────────────────────────────────────
export function initiatePayment(opts: PayOptions): void {
  const mode = process.env.NEXT_PUBLIC_PAYMENTS_MODE ?? process.env.PAYMENTS_MODE ?? "mock";
  if (mode === "live") {
    runLivePayment(opts);
  } else {
    runMockPayment(opts); // returns a Promise — fire-and-forget is fine
  }
}
