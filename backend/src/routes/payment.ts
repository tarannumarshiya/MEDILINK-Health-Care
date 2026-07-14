import { Router, Request, Response } from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { serviceClient } from "../lib/supabase";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

const SETTINGS_FILE = path.join(__dirname, "../lib/settings.json");

function getSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
      return {
        RAZORPAY_KEY_ID: data.RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID,
        RAZORPAY_KEY_SECRET: data.RAZORPAY_KEY_SECRET ?? process.env.RAZORPAY_KEY_SECRET,
      };
    }
  } catch (err) {
    console.error("Error reading settings.json", err);
  }
  return {
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  };
}

function saveSettings(settings: Record<string, string>) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

// GET /api/payment/public-settings
router.get("/public-settings", (req: Request, res: Response) => {
  const { RAZORPAY_KEY_ID } = getSettings();
  res.json({ success: true, RAZORPAY_KEY_ID });
});

// GET /api/payment/settings (Super Admin only)
router.get(
  "/settings",
  requireAuth,
  requireRole(["SUPER_ADMIN"]),
  (req: Request, res: Response) => {
    res.json({ success: true, settings: getSettings() });
  }
);

// POST /api/payment/settings (Super Admin only)
router.post(
  "/settings",
  requireAuth,
  requireRole(["SUPER_ADMIN"]),
  (req: Request, res: Response) => {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = req.body;
    saveSettings({ RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET });
    res.json({ success: true, message: "Settings saved successfully" });
  }
);

// POST /api/payment/create-order
router.post("/create-order", async (req: Request, res: Response) => {
  const {
    invoiceCode,
    purpose = "invoice",
    referenceId,
  }: { invoiceCode: string; purpose?: string; referenceId?: string } =
    req.body;

  const mode = process.env.PAYMENTS_MODE ?? "mock";

  let amount: number;

  if (purpose === "pharmacy_order" && referenceId) {
    const { data, error } = await serviceClient
      .from("pharmacy_public_orders")
      .select("total")
      .eq("id", referenceId)
      .single();
    if (error || !data)
      return void res.status(404).json({ error: "Order not found" });
    amount = data.total;
  } else {
    const { data, error } = await serviceClient
      .from("invoices")
      .select("total")
      .eq("invoice_code", invoiceCode)
      .single();
    if (error || !data)
      return void res.status(404).json({ error: "Invoice not found" });
    amount = data.total;
  }

  // ── MOCK ──
  if (mode !== "live") {
    return void res.json({
      orderId: `mock_order_${Date.now()}`,
      amount,
    });
  }

  // ── LIVE: call Razorpay Orders API ──
  const { RAZORPAY_KEY_ID: keyId, RAZORPAY_KEY_SECRET: keySecret } = getSettings();
  if (!keyId || !keySecret) return void res.status(500).json({ error: "Razorpay keys not configured" });

  const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString(
        "base64"
      )}`,
    },
    body: JSON.stringify({
      amount: amount * 100,
      currency: "INR",
      receipt: invoiceCode,
    }),
  });

  if (!rzpRes.ok) {
    const err = await rzpRes.text();
    return void res.status(502).json({ error: err });
  }

  const rzpData = (await rzpRes.json()) as { id: string };
  res.json({ orderId: rzpData.id, amount });
});

// POST /api/payment/create-qr — generates a Razorpay QR code for UPI scan-to-pay
router.post("/create-qr", async (req: Request, res: Response) => {
  const { invoiceCode, purpose = "invoice", referenceId } = req.body;
  const { RAZORPAY_KEY_ID: keyId, RAZORPAY_KEY_SECRET: keySecret } = getSettings();

  if (!keyId || !keySecret)
    return void res.status(500).json({ error: "Razorpay keys not configured" });

  // Resolve the amount from invoice or pharmacy order
  let amount = 0;
  if (purpose === "pharmacy_order" && referenceId) {
    const { data } = await serviceClient
      .from("pharmacy_public_orders").select("total").eq("id", referenceId).single();
    if (data) amount = data.total;
  } else if (invoiceCode) {
    const { data } = await serviceClient
      .from("invoices").select("total").eq("invoice_code", invoiceCode).single();
    if (data) amount = data.total;
  }

  if (!amount || amount <= 0)
    return void res.status(400).json({ error: "Invalid amount for QR generation" });

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
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
        payment_amount: amount * 100, // paise
        description: invoiceCode ? `Invoice ${invoiceCode}` : "Healthcare Payment",
        close_by: Math.floor(Date.now() / 1000) + 900, // expires in 15 min
      }),
    });

    if (!rzpRes.ok) {
      const err = await rzpRes.text();
      return void res.status(502).json({ error: err });
    }

    const qr = await rzpRes.json() as { id: string; image_url: string; amount: number };
    res.json({ success: true, qrId: qr.id, imageUrl: qr.image_url, amount });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/payment/verify-qr — polls Razorpay QR payment status
router.post("/verify-qr", async (req: Request, res: Response) => {
  const { qrId, invoiceCode, purpose = "invoice", referenceId, amount } = req.body;
  if (!qrId) return void res.status(400).json({ error: "qrId required" });

  const { RAZORPAY_KEY_ID: keyId, RAZORPAY_KEY_SECRET: keySecret } = getSettings();
  if (!keyId || !keySecret)
    return void res.status(500).json({ error: "Razorpay keys not configured" });

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/qr_codes/${qrId}/payments`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!rzpRes.ok) {
      const err = await rzpRes.text();
      return void res.status(502).json({ error: err });
    }

    const data = await rzpRes.json() as { items?: { id: string; status: string }[] };
    const paid = (data.items ?? []).find((p) => p.status === "captured");

    if (paid) {
      // Record the payment in DB
      let invoice_id = null;
      if (invoiceCode) {
        const { data: inv } = await serviceClient
          .from("invoices").select("id").eq("invoice_code", invoiceCode).maybeSingle();
        if (inv) invoice_id = inv.id;
      }
      await serviceClient.from("payments").insert({
        invoice_id,
        invoice_code: invoiceCode ?? null,
        amount: amount ?? 0,
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


router.post("/verify", async (req: Request, res: Response) => {
  const mode = process.env.PAYMENTS_MODE ?? "mock";
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    invoiceCode,
    purpose = "invoice",
    referenceId,
    amount,
  } = req.body;

  // ── LIVE: verify Razorpay HMAC ──
  if (mode === "live") {
    const { RAZORPAY_KEY_SECRET: keySecret } = getSettings();
    if (!keySecret) return void res.status(500).json({ error: "Razorpay secret not configured" });
    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature)
      return void res.status(400).json({ error: "Invalid signature" });
  }

  let invoice_id = null;
  if (invoiceCode) {
    const { data: inv } = await serviceClient
      .from("invoices")
      .select("id")
      .eq("invoice_code", invoiceCode)
      .maybeSingle();
    if (inv) invoice_id = inv.id;
  }

  // ── Write to DB (both mock and live) ──
  await serviceClient.from("payments").insert({
    invoice_id,
    invoice_code: invoiceCode ?? null,
    amount: amount ?? 0,
    method: mode === "live" ? "razorpay" : "mock_upi",
    status: "COMPLETED",
    razorpay_order_id: razorpay_order_id ?? null,
    razorpay_payment_id: razorpay_payment_id ?? null,
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

export default router;
