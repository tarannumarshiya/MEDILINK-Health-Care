import { Router, Request, Response } from "express";
import { getServiceClient, resolveRequestClient, dbErrorStatus } from "../lib/supabase";
import { requireAuth, requireRole } from "../middleware/auth";
import { STAFF_ROLES } from "../lib/roles";
import { isValidYmdDate } from "../lib/dates";

const router = Router();



function getNextReminderDate(frequency: string, startDate?: string) {
  let date = new Date();
  if (startDate && startDate.trim()) {
    const parsed = new Date(startDate);
    if (!isNaN(parsed.getTime())) {
      date = parsed;
    }
  }

  if (frequency === "daily") {
    date.setDate(date.getDate() + 1);
  } else if (frequency === "weekly") {
    date.setDate(date.getDate() + 7);
  } else if (frequency === "every_15_days") {
    date.setDate(date.getDate() + 15);
  } else {
    date.setMonth(date.getMonth() + 1);
  }

  return date.toISOString().split("T")[0];
}



/** Helper to check if a user role is in the allowed staff roles list */
function isStaff(role?: string): boolean {
  return role !== undefined && role !== "PATIENT" && STAFF_ROLES.includes(role as any);
}

/* -------------------------------------------------------------------------- */
/*  GET /api/reminders  —  return reminders for the authenticated user          */
/*  Require authentication and ownership verification                           */
/* -------------------------------------------------------------------------- */
router.get("/", async (req: Request, res: Response) => {
  try {
    const patientPhone = String(req.query.patient_phone || "").trim();
    const phoneToQuery = patientPhone;

    const authHeader = req.headers.authorization ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    let user = null;

    if (token) {
      const authClient = resolveRequestClient(req);
      const authRes = await authClient.auth.getUser(token);
      user = authRes?.data?.user;
    }

    // Reminders are PHI (medicine names + schedules). They are only ever
    // served to the authenticated owner — never to anonymous callers.
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { data: patient } = await getServiceClient()
      .from("patients")
      .select("phone")
      .eq("profile_id", user.id)
      .maybeSingle();

    // A phone passed via the query string must belong to the caller, unless
    // the caller is staff (medical staff may inspect a patient's reminders).
    if (phoneToQuery) {
      const { data: callerProfile } = await getServiceClient()
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      const staff = isStaff(callerProfile?.role);
      if (!staff && !(patient && patient.phone === phoneToQuery)) {
        return res.status(403).json({ success: false, error: "Forbidden" });
      }
    }

    const effectivePhone = phoneToQuery || patient?.phone;
    if (!effectivePhone) {
      return res.status(404).json({ success: false, error: "No patient record linked to this account" });
    }

    const { data, error } = await getServiceClient()
      .from("medicine_reminders")
      .select("id, medicine_id, medicine_name, frequency, start_date, next_reminder_date, notes, is_active, created_at")
      .eq("patient_phone", effectivePhone)
      .order("next_reminder_date", { ascending: true });

    if (error) return res.status(dbErrorStatus(error)).json({ success: false, error: error.message });
    return res.json({ success: true, reminders: data || [] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/* -------------------------------------------------------------------------- */
/*  POST /api/reminders  —  create a new reminder                             */
/*  Public create-by-phone is preserved (enables the pharmacy catalogue page). *
/*  Security hardening:                                                        */
/*    • profile_id is NEVER accepted from the request body.                    */
/*    • If the caller is authenticated AND has a patient profile, the          */
/*      reminder is ownership-linked to that patient so it can be managed      */
/*      through the authenticated GET/PUT/DELETE endpoints.                    */
/* -------------------------------------------------------------------------- */
router.post("/", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    let user = null;

    if (token) {
      const authClient = resolveRequestClient(req);
      const authRes = await authClient.auth.getUser(token);
      user = authRes?.data?.user;
    }

    const {
      patient_phone,
      medicine_id,
      medicine_name,
      frequency,
      start_date,
      notes,
    } = req.body;

    let profile_id: string | null = null;
    let phoneToUse = patient_phone ? String(patient_phone).trim() : "";

    if (user) {
      // Get the authenticated patient's phone number
      const { data: patient, error: patientError } = await getServiceClient()
        .from("patients")
        .select("phone")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (patientError) return res.status(500).json({ success: false, error: patientError.message });

      if (patient) {
        profile_id = user.id;
        if (phoneToUse) {
          if (phoneToUse !== patient.phone) {
            return res.status(403).json({ success: false, error: "Cannot create reminders for other users" });
          }
        } else {
          phoneToUse = patient.phone;
        }
      }
    }

    if (!phoneToUse || !medicine_name || !frequency) {
      return res.status(400).json({
        success: false,
        error: "patient_phone, medicine_name, and frequency are required",
      });
    }

    if (/[<>]/g.test(medicine_name)) {
      return res.status(400).json({ success: false, error: "Medicine name cannot contain HTML or script characters" });
    }

    if (notes && /[<>]/g.test(notes)) {
      return res.status(400).json({ success: false, error: "Notes cannot contain HTML or script characters" });
    }

    const phoneDigits = phoneToUse.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return res.status(400).json({ success: false, error: "Invalid phone number format" });
    }

    if (!["daily", "weekly", "every_15_days", "monthly"].includes(frequency)) {
      return res.status(422).json({ success: false, error: "Invalid frequency" });
    }

    if (start_date) {
      const startDateStr = String(start_date).trim();
      if (!isValidYmdDate(startDateStr)) {
        return res.status(400).json({ success: false, error: "Invalid start_date format. Use YYYY-MM-DD" });
      }
    }

    const next_reminder_date = getNextReminderDate(frequency, start_date);

    const { data, error } = await getServiceClient()
      .from("medicine_reminders")
      .insert({
        profile_id,
        patient_phone: phoneToUse,
        medicine_id: medicine_id ?? null,
        medicine_name,
        frequency,
        start_date: start_date || new Date().toISOString().split("T")[0],
        next_reminder_date,
        notes: notes || null,
        is_active: true,
      })
      .select("id, profile_id, medicine_id, medicine_name, frequency, start_date, next_reminder_date, notes, is_active, created_at")
      .single();

    if (error) return res.status(dbErrorStatus(error)).json({ success: false, error: error.message });
    return res.status(201).json({ success: true, reminder: data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/* -------------------------------------------------------------------------- */
/*  PUT /api/reminders/:id  —  update reminder (authenticated user only)     */
/*  Patients can only update their own reminders; staff use separate workflow */
/* -------------------------------------------------------------------------- */
router.put("/:id?", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { id: string };
    const profile = (req as any).profile as { role?: string };
    const id = req.params.id || req.body.id || req.query.id;

    if (!id) {
      if (!isStaff(profile?.role)) {
        return res.status(403).json({ success: false, error: "Forbidden" });
      }
      return res.status(400).json({ success: false, error: "Reminder ID is required" });
    }

    const { data: existing } = await getServiceClient()
      .from("medicine_reminders")
      .select("id, patient_phone")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      if (!isStaff(profile.role)) {
        return res.status(403).json({ success: false, error: "Forbidden" });
      }
      return res.status(404).json({ success: false, error: "Reminder not found" });
    }

    // Patients can only update their own reminders
    if (!isStaff(profile.role)) {
      const { data: patient } = await getServiceClient()
        .from("patients")
        .select("phone")
        .eq("profile_id", user.id)
        .maybeSingle();

      const ownsReminder = (patient && existing.patient_phone === patient.phone);
      if (!ownsReminder) {
        return res.status(403).json({ success: false, error: "Forbidden" });
      }
    }

    // Never allow a user to reassign ownership via the body.
    const { patient_phone, ...rest } = req.body;
    const updateData: any = { ...rest, updated_at: new Date().toISOString() };

    if (rest.frequency || rest.start_date) {
      updateData.next_reminder_date = getNextReminderDate(
        rest.frequency || "monthly",
        rest.start_date
      );
    }

    const { data, error } = await getServiceClient()
      .from("medicine_reminders")
      .update(updateData)
      .eq("id", id)
      .select("id, medicine_id, medicine_name, frequency, start_date, next_reminder_date, notes, is_active, created_at")
      .single();

    if (error) return res.status(dbErrorStatus(error)).json({ success: false, error: error.message });
    return res.json({ success: true, reminder: data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/* -------------------------------------------------------------------------- */
/*  DELETE /api/reminders/:id  —  delete a reminder by authenticated user      */
/*  Require authentication and ownership verification                           */
/* -------------------------------------------------------------------------- */
router.delete("/:id?", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { id: string };
    const profile = (req as any).profile as { role?: string };
    const id = req.params.id || req.body.id || req.query.id;

    if (!id) {
      if (!isStaff(profile?.role)) {
        return res.status(403).json({ success: false, error: "Forbidden" });
      }
      return res.status(400).json({ success: false, error: "Reminder ID is required" });
    }

    const { data: existing } = await getServiceClient()
      .from("medicine_reminders")
      .select("id, patient_phone")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      if (!isStaff(profile.role)) {
        return res.status(403).json({ success: false, error: "Forbidden" });
      }
      return res.status(404).json({ success: false, error: "Reminder not found" });
    }

    // Check ownership before deletion
    if (!isStaff(profile.role)) {
      const { data: patient } = await getServiceClient()
        .from("patients")
        .select("phone")
        .eq("profile_id", user.id)
        .maybeSingle();

      const ownsReminder = (patient && existing.patient_phone === patient.phone);
      if (!ownsReminder) {
        return res.status(403).json({ success: false, error: "Forbidden" });
      }
    }

    const { error } = await getServiceClient()
      .from("medicine_reminders")
      .delete()
      .eq("id", id);

    if (error) return res.status(dbErrorStatus(error)).json({ success: false, error: error.message });
    return res.json({ success: true, message: "Reminder deleted" });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;