import { Router, Request, Response } from "express";
import crypto from "crypto";
import { serviceClient } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";
import { config } from "../lib/config";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                     Idempotency / amount verification                       */
/* -------------------------------------------------------------------------- */

async function resolveReferenceAmount(purpose: string, referenceId?: string, invoiceCode?: string) {
  if (purpose === "pharmacy_order" && referenceId) {
    const { data, error } = await serviceClient
      .from("pharmacy_public_orders")
      .select("total, status")
      .eq("id", referenceId)
      .single();
    if (error || !data) return { error: "Order not found", status: 404 };
    return { amount: Number(data.total) || 0, invoiceId: null, status: 200 };
  }

  if (invoiceCode) {
    const { data, error } = await serviceClient
      .from("invoices")
      .select("id, total, status")
      .eq("invoice_code", invoiceCode)
      .single();
    if (error || !data) return { error: "Invoice not found", status: 404 };
    return { amount: Number(data.total) || 0, invoiceId: data.id, status: 200 };
  }

  return { error: "invoiceCode or referenceId is required", status: 400 };
}

function amountsMatch(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.01;
}

/** Prevents duplicate payment recording for the same gateway payment id. */
async function paymentAlreadyRecorded(razorpayPaymentId: string | null | undefined): Promise<boolean> {
  if (!razorpayPaymentId) return false;
  const { data } = await serviceClient
    .from("payments")
    .select("id")
    .eq("razorpay_payment_id", razorpayPaymentId)
    .maybeSingle();
  return Boolean(data);
}

/* -------------------------------------------------------------------------- */
/*                              Settings endpoints                             */
/* -------------------------------------------------------------------------- */

// Public — returns only the non-secret Razorpay key id + mode info.
router.get("/public-settings", (_req: Request, res: Response) => {
  res.json({
    success: true,
    RAZORPAY_KEY_ID: config.razorpayKeyId,
    paymentMode: config.paymentMode,
    demoMode: config.demoMode,
    isConfigured: Boolean(config.razorpayKeyId && config.razorpayKeySecret),
  });
});

// Super Admin only — never returns the secret itself.
router.get(
  "/settings",
  requireAuth,
  (_req: Request, res: Response) => {
    res.json({
      success: true,
      settings: {
        razorpayConfigured: Boolean(config.razorpayKeyId && config.razorpayKeySecret),
        paymentMode: config.paymentMode,
        // Secret is intentionally never exposed through the API.
      },
    });
  }
);

// Secrets can no longer be written through the API. Env-only.
router.post(
  "/settings",
  requireAuth,
  (_req: Request, res: Response) => {
    res.status(400).json({
      success: false,
      error: "Razorpay secrets must be configured via server environment variables. Inline secret updates are disabled for security.",
    });
  }
);

/* -------------------------------------------------------------------------- */
/*                            POST /api/payment/create-order                   */
/* -------------------------------------------------------------------------- */

router.post("/create-order", async (req: Request, res: Response) => {
  const invoiceCode = req.body.invoiceCode || req.body.invoice_code || req.query.invoiceCode || req.query.invoice_code;
  const referenceId = req.body.referenceId || req.body.reference_id || req.query.referenceId || req.query.reference_id;
  const purpose = req.body.purpose || req.query.purpose || "invoice";

  const resolved = await resolveReferenceAmount(purpose, referenceId, invoiceCode);
  if (resolved.error) return void res.status(resolved.status).json({ error: resolved.error });
  const amount = resolved.amount as number;

  // ── MOCK ──
  if (config.paymentMode === "mock") {
    return void res.json({
      orderId: `mock_order_${Date.now()}`,
      amount,
      demo: true,
    });
  }

  // ── RAZORPAY ──
  if (!config.razorpayKeyId || !config.razorpayKeySecret) {
    return void res.status(500).json({ error: "Razorpay keys not configured" });
  }

  const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: invoiceCode || referenceId || undefined,
    }),
  });

  if (!rzpRes.ok) {
    const err = await rzpRes.text();
    return void res.status(502).json({ error: err });
  }

  const rzpData = (await rzpRes.json()) as { id: string };
  res.json({ orderId: rzpData.id, amount });
});

/* -------------------------------------------------------------------------- */
/*                            POST /api/payment/create-qr                      */
/* -------------------------------------------------------------------------- */

router.post("/create-qr", async (req: Request, res: Response) => {
  const invoiceCode = req.body.invoiceCode || req.body.invoice_code || req.query.invoiceCode || req.query.invoice_code;
  const referenceId = req.body.referenceId || req.body.reference_id || req.query.referenceId || req.query.reference_id;
  const purpose = req.body.purpose || req.query.purpose || "invoice";

  const resolved = await resolveReferenceAmount(purpose, referenceId, invoiceCode);
  if (resolved.error) return void res.status(resolved.status).json({ error: resolved.error });
  const amount = resolved.amount as number;

  if (amount <= 0) {
    return void res.status(400).json({ error: "Invalid amount for QR generation" });
  }

  if (config.paymentMode === "mock") {
    return void res.json({
      success: true,
      qrId: "mock_qr_" + Date.now(),
      imageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=mock@upi&pn=Mock%20Payment&am=${amount}`,
      amount,
      demo: true,
    });
  }

  if (!config.razorpayKeyId || !config.razorpayKeySecret) {
    return void res.status(500).json({ error: "Razorpay keys not configured" });
  }

  try {
    const auth = Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString("base64");
    const rzpRes = await fetch("https://api.razorpay.com/v1/payments/qr_codes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        type: "upi_qr",
        name: "Medilink Healthcare",
        usage: "single_use",
        fixed_amount: true,
        payment_amount: Math.round(amount * 100),
        description: invoiceCode ? `Invoice ${invoiceCode}` : "Healthcare Payment",
        close_by: Math.floor(Date.now() / 1000) + 900,
      }),
    });

    if (!rzpRes.ok) {
      const err = await rzpRes.text();
      return void res.status(502).json({ error: err });
    }

    const qr = (await rzpRes.json()) as { id: string; image_url: string; amount: number };
    res.json({ success: true, qrId: qr.id, imageUrl: qr.image_url, amount });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                            POST /api/payment/verify-qr                      */
/* -------------------------------------------------------------------------- */

router.post("/verify-qr", async (req: Request, res: Response) => {
  const qrId = req.body.qrId || req.body.qr_id || req.query.qrId || req.query.qr_id;
  const invoiceCode = req.body.invoiceCode || req.body.invoice_code || req.query.invoiceCode || req.query.invoice_code;
  const referenceId = req.body.referenceId || req.body.reference_id || req.query.referenceId || req.query.reference_id;
  const purpose = req.body.purpose || req.query.purpose || "invoice";
  const amount = req.body.amount || req.query.amount;

  if (!qrId) return void res.status(400).json({ error: "qrId required" });

  const resolved = await resolveReferenceAmount(purpose, referenceId, invoiceCode);
  if (resolved.error) return void res.status(resolved.status).json({ error: resolved.error });
  const expectedAmount = resolved.amount as number;
  const invoiceId = (resolved as any).invoiceId as string | null;

  if (amount != null && !amountsMatch(Number(amount), expectedAmount)) {
    return void res.status(422).json({ error: "Payment amount does not match invoice" });
  }

  try {
    if (config.paymentMode === "mock") {
      const paymentId = "mock_payment_" + Date.now();
      if (await paymentAlreadyRecorded(paymentId)) {
        return void res.json({ verified: true, paymentId, alreadyRecorded: true });
      }
      await serviceClient.from("payments").insert({
        invoice_id: invoiceId,
        invoice_code: invoiceCode ?? null,
        amount: expectedAmount,
        method: "mock_qr",
        status: "COMPLETED",
        razorpay_payment_id: paymentId,
      });
      if (purpose === "pharmacy_order" && referenceId) {
        await serviceClient.from("pharmacy_public_orders").update({ status: "CONFIRMED" }).eq("id", referenceId);
      } else if (invoiceCode) {
        await serviceClient.from("invoices").update({ status: "PAID" }).eq("invoice_code", invoiceCode);
      }
      return void res.json({ verified: true, paymentId });
    }

    if (!config.razorpayKeyId || !config.razorpayKeySecret) {
      return void res.status(500).json({ error: "Razorpay keys not configured" });
    }

    const auth = Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString("base64");
    const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/qr_codes/${qrId}/payments`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!rzpRes.ok) {
      const err = await rzpRes.text();
      return void res.status(502).json({ error: err });
    }

    const data = (await rzpRes.json()) as { items?: { id: string; status: string }[] };
    const paid = (data.items ?? []).find((p) => p.status === "captured");

    if (paid) {
      if (await paymentAlreadyRecorded(paid.id)) {
        return void res.json({ verified: true, paymentId: paid.id, alreadyRecorded: true });
      }
      await serviceClient.from("payments").insert({
        invoice_id: invoiceId,
        invoice_code: invoiceCode ?? null,
        amount: expectedAmount,
        method: "upi_qr",
        status: "COMPLETED",
        razorpay_payment_id: paid.id ?? null,
      });
      if (purpose === "pharmacy_order" && referenceId) {
        await serviceClient.from("pharmacy_public_orders").update({ status: "CONFIRMED" }).eq("id", referenceId);
      } else if (invoiceCode) {
        await serviceClient.from("invoices").update({ status: "PAID" }).eq("invoice_code", invoiceCode);
      }
      return void res.json({ verified: true, paymentId: paid.id });
    }

    res.json({ verified: false });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* -------------------------------------------------------------------------- */
/*                            POST /api/payment/verify                         */
/* -------------------------------------------------------------------------- */

router.post("/verify", async (req: Request, res: Response) => {
  const invoiceCode = req.body.invoiceCode || req.body.invoice_code || req.query.invoiceCode || req.query.invoice_code;
  const referenceId = req.body.referenceId || req.body.reference_id || req.query.referenceId || req.query.reference_id;
  const purpose = req.body.purpose || req.query.purpose || "invoice";
  const amount = req.body.amount || req.query.amount;

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  // ── RAZORPAY: verify HMAC signature before writing anything or checking DB ──
  if (config.paymentMode === "razorpay") {
    if (!config.razorpayKeySecret) {
      return void res.status(500).json({ error: "Razorpay secret not configured" });
    }
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return void res.status(400).json({ error: "Invalid signature" });
    }
    const expected = crypto
      .createHmac("sha256", config.razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return void res.status(400).json({ error: "Invalid signature" });
    }
  }

  // A client can never supply the final status; it is derived server-side only.
  const requestedStatus = req.body.status;
  if (requestedStatus && String(requestedStatus).toUpperCase() !== "COMPLETED") {
    return void res.status(400).json({ error: "Invalid status supplied" });
  }

  const resolved = await resolveReferenceAmount(purpose, referenceId, invoiceCode);
  if (resolved.error) return void res.status(resolved.status).json({ error: resolved.error });
  const expectedAmount = resolved.amount as number;
  const invoiceId = (resolved as any).invoiceId as string | null;

  if (amount != null && !amountsMatch(Number(amount), expectedAmount)) {
    return void res.status(422).json({ error: "Payment amount does not match invoice" });
  }

  // Idempotency: if this gateway payment was already recorded, return the result.
  if (await paymentAlreadyRecorded(razorpay_payment_id)) {
    return void res.json({ verified: true, alreadyRecorded: true });
  }

  // ── MOCK: only reachable when demo mode is enabled (enforced at startup) ──
  const paymentId = razorpay_payment_id ?? "mock_payment_" + Date.now();
  await serviceClient.from("payments").insert({
    invoice_id: invoiceId,
    invoice_code: invoiceCode ?? null,
    amount: expectedAmount,
    method: config.paymentMode === "razorpay" ? "razorpay" : "mock_upi",
    status: "COMPLETED",
    razorpay_order_id: razorpay_order_id ?? null,
    razorpay_payment_id: paymentId,
  });

  if (purpose === "pharmacy_order" && referenceId) {
    await serviceClient
      .from("pharmacy_public_orders")
      .update({ status: "CONFIRMED" })
      .eq("id", referenceId);
  } else if (invoiceCode) {
    await serviceClient
      .from("invoices")
      .update({ status: "PAID" })
      .eq("invoice_code", invoiceCode);
  }

  res.json({ verified: true });
});

/* -------------------------------------------------------------------------- */
/*                            POST /api/payment/mark-cash                      */
/* -------------------------------------------------------------------------- */

router.post("/mark-cash", requireAuth, async (req: Request, res: Response) => {
  const invoiceCode = req.body.invoiceCode || req.body.invoice_code || req.query.invoiceCode || req.query.invoice_code;
  const referenceId = req.body.referenceId || req.body.reference_id || req.query.referenceId || req.query.reference_id;
  const purpose = req.body.purpose || req.query.purpose || "invoice";
  const amount = req.body.amount || req.query.amount;

  const resolved = await resolveReferenceAmount(purpose, referenceId, invoiceCode);
  if (resolved.error) return void res.status(resolved.status).json({ error: resolved.error });
  const expectedAmount = resolved.amount as number;
  const invoiceId = (resolved as any).invoiceId as string | null;

  if (amount != null && !amountsMatch(Number(amount), expectedAmount)) {
    return void res.status(422).json({ error: "Payment amount does not match invoice" });
  }

  const paymentId = "cash_" + Date.now();
  await serviceClient.from("payments").insert({
    invoice_id: invoiceId,
    invoice_code: invoiceCode ?? null,
    amount: expectedAmount,
    method: "cash",
    status: "COMPLETED",
    razorpay_payment_id: paymentId,
  });

  if (purpose === "pharmacy_order" && referenceId) {
    await serviceClient
      .from("pharmacy_public_orders")
      .update({ status: "CONFIRMED" })
      .eq("id", referenceId);
  } else if (invoiceCode) {
    await serviceClient
      .from("invoices")
      .update({ status: "PAID" })
      .eq("invoice_code", invoiceCode);
  }

  res.json({ verified: true, paymentId });
});

export default router;
