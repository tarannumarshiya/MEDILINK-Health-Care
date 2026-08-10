import { Router, Request, Response } from "express";
import { serviceClient } from "../lib/supabase";
import { requireAuth, requireRole } from "../middleware/auth";
import { generateInvoiceCode } from "../lib/ids";
import { BILLING_ROLES } from "../lib/roles";

const router = Router();

// ── GET /api/billing/invoices ─────────────────────────────────────────────────
router.get("/invoices", requireAuth, requireRole(BILLING_ROLES), async (req: Request, res: Response) => {
  try {
    const { data: invoices, error } = await serviceClient
      .from("invoices")
      .select("id,invoice_code,patient_id,appointment_id,patient_name,consultation_charge,lab_charge,medicine_charge,insurance_deduction,total,status,created_at")
      .order("created_at", { ascending: false });

    if (error) return void res.status(500).json({ error: error.message });
    res.json({ success: true, invoices: invoices ?? [] });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/billing/generate ────────────────────────────────────────────────
router.post("/generate", requireAuth, requireRole(BILLING_ROLES), async (req: Request, res: Response) => {
  try {
    const { appointment_id, consultation_charge, lab_charge, medicine_charge, insurance_deduction, patient_name, patient_id } = req.body;

    if (
      (consultation_charge !== undefined && (isNaN(Number(consultation_charge)) || Number(consultation_charge) < 0)) ||
      (lab_charge !== undefined && (isNaN(Number(lab_charge)) || Number(lab_charge) < 0)) ||
      (medicine_charge !== undefined && (isNaN(Number(medicine_charge)) || Number(medicine_charge) < 0)) ||
      (insurance_deduction !== undefined && (isNaN(Number(insurance_deduction)) || Number(insurance_deduction) < 0))
    ) {
      return void res.status(400).json({ error: "Charges and deductions must be non-negative numbers" });
    }

    if (patient_name && /[<>]/g.test(patient_name)) {
      return void res.status(400).json({ error: "Patient name cannot contain HTML or script characters" });
    }

    const total = Math.max(0,
      Number(consultation_charge ?? 0)
      + Number(lab_charge ?? 0)
      + Number(medicine_charge ?? 0)
      - Number(insurance_deduction ?? 0)
    );

    const { data, error } = await serviceClient.from("invoices").insert({
      invoice_code: generateInvoiceCode(),
      patient_id: patient_id ?? null,
      appointment_id,
      patient_name: patient_name ?? null,
      consultation_charge: Number(consultation_charge ?? 0),
      lab_charge: Number(lab_charge ?? 0),
      medicine_charge: Number(medicine_charge ?? 0),
      insurance_deduction: Number(insurance_deduction ?? 0),
      total,
      status: "UNPAID",
    }).select().single();

    if (error) return void res.status(500).json({ error: error.message });

    await serviceClient.from("audit_logs").insert({
      action: "INVOICE_GENERATED",
      entity: "invoices",
      entity_id: data.id,
      actor_id: (req as any).profile?.id ?? null,
      detail: `Invoice ${data.invoice_code} generated, total ${total}`,
    });

    res.json({ success: true, invoice: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── PATCH /api/billing/pay ────────────────────────────────────────────────────
router.patch("/pay", requireAuth, requireRole(BILLING_ROLES), async (req: Request, res: Response) => {
  try {
    const { invoice_id, method, amount } = req.body;
    if (!invoice_id) return void res.status(400).json({ error: "invoice_id required" });

    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) < 0)) {
      return void res.status(400).json({ error: "Payment amount must be a non-negative number" });
    }

    const { data: invoice, error: invErr } = await serviceClient
      .from("invoices").select("*").eq("id", invoice_id).single();
    if (invErr || !invoice) return void res.status(404).json({ error: "Invoice not found" });

    // If already PAID (e.g., Razorpay verify already handled it), return success
    if (invoice.status === "PAID") {
      return void res.json({ success: true, already_paid: true });
    }

    // Mark invoice paid
    const { error: updErr } = await serviceClient
      .from("invoices").update({ status: "PAID" }).eq("id", invoice_id);
    if (updErr) return void res.status(500).json({ error: updErr.message });

    // Write to payments
    await serviceClient.from("payments").insert({
      invoice_id,
      invoice_code: invoice.invoice_code,
      amount: amount ?? invoice.total,
      method: method ?? "cash",
      status: "COMPLETED",
    });

    // Update appointment → COMPLETED
    if (invoice.appointment_id) {
      await serviceClient.from("appointments").update({
        status: "COMPLETED",
        updated_at: new Date().toISOString(),
      }).eq("id", invoice.appointment_id);

      // Notify patient
      const { data: appt } = await serviceClient
        .from("appointments").select("patient_id,patient_name").eq("id", invoice.appointment_id).single();
      if (appt?.patient_id) {
        const { data: patient } = await serviceClient.from("patients").select("profile_id").eq("id", appt.patient_id).single();
        if (patient?.profile_id) {
          await serviceClient.from("notifications").insert({
            user_id: patient.profile_id,
            type: "BILLING",
            title: "Payment Confirmed",
            body: `Payment of ৳${Number(amount ?? invoice.total).toLocaleString()} received. Your appointment is now complete.`,
            entity_id: invoice_id,
            priority: "NORMAL",
          });
        }
      }
    }

    await serviceClient.from("audit_logs").insert({
      action: "INVOICE_PAID",
      entity: "invoices",
      entity_id: invoice_id,
      actor_id: (req as any).profile?.id ?? null,
      detail: `Invoice paid via ${method}`,
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/billing/revenue ──────────────────────────────────────────────────
router.get("/revenue", requireAuth, requireRole(BILLING_ROLES), async (req: Request, res: Response) => {
  try {
    const { data: invoices } = await serviceClient
      .from("invoices").select("id,invoice_code,total,status,consultation_charge,lab_charge,medicine_charge,insurance_deduction,created_at,patient_name")
      .order("created_at", { ascending: false });

    // Only count payments that were actually confirmed (SUCCESS or COMPLETED)
    const { data: payments } = await serviceClient
      .from("payments").select("amount,status,method,created_at")
      .in("status", ["SUCCESS", "COMPLETED"]);

    const paidInvoices   = (invoices ?? []).filter((i: any) => i.status === "PAID");
    const unpaidInvoices = (invoices ?? []).filter((i: any) => i.status === "UNPAID");

    // Revenue = sum of confirmed payment amounts (single source of truth)
    const totalRevenue   = (payments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);
    const totalInsurance = (invoices ?? []).reduce((s: number, i: any) => s + Number(i.insurance_deduction ?? 0), 0);
    const totalPending   = unpaidInvoices.reduce((s: number, i: any) => s + Number(i.total), 0);

    // Charge breakdown from PAID invoices for the revenue chart
    const consultationRevenue = paidInvoices.reduce((s: number, i: any) => s + Number(i.consultation_charge ?? 0), 0);
    const labRevenue          = paidInvoices.reduce((s: number, i: any) => s + Number(i.lab_charge ?? 0), 0);
    const medicineRevenue     = paidInvoices.reduce((s: number, i: any) => s + Number(i.medicine_charge ?? 0), 0);

    // Payment method breakdown
    const byMethod: Record<string, number> = {};
    for (const p of (payments ?? [])) {
      const m = (p.method ?? "other").toLowerCase();
      byMethod[m] = (byMethod[m] ?? 0) + Number(p.amount);
    }

    res.json({
      success: true,
      revenue: { total: totalRevenue, insurance: totalInsurance, pending: totalPending },
      breakdown: { consultation: consultationRevenue, lab: labRevenue, medicine: medicineRevenue },
      byMethod,
      invoices: invoices ?? [],
      payments: payments ?? [],
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/billing/payments ─────────────────────────────────────────────────
router.get("/payments", requireAuth, requireRole(BILLING_ROLES), async (req: Request, res: Response) => {
  try {
    // Join invoices to get invoice_code and patient_name alongside payment rows
    const { data, error } = await serviceClient
      .from("payments")
      .select(`
        id, invoice_id, amount, method, status, created_at,
        invoices ( invoice_code, patient_name )
      `)
      .order("created_at", { ascending: false });

    if (error) return void res.status(500).json({ error: error.message });

    // Flatten the joined data for the frontend
    const payments = (data ?? []).map((p: any) => ({
      id:           p.id,
      invoice_id:   p.invoice_id,
      amount:       p.amount,
      method:       p.method,
      status:       p.status,
      created_at:   p.created_at,
      invoice_code: p.invoices?.invoice_code ?? null,
      patient_name: p.invoices?.patient_name ?? null,
    }));

    res.json({ success: true, payments });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
