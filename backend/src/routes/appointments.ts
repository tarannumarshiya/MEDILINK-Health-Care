import { Router, Request, Response } from "express";
import { createRequestClient, serviceClient } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";
import {
  generateAppointmentCode,
  generatePatientCode,
} from "../lib/ids";
import { generateInvoiceForAppointment } from "../lib/billing";
import { STAFF_ROLES } from "../lib/roles";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                         POST /api/appointments/create                      */
/* -------------------------------------------------------------------------- */

router.post("/create", async (req: Request, res: Response) => {
  try {
    const {
      full_name,
      age,
      phone,
      email,
      description,
      department,
      preferred_date,
      preferred_time,
      symptoms,
    } = req.body;

    if (
      !full_name ||
      !age ||
      !phone ||
      !department ||
      !preferred_date
    ) {
      return void res.status(400).json({
        error: "Name, age, phone, department and preferred date are required",
      });
    }

    const appointmentCode = generateAppointmentCode();

    // Resolve Department ID
    const { data: deptRow } = await serviceClient
      .from("departments")
      .select("id")
      .ilike("name", department)
      .maybeSingle();

    const department_id = deptRow?.id ?? null;

    // Check existing patient
    let orFilter = `phone.eq.${phone}`;

    if (email) {
      orFilter += `,email.eq.${email}`;
    }

    const { data: existingPatient } = await serviceClient
      .from("patients")
      .select("id, patient_code, full_name, profile_id")
      .or(orFilter)
      .maybeSingle();

    let patient = existingPatient;

    if (!patient) {
      const { data: createdPatient, error: patientError } =
        await serviceClient
          .from("patients")
          .insert({
            patient_code: generatePatientCode(),
            full_name,
            age: Number(age),
            phone,
            email: email ?? null,
          })
          .select()
          .single();

      if (patientError || !createdPatient) {
        return void res.status(500).json({
          error: patientError?.message ?? "Unable to register patient",
        });
      }

      patient = createdPatient;
    }

    if (!patient) {
      return void res
        .status(500)
        .json({ error: "Unable to resolve patient" });
    }

    const { data: appointment, error: appointmentError } =
      await serviceClient
        .from("appointments")
        .insert({
          appointment_code: appointmentCode,
          patient_id: patient.id,
          patient_name: full_name,
          patient_phone: phone,
          patient_email: email ?? null,
          department,
          department_id,
          preferred_date,
          preferred_time: preferred_time ?? null,
          symptoms: symptoms ?? description ?? null,
          status: "PENDING",
        })
        .select()
        .single();

    if (appointmentError || !appointment) {
      return void res.status(500).json({
        error:
          appointmentError?.message ??
          "Unable to create appointment",
      });
    }

    if (department.toLowerCase() === "telemedicine") {
      let scheduled_at = new Date().toISOString();
      if (preferred_date) {
        try {
          const dateStr = `${preferred_date}T${preferred_time || "00:00"}:00`;
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) scheduled_at = d.toISOString();
        } catch (e) {}
      }
      
      await serviceClient.from("telemedicine_sessions").insert({
        appointment_id: appointment.id,
        patient_id: patient.id,
        scheduled_at,
        status: "PENDING",
        reason: symptoms ?? description ?? "appointment for consultation"
      });
    }

    res.json({
      success: true,
      patient,
      appointment,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Server error while booking appointment",
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                          POST /api/appointments/track                      */
/*                                                                             */
/*  SECURE TRIAL FLOW: returns ONLY minimal public status. Sensitive details   */
/*  (name, phone, email, symptoms, prescriptions, lab reports, payment) are    */
/*  never returned to unauthenticated callers.                                 */
/* -------------------------------------------------------------------------- */

router.post("/track", async (req: Request, res: Response) => {
  try {
    const searchValue = String(req.body.search ?? "").trim();

    if (!searchValue) {
      return void res.status(400).json({
        error:
          "Appointment reference, patient ID or phone number is required",
      });
    }

    const { data: appointment, error } = await serviceClient
      .from("appointments")
      .select("appointment_code, department, preferred_date, status, created_at")
      .eq("appointment_code", searchValue)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return void res.status(500).json({ error: "Unable to look up appointment" });
    }

    if (!appointment) {
      // Generic not-found so we never reveal whether another user's record exists.
      return void res.status(404).json({
        error: "No appointment found for the given reference",
      });
    }

    // Minimal public status only — no PII, medical or payment fields.
    return void res.json({
      success: true,
      data: {
        appointment_reference: appointment.appointment_code,
        status: appointment.status,
        appointment_date: appointment.preferred_date,
        department: appointment.department,
        demo_data: true,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Server error while tracking appointment",
    });
  }
});
/* -------------------------------------------------------------------------- */
/*                    POST /api/appointments/:id/consent                      */
/*                                                                             */
/*  Secured: requires authentication. Patient can only consent to their own     */
/*  appointment. Staff may consent on behalf of patients.                       */
/* -------------------------------------------------------------------------- */

// Use the centralized STAFF_ROLES from the shared role file
const STAFF_ROLES_FOR_CONSENT = STAFF_ROLES.filter(
  (role) => ["DOCTOR", "ADMIN", "SUPER_ADMIN", "HOSPITAL_ADMIN", "RECEPTIONIST"].includes(role)
);

router.post("/:id/consent", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { id: string };
    const profile = (req as any).profile as { role?: string; id: string };
    const id = String(req.params.id);
    const { accept } = req.body;

    if (accept === undefined || accept === null) {
      return void res.status(400).json({ error: "accept field is required (true/false)" });
    }

    const { data: appointment, error: appointmentError } = await serviceClient
      .from("appointments")
      .select("id, status, lab_required, patient_id, patient_phone")
      .eq("id", id)
      .single();

    if (appointmentError || !appointment) {
      return void res.status(404).json({ error: "Appointment not found" });
    }

    if (appointment.status !== "PENDING_PATIENT_APPROVAL") {
      return void res.status(400).json({ error: "Appointment is not pending approval" });
    }

    // Ownership check: patient can only consent to their own appointment.
    const isStaffRole = STAFF_ROLES_FOR_CONSENT.includes((profile.role ?? "") as any);
    if (!isStaffRole) {
      // Verify the authenticated user owns this appointment via their patient record.
      const { data: ownedPatient } = await serviceClient
        .from("patients")
        .select("id")
        .eq("profile_id", user.id)
        .eq("id", appointment.patient_id)
        .maybeSingle();

      if (!ownedPatient) {
        // Generic 403 — never reveal whether the appointment exists for another patient.
        return void res.status(403).json({ error: "Forbidden" });
      }
    }

    // Record the consent action in an audit-friendly way.
    const consentRecord = {
      appointment_id: id,
      patient_id: appointment.patient_id,
      accepted: Boolean(accept),
      consented_by: user.id,
      consented_by_role: profile.role,
      consented_at: new Date().toISOString(),
    };

    if (accept) {
      const nextStatus = appointment.lab_required
        ? "LAB_REQUESTED"
        : "PRESCRIPTION_READY";

      const { error: updateError } = await serviceClient
        .from("appointments")
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        return void res.status(500).json({ error: updateError.message });
      }
    } else {
      await serviceClient
        .from("appointments")
        .update({
          status: "COMPLETED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      // Cancel lab tests
      await serviceClient
        .from("lab_tests")
        .update({ status: "CANCELLED" })
        .eq("appointment_id", id)
        .eq("status", "PENDING");

      // Cancel prescriptions
      await serviceClient
        .from("prescriptions")
        .update({ status: "CANCELLED" })
        .eq("appointment_id", id);

      // Delete pending lab tests and prescriptions
      await serviceClient.from("lab_tests").delete().eq("appointment_id", id);
      await serviceClient.from("prescriptions").delete().eq("appointment_id", id);

      // Generate consultation-only invoice
      try {
        await generateInvoiceForAppointment(id);
      } catch (err) {
        console.error("Invoice generation failed:", err);
      }
    }

    // Audit log entry
    await serviceClient.from("audit_logs").insert({
      action: "CONSENT_ACTION",
      entity_type: "appointment",
      entity_id: id,
      performed_by: user.id,
      details: consentRecord,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while submitting consent" });
  }
});

/* -------------------------------------------------------------------------- */
/*                                EXPORT ROUTER                               */
/* -------------------------------------------------------------------------- */

export default router;