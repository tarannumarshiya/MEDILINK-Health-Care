import { Router, Request, Response } from "express";
import { getServiceClient } from "../lib/supabase";
import { requireAuth, requireRole } from "../middleware/auth";
import { INSURANCE_ROLES } from "../lib/roles";

const router = Router();
const INS_ROLES = INSURANCE_ROLES;

// GET /api/insurance/claims
router.get("/claims", requireAuth, requireRole(INS_ROLES), async (req: Request, res: Response) => {
  try {
    const { data: claims, error } = await getServiceClient()
      .from("insurance_claims")
      .select("id,patient_id,policy_id,appointment_id,amount,status,decision_reason,settled_amount,created_at")
      .order("created_at", { ascending: false });

    if (error) return void res.status(500).json({ error: error.message });

    const { data: policies } = await getServiceClient()
      .from("insurance_policies")
      .select("id,policy_no,provider,coverage_amount,valid_until,patient_id")
      .order("created_at", { ascending: false });

    res.json({ success: true, claims: claims ?? [], policies: policies ?? [] });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/insurance/create
// Patients can create claims only for themselves. Staff can create for any patient.
router.post("/create", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const profile = (req as any).profile;
    const { patient_id, policy_id, appointment_id, amount } = req.body;
    if (amount === undefined || amount === null || amount === "") {
      return void res.status(422).json({ error: "amount required" });
    }

    const isStaff = profile?.role && INS_ROLES.includes(profile.role);

    // Resolve the target patient_id:
    // - If patient_id is provided and caller is staff, allow it.
    // - If patient_id is provided and caller is a patient, only allow self.
    // - If patient_id is not provided, resolve from the caller's profile.
    let targetPatientId: string;
    if (patient_id) {
      if (!isStaff) {
        // Patient: verify this patient_id belongs to them
        const { data: ownedPatient } = await getServiceClient()
          .from("patients")
          .select("id")
          .eq("id", patient_id)
          .eq("profile_id", user.id)
          .maybeSingle();
        if (!ownedPatient) {
          return void res.status(403).json({ error: "You can only create claims for yourself" });
        }
      }
      targetPatientId = patient_id;
    } else {
      // Resolve from authenticated user's profile
      const { data: ownedPatient } = await getServiceClient()
        .from("patients")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
      if (!ownedPatient) {
        return void res.status(400).json({ error: "No patient record found for this account" });
      }
      targetPatientId = ownedPatient.id;
    }

    // Validate amount is positive
    const claimAmount = Number(amount);
    if (isNaN(claimAmount) || claimAmount <= 0) {
      return void res.status(422).json({ error: "Amount must be a positive number" });
    }

    const { data, error } = await getServiceClient().from("insurance_claims").insert({
      patient_id: targetPatientId,
      policy_id: policy_id ?? null,
      appointment_id: appointment_id ?? null,
      amount: claimAmount,
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

    const { data: existing } = await getServiceClient()
      .from("insurance_claims").select("id").eq("id", claim_id).maybeSingle();
    if (!existing) return void res.status(404).json({ error: "Claim not found" });

    const { data: claim, error } = await getServiceClient()
      .from("insurance_claims")
      .update({ status: "APPROVED", settled_amount: Number(settled_amount ?? 0), decision_reason: decision_reason ?? null })
      .eq("id", claim_id).select().single();

    if (error) return void res.status(500).json({ error: error.message });

    // Update invoice insurance_deduction if linked appointment exists
    if (claim?.appointment_id) {
      const { data: inv } = await getServiceClient()
        .from("invoices").select("id,total,insurance_deduction").eq("appointment_id", claim.appointment_id).maybeSingle();
      if (inv) {
        const newDeduction = Number(settled_amount ?? 0);
        const newTotal = Math.max(0, (inv.total + inv.insurance_deduction) - newDeduction);
        await getServiceClient().from("invoices").update({ insurance_deduction: newDeduction, total: newTotal }).eq("id", inv.id);
      }
    }

    await getServiceClient().from("audit_logs").insert({
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

    const { data: existing } = await getServiceClient()
      .from("insurance_claims").select("id").eq("id", claim_id).maybeSingle();
    if (!existing) return void res.status(404).json({ error: "Claim not found" });

    const { data, error } = await getServiceClient()
      .from("insurance_claims")
      .update({ status: "REJECTED", decision_reason: decision_reason ?? null })
      .eq("id", claim_id).select().single();

    if (error) return void res.status(500).json({ error: error.message });

    await getServiceClient().from("audit_logs").insert({
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
