import { Router, Request, Response } from "express";
import { serviceClient } from "../lib/supabase";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
const INS_ROLES = ["INSURANCE_STAFF", "INSURANCE_ADMIN", "ADMIN", "SUPER_ADMIN", "HOSPITAL_ADMIN"];

// GET /api/insurance/claims
router.get("/claims", requireAuth, requireRole(INS_ROLES), async (req: Request, res: Response) => {
  try {
    const { data: claims, error } = await serviceClient
      .from("insurance_claims")
      .select("id,patient_id,policy_id,appointment_id,amount,status,decision_reason,settled_amount,created_at")
      .order("created_at", { ascending: false });

    if (error) return void res.status(500).json({ error: error.message });

    const { data: policies } = await serviceClient
      .from("insurance_policies")
      .select("id,policy_no,provider,coverage_amount,valid_until,patient_id")
      .order("created_at", { ascending: false });

    res.json({ success: true, claims: claims ?? [], policies: policies ?? [] });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/insurance/create
router.post("/create", requireAuth, async (req: Request, res: Response) => {
  try {
    const { patient_id, policy_id, appointment_id, amount } = req.body;
    if (!patient_id || !amount) return void res.status(400).json({ error: "patient_id and amount required" });

    const { data, error } = await serviceClient.from("insurance_claims").insert({
      patient_id,
      policy_id: policy_id ?? null,
      appointment_id: appointment_id ?? null,
      amount: Number(amount),
      status: "PENDING",
    }).select().single();

    if (error) return void res.status(500).json({ error: error.message });
    res.json({ success: true, claim: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/insurance/approve
router.patch("/approve", requireAuth, requireRole(INS_ROLES), async (req: Request, res: Response) => {
  try {
    const { claim_id, settled_amount, decision_reason } = req.body;
    if (!claim_id) return void res.status(400).json({ error: "claim_id required" });

    const { data: claim, error } = await serviceClient
      .from("insurance_claims")
      .update({ status: "APPROVED", settled_amount: Number(settled_amount ?? 0), decision_reason: decision_reason ?? null })
      .eq("id", claim_id).select().single();

    if (error) return void res.status(500).json({ error: error.message });

    // Update invoice insurance_deduction if linked appointment exists
    if (claim?.appointment_id) {
      const { data: inv } = await serviceClient
        .from("invoices").select("id,total,insurance_deduction").eq("appointment_id", claim.appointment_id).maybeSingle();
      if (inv) {
        const newDeduction = Number(settled_amount ?? 0);
        const newTotal = Math.max(0, (inv.total + inv.insurance_deduction) - newDeduction);
        await serviceClient.from("invoices").update({ insurance_deduction: newDeduction, total: newTotal }).eq("id", inv.id);
      }
    }

    await serviceClient.from("audit_logs").insert({
      action: "INSURANCE_APPROVED",
      entity: "insurance_claims",
      entity_id: claim_id,
      actor_id: (req as any).profile?.id ?? null,
      detail: `Insurance claim approved, settled: ${settled_amount}`,
    });

    res.json({ success: true, claim });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/insurance/reject
router.patch("/reject", requireAuth, requireRole(INS_ROLES), async (req: Request, res: Response) => {
  try {
    const { claim_id, decision_reason } = req.body;
    if (!claim_id) return void res.status(400).json({ error: "claim_id required" });

    const { data, error } = await serviceClient
      .from("insurance_claims")
      .update({ status: "REJECTED", decision_reason: decision_reason ?? null })
      .eq("id", claim_id).select().single();

    if (error) return void res.status(500).json({ error: error.message });

    await serviceClient.from("audit_logs").insert({
      action: "INSURANCE_REJECTED",
      entity: "insurance_claims",
      entity_id: claim_id,
      actor_id: (req as any).profile?.id ?? null,
      detail: `Insurance claim rejected: ${decision_reason}`,
    });

    res.json({ success: true, claim: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
