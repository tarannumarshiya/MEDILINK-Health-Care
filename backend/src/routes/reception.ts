import { Router, Request, Response } from "express";
import { serviceClient } from "../lib/supabase";
import { requireAuth, requireRole } from "../middleware/auth";
import { generateAppointmentCode, generatePatientCode, generateInvoiceCode } from "../lib/ids";
import { ADMIN_ROLES } from "../lib/roles";

const router = Router();
const REC_ROLES = ["RECEPTIONIST", "RECEPTION_ADMIN", ...ADMIN_ROLES];

// GET /api/reception/queue
router.get("/queue", requireAuth, requireRole(REC_ROLES), async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [apptRes, patRes, docRes, walkInRes] = await Promise.all([
      serviceClient.from("appointments")
        .select("id,appointment_code,patient_name,patient_phone,department,preferred_date,preferred_time,symptoms,status")
        .eq("preferred_date", today).order("preferred_time", { ascending: true }),
      serviceClient.from("patients")
        .select("id,patient_code,full_name,phone,email,age,created_at")
        .order("created_at", { ascending: false }).limit(100),
      serviceClient.from("doctors")
        .select("id,is_available,qualification,experience_years,consultation_fee,profiles:profile_id(full_name),departments:department_id(name)"),
      serviceClient.from("walk_in_queue")
        .select("id,patient_name,phone,department,reason,arrived_at,status,position")
        .not("status", "eq", "DONE").order("position", { ascending: true }),
    ]);

    const doctors = (docRes.data ?? []).map((d: any) => ({
      id: d.id,
      full_name: (Array.isArray(d.profiles) ? d.profiles[0] : d.profiles)?.full_name ?? "Doctor",
      department_name: (Array.isArray(d.departments) ? d.departments[0] : d.departments)?.name ?? "General",
      qualification: d.qualification,
      experience_years: d.experience_years,
      consultation_fee: d.consultation_fee,
      is_available: d.is_available,
    }));

    res.json({
      success: true,
      appointments: apptRes.data ?? [],
      patients: patRes.data ?? [],
      doctors,
      walkIns: walkInRes.data ?? [],
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/reception/walk-in
router.post("/walk-in", requireAuth, requireRole(REC_ROLES), async (req: Request, res: Response) => {
  try {
    const { patient_name, phone, department, reason } = req.body;
    if (!patient_name || !department) return void res.status(400).json({ error: "patient_name and department required" });

    // Get next position
    const { count } = await serviceClient.from("walk_in_queue")
      .select("*", { count: "exact", head: true }).not("status", "eq", "DONE");
    const position = (count ?? 0) + 1;

    const { data, error } = await serviceClient.from("walk_in_queue").insert({
      patient_name,
      phone: phone ?? null,
      department,
      reason: reason ?? null,
      arrived_at: new Date().toISOString(),
      status: "WAITING",
      position,
    }).select().single();

    if (error) return void res.status(500).json({ error: error.message });
    res.json({ success: true, walkIn: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/reception/check-in
router.post("/check-in", requireAuth, requireRole(REC_ROLES), async (req: Request, res: Response) => {
  try {
    const { full_name, age, phone, email, department, symptoms } = req.body;
    if (!full_name || !department) return void res.status(400).json({ error: "full_name and department required" });

    // Dedup patient
    let orFilter = `phone.eq.${phone}`;
    if (email) orFilter += `,email.eq.${email}`;

    const { data: existing } = await serviceClient.from("patients")
      .select("id,patient_code,full_name").or(orFilter).maybeSingle();

    let patient = existing;
    if (!patient) {
      const { data: created, error: pErr } = await serviceClient.from("patients").insert({
        patient_code: generatePatientCode(),
        full_name, age: age ? Number(age) : null, phone,
        email: email ?? null,
      }).select().single();
      if (pErr || !created) return void res.status(500).json({ error: pErr?.message ?? "Patient creation failed" });
      patient = created;
    }

    // TypeScript: patient is guaranteed non-null at this point (created if not found above)
    const safePatient = patient!;

    const { data: deptRow } = await serviceClient.from("departments")
      .select("id").ilike("name", department).maybeSingle();

    if (!safePatient) {
      return res.status(404).json({
        success: false,
        error: "Patient not found",
      });
    }

    const { data: appt, error: aErr } = await serviceClient.from("appointments").insert({
      appointment_code: generateAppointmentCode(),
      patient_id: safePatient.id,
      patient_name: full_name,
      patient_phone: phone,
      patient_email: email ?? null,
      department,
      department_id: deptRow?.id ?? null,
      preferred_date: new Date().toISOString().slice(0, 10),
      symptoms: symptoms ?? null,
      status: "APPROVED",
    }).select().single();

    if (aErr || !appt) return void res.status(500).json({ error: aErr?.message ?? "Appointment creation failed" });

    // --- AUTO-GENERATE INVOICE ---
    let fee = 500; // Default fallback fee
    const { data: existingInv } = await serviceClient
      .from("invoices")
      .select("id")
      .eq("appointment_id", appt.id)
      .maybeSingle();

    if (!existingInv) {
      await serviceClient.from("invoices").insert({
        invoice_code: generateInvoiceCode(),
        patient_id: safePatient.id,
        appointment_id: appt.id,
        patient_name: full_name,
        consultation_charge: fee,
        lab_charge: 0,
        medicine_charge: 0,
        insurance_deduction: 0,
        total: fee,
        status: "UNPAID",
      });
    }
    // -----------------------------

    res.json({ success: true, patient: safePatient, appointment: appt });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/reception/walk-in-status
router.patch("/walk-in-status", requireAuth, requireRole(REC_ROLES), async (req: Request, res: Response) => {
  try {
    const { id, status } = req.body;
    if (!id || !status) return void res.status(400).json({ error: "id and status required" });

    const { data, error } = await serviceClient.from("walk_in_queue")
      .update({ status }).eq("id", id).select().single();

    if (error) return void res.status(500).json({ error: error.message });
    res.json({ success: true, walkIn: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/reception/toggle-doctor
router.patch("/toggle-doctor", requireAuth, requireRole(REC_ROLES), async (req: Request, res: Response) => {
  try {
    const { doctor_id, is_available } = req.body;
    if (!doctor_id) return void res.status(400).json({ error: "doctor_id required" });

    const { data, error } = await serviceClient.from("doctors")
      .update({ is_available: Boolean(is_available) }).eq("id", doctor_id).select().single();

    if (error) return void res.status(500).json({ error: error.message });
    res.json({ success: true, doctor: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
