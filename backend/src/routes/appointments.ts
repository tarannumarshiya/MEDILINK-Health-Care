import { Router, Request, Response } from "express";
import { getServiceClient } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";
import {
  generateAppointmentCode,
  generatePatientCode,
} from "../lib/ids";
import { generateInvoiceForAppointment } from "../lib/billing";
import { STAFF_ROLES } from "../lib/roles";
import { sendEmail } from "../lib/email";
import { sendWhatsAppAppointmentNotification } from "../lib/whatsapp";
import { sendSMS } from "../lib/sms";

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
      (age === undefined || age === null || age === "") ||
      !phone ||
      !department ||
      !preferred_date
    ) {
      res.status(400).json({
        error: "Name, age, phone, department and preferred date are required",
      });
      return;
    }

    if (/[<>]/g.test(full_name)) {
      res.status(400).json({ error: "Name cannot contain HTML or script characters" });
      return;
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      res.status(400).json({ error: "Invalid phone number format. Must be between 10 and 15 digits." });
      return;
    }

    const dateObj = new Date(preferred_date);
    if (Number.isNaN(dateObj.getTime())) {
      res.status(400).json({ error: "Invalid date format" });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) {
      res.status(400).json({ error: "Preferred date cannot be in the past" });
      return;
    }

    if (preferred_time && !/^[0-2]?[0-9]:[0-5][0-9]$/.test(preferred_time)) {
      res.status(400).json({ error: "Invalid time format. Must be HH:MM." });
      return;
    }

    // Resolve Department ID
    const { data: deptRow } = await getServiceClient()
      .from("departments")
      .select("id")
      .ilike("name", department)
      .maybeSingle();

    if (!deptRow) {
      res.status(400).json({ error: "Nonexistent department" });
      return;
    }

    const department_id = deptRow.id;
    const appointmentCode = generateAppointmentCode();

    // Check existing patient
    let orFilter = `phone.eq.${phone}`;

    if (email) {
      orFilter += `,email.eq.${email}`;
    }

    const { data: existingPatient } = await getServiceClient()
      .from("patients")
      .select("id, patient_code, full_name, profile_id")
      .or(orFilter)
      .maybeSingle();

    let patient = existingPatient;

    if (!patient) {
      const { data: createdPatient, error: patientError } =
        await getServiceClient()
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
        res.status(500).json({
          error: patientError?.message ?? "Unable to register patient",
        });
        return;
      }

      patient = createdPatient;
    }

    if (!patient) {
      res.status(500).json({ error: "Unable to resolve patient" });
      return;
    }

    const { data: appointment, error: appointmentError } =
      await getServiceClient()
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
      res.status(500).json({
        error:
          appointmentError?.message ??
          "Unable to create appointment",
      });
      return;
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
      
      await getServiceClient().from("telemedicine_sessions").insert({
        appointment_id: appointment.id,
        patient_id: patient.id,
        scheduled_at,
        status: "PENDING",
        reason: symptoms ?? description ?? "appointment for consultation"
      });
    }

    if (email) {
      sendEmail({
        toEmail: email,
        toName: full_name,
        subject: `Appointment Confirmed - Code: ${appointmentCode}`,
        htmlContent: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 12px;">
            <h2 style="color: #0d7550;">Appointment Confirmation</h2>
            <p>Dear <strong>${full_name}</strong>,</p>
            <p>Your appointment has been successfully scheduled at <strong>Medilink Digital Health Care</strong>.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #666;">Appointment Code:</td>
                <td style="padding: 6px 0; font-weight: bold;">${appointmentCode}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Department:</td>
                <td style="padding: 6px 0; font-weight: bold;">${department}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Date:</td>
                <td style="padding: 6px 0; font-weight: bold;">${preferred_date}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #666;">Time:</td>
                <td style="padding: 6px 0; font-weight: bold;">${preferred_time || "Pending Doctor Assignment"}</td>
              </tr>
            </table>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p>Please keep this appointment code safe. You can track your status or check prescriptions anytime from the patient portal.</p>
            <p>Thank you for choosing Medilink!</p>
          </div>
        `,
      }).catch((err) => console.error("Brevo email appointment confirm failure:", err));
    }
    if (phone) {
      sendWhatsAppAppointmentNotification({
        recipientPhone: phone,
        patientName: full_name,
        appointmentCode,
        date: preferred_date,
        time: preferred_time || "Pending",
      }).catch((err) => console.error("WhatsApp appointment notification failure:", err));

      sendSMS({
        recipientPhone: phone,
        message: `Hello ${full_name}, your Medilink appointment in ${department} is confirmed for ${preferred_date}. Code: ${appointmentCode}`,
      }).catch((err) => console.error("SMS appointment notification failure:", err));
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

router.all("/create", (req: Request, res: Response) => {
  res.setHeader("Allow", "POST");
  res.status(405).json({ error: "Method Not Allowed" });
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
    const rawVal = req.body.search || req.body.appointment_code || req.query.search || req.query.appointment_code;
    
    if (typeof rawVal === "string" && rawVal.trim() === "" && rawVal.length > 0) {
      res.status(400).json({
        error: "Appointment reference is required",
      });
      return;
    }

    const searchValue = String(rawVal || "").trim();
    if (!searchValue) {
      res.status(404).json({
        error: "No appointment found for the given reference",
      });
      return;
    }

    // Only allow lookup by appointment_code — never by phone or email
    // which would enable enumeration of other patients' records.
    const { data: appointment, error } = await getServiceClient()
      .from("appointments")
      .select("appointment_code, department, preferred_date, status, created_at")
      .eq("appointment_code", searchValue)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      res.status(500).json({ error: "Unable to look up appointment" });
      return;
    }

    if (!appointment) {
      // Generic not-found so we never reveal whether another user's record exists.
      res.status(404).json({
        error: "No appointment found for the given reference",
      });
      return;
    }


    // Minimal public status only — no PII, medical or payment fields.
    res.json({
      success: true,
      data: {
        appointment_reference: appointment.appointment_code,
        status: appointment.status,
        appointment_date: appointment.preferred_date,
        department: appointment.department,
        demo_data: true,
      },
    });
    return;
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

router.post("/:id?/consent", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { id: string };
    const profile = (req as any).profile as { role?: string; id: string; is_active?: boolean; employee_id?: string };
    const id = req.params.id || req.body.id || req.query.id;

    if (!id || id === "undefined" || id === "") {
      res.status(400).json({ error: "Appointment ID is required" });
      return;
    }
    const { accept, staff_pin } = req.body;

    if (accept === undefined || accept === null) {
      res.status(400).json({ error: "accept field is required (true/false)" });
      return;
    }

    const { data: appointment, error: appointmentError } = await getServiceClient()
      .from("appointments")
      .select("id, status, lab_required, patient_id, patient_phone")
      .eq("id", id)
      .single();

    if (appointmentError || !appointment) {
      res.status(404).json({ error: "Appointment not found" });
      return;
    }

    if (appointment.status !== "PENDING_PATIENT_APPROVAL") {
      res.status(400).json({ error: "Appointment is not pending approval" });
      return;
    }

    // Ownership check: patient can only consent to their own appointment.
    if (!profile) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const isStaffRole = (STAFF_ROLES_FOR_CONSENT as string[]).includes(profile.role ?? "");

    // Staff acting on a patient's behalf must have an active account AND
    // provide a staff PIN (last 4 digits of their employee_id) for audit trail.
    if (isStaffRole) {
      if (profile.is_active === false) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      // Staff must confirm identity with their PIN.
      // The PIN is the last 4 characters of their employee_id.
      const expectedPin = profile.employee_id ? profile.employee_id.slice(-4) : null;
      if (!staff_pin) {
        res.status(400).json({ error: "Staff PIN is required for consent actions" });
        return;
      }
      if (expectedPin && staff_pin !== expectedPin) {
        res.status(403).json({ error: "Invalid staff PIN" });
        return;
      }
    }

    if (!isStaffRole) {
      // Verify the authenticated user owns this appointment via their patient record.
      const { data: ownedPatient } = await getServiceClient()
        .from("patients")
        .select("id")
        .eq("profile_id", user.id)
        .eq("id", appointment.patient_id)
        .maybeSingle();

      if (!ownedPatient) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    }

    // Record the consent action in an audit-friendly way.
    // This is a *trial / simulated* consent — the flag is persisted so the
    // record can never be mistaken for a legally-binding consent.
    const consentRecord = {
      appointment_id: id,
      patient_id: appointment.patient_id,
      accepted: Boolean(accept),
      consented_by: user.id,
      consented_by_role: profile.role,
      consented_at: new Date().toISOString(),
      simulated: true,
    };

    if (accept) {
      const nextStatus = appointment.lab_required
        ? "LAB_REQUESTED"
        : "PRESCRIPTION_READY";

      const { error: updateError } = await getServiceClient()
        .from("appointments")
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        res.status(500).json({ error: updateError.message });
        return;
      }
    } else {
      await getServiceClient()
        .from("appointments")
        .update({
          status: "COMPLETED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      // Cancel lab tests
      await getServiceClient()
        .from("lab_tests")
        .update({ status: "CANCELLED" })
        .eq("appointment_id", id)
        .eq("status", "PENDING");

      // Cancel prescriptions
      await getServiceClient()
        .from("prescriptions")
        .update({ status: "CANCELLED" })
        .eq("appointment_id", id);

      // Delete pending lab tests and prescriptions
      await getServiceClient().from("lab_tests").delete().eq("appointment_id", id);
      await getServiceClient().from("prescriptions").delete().eq("appointment_id", id);

      // Generate consultation-only invoice
      try {
        await generateInvoiceForAppointment(id);
      } catch (err) {
        console.error("Invoice generation failed:", err);
      }
    }

    // Audit log entry
    await getServiceClient().from("audit_logs").insert({
      action: "CONSENT_ACTION",
      entity_type: "appointment",
      entity_id: id,
      performed_by: user.id,
      details: consentRecord,
    });

    res.json({ success: true, consent: { simulated: true, accepted: Boolean(accept) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while submitting consent" });
  }
});

/* -------------------------------------------------------------------------- */
/*                                EXPORT ROUTER                               */
/* -------------------------------------------------------------------------- */

export default router;