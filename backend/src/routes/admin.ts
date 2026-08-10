import { Router, Request, Response } from "express";
import { createRequestClient, serviceClient } from "../lib/supabase";
import { requireAuth, requireRole } from "../middleware/auth";
import { generateInvoiceCode } from "../lib/ids";

// Roles permitted to manage hospital administration
const ADMIN_ROLES = [
  "ADMIN", "HOSPITAL_ADMIN", "DEPARTMENT_ADMIN", "SUPER_ADMIN",
];
// Roles that can approve/reject appointments
const APPT_MANAGE_ROLES = [
  "ADMIN", "HOSPITAL_ADMIN", "DEPARTMENT_ADMIN", "SUPER_ADMIN", "DOCTOR",
];

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// DEPARTMENTS  →  /api/admin/departments
// ─────────────────────────────────────────────────────────────────────────────

router.get("/departments", async (req: Request, res: Response) => {
  const supabase = createRequestClient(req);

  const { data, error } = await supabase
    .from("departments")
    .select("id, name, description, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) return void res.status(500).json({ error: error.message });
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
  res.json({ success: true, departments: data ?? [] });
});

router.post("/departments", requireAuth, requireRole(ADMIN_ROLES), async (req: Request, res: Response) => {
  const supabase = createRequestClient(req);
  const { name, description } = req.body;

  if (!name)
    return void res.status(400).json({ error: "Department name is required" });

  const { data, error } = await supabase
    .from("departments")
    .insert({ name, description: description ?? null, is_active: true })
    .select()
    .single();

  if (error) return void res.status(500).json({ error: error.message });
  res.json({ success: true, department: data });
});

router.patch("/departments", requireAuth, requireRole(ADMIN_ROLES), async (req: Request, res: Response) => {
  const supabase = createRequestClient(req);
  const { id, name, description, is_active } = req.body;

  if (!id)
    return void res.status(400).json({ error: "Department ID is required" });

  const payload: Record<string, unknown> = {};
  if (name !== undefined) payload.name = name;
  if (description !== undefined) payload.description = description;
  if (typeof is_active === "boolean") payload.is_active = is_active;

  const { data, error } = await supabase
    .from("departments")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return void res.status(500).json({ error: error.message });
  res.json({ success: true, department: data });
});

// ─────────────────────────────────────────────────────────────────────────────
// DOCTORS  →  /api/admin/doctors
// ─────────────────────────────────────────────────────────────────────────────

router.get("/doctors", async (req: Request, res: Response) => {
  const supabase = createRequestClient(req);

  const { data, error } = await supabase
    .from("doctors")
    .select(
      `id, profile_id, department_id, qualification, experience_years,
       consultation_fee, is_available, created_at,
       profiles:profile_id ( id, full_name, role, is_active ),
       departments:department_id ( id, name )`
    )
    .order("created_at", { ascending: false });

  if (error) return void res.status(500).json({ error: error.message });
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");

  const doctorsWithFlatten = (data ?? []).map((doctor: any) => {
    const profiles = Array.isArray(doctor.profiles) ? doctor.profiles[0] : doctor.profiles;
    const departments = Array.isArray(doctor.departments) ? doctor.departments[0] : doctor.departments;

    // Remove email from profiles object to be safe
    if (profiles) {
      delete profiles.email;
    }

    return {
      id: doctor.id,
      profile_id: doctor.profile_id,
      department_id: doctor.department_id,
      qualification: doctor.qualification,
      experience_years: doctor.experience_years,
      consultation_fee: doctor.consultation_fee,
      is_available: doctor.is_available,
      created_at: doctor.created_at,
      /* Flattened display fields */
      full_name: profiles?.full_name ?? null,
      role: profiles?.role ?? null,
      is_active: profiles?.is_active !== false,
      department_name: departments?.name ?? null,
      /* Preserve nested for compatibility */
      profiles,
      departments,
    };
  });

  // Filter out doctors whose profile has been deactivated
  const activeDoctors = doctorsWithFlatten.filter((d: any) => d.is_active);
  res.json({ success: true, doctors: activeDoctors });
});

router.post("/doctors", requireAuth, requireRole(ADMIN_ROLES), async (req: Request, res: Response) => {
  const {
    email,
    profile_id: explicitProfileId,
    department_id,
    qualification,
    experience_years,
    consultation_fee,
  } = req.body;

  if (!department_id)
    return void res.status(400).json({ error: "Department is required" });

  // Resolve profile_id via service role (bypasses RLS — same as original)
  let profile_id = explicitProfileId ?? null;
  if (!profile_id && email) {
    const { data: prof } = await serviceClient
      .from("profiles")
      .select("id")
      .eq("email", (email as string).trim().toLowerCase())
      .maybeSingle();
    profile_id = prof?.id ?? null;
  }

  if (!profile_id)
    return void res.status(404).json({
      error:
        "No profile found for that email. Create the staff account in User Mgmt first.",
    });

  const supabase = createRequestClient(req);
  const { data, error } = await supabase
    .from("doctors")
    .insert({
      profile_id,
      department_id,
      qualification: qualification ?? null,
      experience_years: Number(experience_years ?? 0),
      consultation_fee: Number(consultation_fee ?? 0),
      is_available: true,
    })
    .select()
    .single();

  if (error) return void res.status(500).json({ error: error.message });
  res.json({ success: true, doctor: data });
});

router.patch("/doctors", requireAuth, requireRole(ADMIN_ROLES), async (req: Request, res: Response) => {
  const supabase = createRequestClient(req);
  const {
    id,
    department_id,
    qualification,
    experience_years,
    consultation_fee,
    is_available,
  } = req.body;

  if (!id)
    return void res.status(400).json({ error: "Doctor ID is required" });

  const payload: Record<string, unknown> = {};
  if (department_id !== undefined) payload.department_id = department_id;
  if (qualification !== undefined) payload.qualification = qualification;
  if (experience_years !== undefined)
    payload.experience_years = Number(experience_years);
  if (consultation_fee !== undefined)
    payload.consultation_fee = Number(consultation_fee);
  if (typeof is_available === "boolean") payload.is_available = is_available;

  const { data, error } = await supabase
    .from("doctors")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return void res.status(500).json({ error: error.message });
  res.json({ success: true, doctor: data });
});

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENTS  →  /api/admin/appointments/*
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_APPT_STATUSES = ["APPROVED", "REJECTED"];

router.post("/appointments/approve", requireAuth, requireRole(APPT_MANAGE_ROLES), async (req: Request, res: Response) => {
  try {
    const supabase = createRequestClient(req);
    const { appointmentId, doctor_id } = req.body;

    if (!appointmentId)
      return void res.status(400).json({ error: "Appointment ID required" });

    const updates: Record<string, unknown> = { status: "APPROVED", updated_at: new Date().toISOString() };
    if (doctor_id) updates.doctor_id = doctor_id;

    const { data, error } = await supabase
      .from("appointments").update(updates).eq("id", appointmentId).select().single();

    if (error) return void res.status(500).json({ error: error.message });


    // Audit
    await serviceClient.from("audit_logs").insert({
      action: "APPOINTMENT_APPROVED",
      entity: "appointments",
      entity_id: appointmentId,
      actor_id: (req as any).profile?.id ?? null,
      detail: `Appointment approved, doctor: ${doctor_id ?? null}`,
    });

    // Notify patient
    if (data?.patient_id) {
      const { data: patient } = await serviceClient
        .from("patients").select("profile_id").eq("id", data.patient_id).single();
      if (patient?.profile_id) {
        await serviceClient.from("notifications").insert({
          user_id: patient.profile_id,
          type: "APPOINTMENT",
          title: "Appointment Approved",
          body: `Your appointment (${data.appointment_code}) has been approved. Please arrive on ${data.preferred_date}.`,
          entity_id: appointmentId,
          priority: "HIGH",
        });
      }
    }

    res.json({ success: true, appointment: data });
  } catch {
    res.status(500).json({ error: "Unable to approve appointment" });
  }
});

router.post("/appointments/reject", requireAuth, requireRole(APPT_MANAGE_ROLES), async (req: Request, res: Response) => {
  try {
    const supabase = createRequestClient(req);
    const { appointmentId } = req.body;

    if (!appointmentId)
      return void res
        .status(400)
        .json({ error: "Appointment ID required" });

    const { data, error } = await supabase
      .from("appointments")
      .update({ status: "REJECTED", updated_at: new Date().toISOString() })
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) return void res.status(500).json({ error: error.message });
    res.json({ success: true, appointment: data });
  } catch {
    res.status(500).json({ error: "Unable to reject appointment" });
  }
});

router.patch(
  "/appointments/update-status",
  requireAuth, requireRole(APPT_MANAGE_ROLES),
  async (req: Request, res: Response) => {
    try {
      const supabase = createRequestClient(req);
      const { appointment_id, status, doctor_id } = req.body;

      if (!appointment_id || !status)
        return void res
          .status(400)
          .json({ error: "Appointment ID and status are required" });

      if (!ALLOWED_APPT_STATUSES.includes(status))
        return void res
          .status(400)
          .json({ error: "Invalid status. Use APPROVED or REJECTED" });

      const payload: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (doctor_id) payload.doctor_id = doctor_id;

      const { data, error } = await supabase
        .from("appointments")
        .update(payload)
        .eq("id", appointment_id)
        .select()
        .single();

      if (error) return void res.status(500).json({ error: error.message });
      res.json({ success: true, appointment: data });
    } catch {
      res.status(500).json({ error: "Server error while updating appointment" });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT MESSAGES  →  /api/admin/contact-messages
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_MSG_STATUSES = ["NEW", "READ", "RESOLVED"];

router.get("/contact-messages", requireAuth, requireRole(ADMIN_ROLES), async (req: Request, res: Response) => {
  try {
    const supabase = createRequestClient(req);

    const { data, error } = await supabase
      .from("contact_messages")
      .select(
        "id, full_name, email, phone, subject, message, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) return void res.status(500).json({ error: error.message });
    res.json({ success: true, messages: data ?? [] });
  } catch {
    res
      .status(500)
      .json({ error: "Server error while loading contact messages" });
  }
});

router.patch("/contact-messages", requireAuth, requireRole(ADMIN_ROLES), async (req: Request, res: Response) => {
  try {
    const supabase = createRequestClient(req);
    const { id, status } = req.body;

    if (!id || !status)
      return void res
        .status(400)
        .json({ error: "Message ID and status are required" });

    if (!ALLOWED_MSG_STATUSES.includes(status))
      return void res
        .status(400)
        .json({ error: "Invalid status. Use NEW, READ, or RESOLVED" });

    const { data, error } = await supabase
      .from("contact_messages")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) return void res.status(500).json({ error: error.message });
    res.json({ success: true, message: data });
  } catch {
    res.status(500).json({ error: "Server error while updating message" });
  }
});

export default router;
