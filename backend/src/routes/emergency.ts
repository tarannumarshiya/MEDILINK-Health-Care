import { Router, Request, Response } from "express";
import { serviceClient } from "../lib/supabase";
import { requireAuth, requireRole } from "../middleware/auth";
import { EMERGENCY_ROLES } from "../lib/roles";

const router = Router();
const EM_ROLES = EMERGENCY_ROLES;

// GET /api/emergency/public-status  — no auth, shows bed availability for patients
router.get("/public-status", async (_req: Request, res: Response) => {
  try {
    const { data: beds } = await serviceClient
      .from("beds")
      .select("ward, is_occupied")
      .order("ward");

    const wardSummary: Record<string, { total: number; available: number }> = {};
    for (const bed of beds ?? []) {
      if (!wardSummary[bed.ward]) wardSummary[bed.ward] = { total: 0, available: 0 };
      wardSummary[bed.ward].total++;
      if (!bed.is_occupied) wardSummary[bed.ward].available++;
    }

    const totalBeds = (beds ?? []).length;
    const availableBeds = (beds ?? []).filter(b => !b.is_occupied).length;

    res.json({ success: true, totalBeds, availableBeds, wards: wardSummary });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/emergency/sos — no auth required, patient submits SOS request
router.post("/sos", async (req: Request, res: Response) => {
  try {
    const { patient_name, phone, location, emergency_type, description, age } = req.body;
    if (!patient_name || !phone) {
      res.status(400).json({ error: "patient_name and phone are required" });
      return;
    }

    const phoneDigits = String(phone).replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      res.status(400).json({ error: "Invalid phone number format" });
      return;
    }

    let parsedAge = null;
    if (age !== undefined && age !== null && age !== "") {
      parsedAge = Number(age);
      if (isNaN(parsedAge) || !isFinite(parsedAge) || parsedAge < 0) {
        res.status(400).json({ error: "Age must be a non-negative number" });
        return;
      }
    }

    const { data, error } = await serviceClient
      .from("emergency_sos_requests")
      .insert({
        patient_name,
        phone: phoneDigits,
        location: location ?? null,
        emergency_type: emergency_type ?? "GENERAL",
        description: description ?? null,
        age: parsedAge,
        status: "PENDING",
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, fall back gracefully
      if (error.code === "42P01") {
        res.status(503).json({ error: "SOS service temporarily unavailable. Please call emergency hotline." });
        return;
      }
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, request: data, message: "SOS received. Emergency team will call you shortly." });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/emergency/sos-requests — admin only, see incoming SOS requests
router.get("/sos-requests", requireAuth, requireRole(EM_ROLES), async (_req: Request, res: Response) => {
  try {
    const { data, error } = await serviceClient
      .from("emergency_sos_requests")
      .select("*")
      .not("status", "eq", "RESOLVED")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "42P01") {
        res.json({ success: true, requests: [] });
        return;
      }
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, requests: data ?? [] });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/emergency/sos-update — admin updates SOS request status
router.patch("/sos-update", requireAuth, requireRole(EM_ROLES), async (req: Request, res: Response) => {
  try {
    const { request_id, status, admin_notes } = req.body;
    if (!request_id || !status) {
      res.status(400).json({ error: "request_id and status required" });
      return;
    }

    const { data, error } = await serviceClient
      .from("emergency_sos_requests")
      .update({ status, admin_notes: admin_notes ?? null })
      .eq("id", request_id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true, request: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/emergency/cases
router.get("/cases", requireAuth, requireRole(EM_ROLES), async (_req: Request, res: Response) => {
  try {
    const { data: cases, error } = await serviceClient
      .from("emergency_cases")
      .select("id,patient_name,age,gender,department,description,severity,status,bed_id,arrived_at,created_at")
      .not("status", "eq", "DISCHARGED")
      .order("arrived_at", { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const { data: beds } = await serviceClient
      .from("beds")
      .select("id,ward,bed_no,is_occupied,patient_id,patient_name")
      .order("ward").order("bed_no");

    res.json({ success: true, cases: cases ?? [], beds: beds ?? [] });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/emergency/create
router.post("/create", requireAuth, requireRole(EM_ROLES), async (req: Request, res: Response) => {
  try {
    const { patient_name, age, gender, department, description, severity, phone, sos_request_id } = req.body;
    if (!patient_name) {
      res.status(400).json({ error: "patient_name required" });
      return;
    }

    const { data, error } = await serviceClient.from("emergency_cases").insert({
      patient_name,
      age: age ? Number(age) : null,
      gender: gender ?? null,
      department: department ?? "Emergency / Trauma",
      description: description ?? null,
      severity: severity ?? "NORMAL",
      status: "WAITING",
    }).select().single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // If created from an SOS request, mark it as CONVERTED
    if (sos_request_id) {
      await serviceClient
        .from("emergency_sos_requests")
        .update({ status: "CONVERTED", case_id: data.id })
        .eq("id", sos_request_id);
    }

    await serviceClient.from("audit_logs").insert({
      action: "EMERGENCY_CASE_CREATED",
      entity: "emergency_cases",
      entity_id: data.id,
      actor_id: (req as any).profile?.id ?? null,
      detail: `Emergency case created: ${patient_name}, severity: ${severity}`,
    });

    res.json({ success: true, case: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/emergency/update-status
router.patch("/update-status", requireAuth, requireRole(EM_ROLES), async (req: Request, res: Response) => {
  try {
    const idToUse = req.body.case_id || req.body.id;
    const { status } = req.body;
    if (!idToUse || !status) {
      res.status(400).json({ error: "case_id and status required" });
      return;
    }

    const { data, error } = await serviceClient
      .from("emergency_cases").update({ status }).eq("id", idToUse).select().maybeSingle();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    if (!data) {
      res.status(404).json({ error: "Emergency case not found" });
      return;
    }
    res.json({ success: true, case: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/emergency/assign-bed
router.patch("/assign-bed", requireAuth, requireRole(EM_ROLES), async (req: Request, res: Response) => {
  try {
    const caseIdToUse = req.body.case_id || req.body.id;
    const bedIdToUse = req.body.bed_id || req.body.bedId;
    if (!caseIdToUse || !bedIdToUse) {
      res.status(400).json({ error: "case_id and bed_id required" });
      return;
    }

    const { data: emCase } = await serviceClient.from("emergency_cases").select("patient_name").eq("id", caseIdToUse).maybeSingle();

    await serviceClient.from("beds").update({
      is_occupied: true,
      patient_name: emCase?.patient_name ?? null,
    }).eq("id", bedIdToUse);

    const { data, error } = await serviceClient
      .from("emergency_cases").update({ bed_id: bedIdToUse, status: "ADMITTED" }).eq("id", caseIdToUse).select().maybeSingle();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    if (!data) {
      res.status(404).json({ error: "Emergency case not found" });
      return;
    }
    res.json({ success: true, case: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
