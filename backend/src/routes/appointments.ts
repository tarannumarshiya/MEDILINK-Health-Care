import { Router, Request, Response } from "express";
import { createRequestClient, serviceClient } from "../lib/supabase";
import {
  generateAppointmentCode,
  generatePatientCode,
} from "../lib/ids";
import { generateInvoiceForAppointment } from "../lib/billing";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                               Helper Methods                               */
/* -------------------------------------------------------------------------- */

function maskName(name: string) {
  if (!name) return name;

  return name
    .split(" ")
    .map((part) => {
      if (part.length <= 2) return part[0] + "*";
      return part[0] + "*".repeat(part.length - 2) + part.slice(-1);
    })
    .join(" ");
}

function maskPhone(phone: string) {
  if (!phone) return phone;
  if (phone.length < 6) return "***";
  return (
    phone.substring(0, 3) +
    "*".repeat(phone.length - 5) +
    phone.substring(phone.length - 2)
  );
}

function maskCode(code: string) {
  if (!code) return code;

  const parts = code.split("-");

  if (parts.length === 3) {
    return `${parts[0]}-${parts[1]}-***${parts[2].slice(-2)}`;
  }

  return "***";
}

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
/* -------------------------------------------------------------------------- */

router.post("/track", async (req: Request, res: Response) => {
  try {
    const searchValue = String(req.body.search ?? "").trim();

    if (!searchValue) {
      return void res.status(400).json({
        error:
          "Patient ID, Appointment ID or phone number is required",
      });
    }

    const isCodeSearch =
      searchValue.startsWith("PAT-") ||
      searchValue.startsWith("APT-");

    const { data: patient } = await serviceClient
      .from("patients")
      .select(
        "id, patient_code, full_name, age, phone, email, description"
      )
      .or(
        `patient_code.eq.${searchValue},phone.eq.${searchValue},email.eq.${searchValue}`
      )
      .maybeSingle();

    let query = serviceClient
      .from("appointments")
      .select(`
        id,
        appointment_code,
        patient_id,
        patient_name,
        patient_phone,
        patient_email,
        department,
        preferred_date,
        preferred_time,
        symptoms,
        status,
        prescription_text,
        lab_report_url,
        lab_required,
        created_at,
        updated_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (patient) {
      query = query.eq("patient_id", patient.id);
    } else {
      query = query.or(
        `appointment_code.eq.${searchValue},patient_phone.eq.${searchValue},patient_email.eq.${searchValue}`
      );
    }

    const { data: appointments, error } = await query;

    if (error) {
      return void res.status(500).json({
        error: error.message,
      });
    }

    if (!appointments || appointments.length === 0) {
      return void res.status(404).json({
        error: "No appointment found",
      });
    }

    if (!isCodeSearch) {
      const maskedAppointments = appointments.map((app: any) => ({
        ...app,
        patient_name: maskName(app.patient_name),
        patient_phone: maskPhone(app.patient_phone),
        patient_email: null,
        appointment_code: maskCode(app.appointment_code),
        symptoms: null,
        prescription_text: null,
        lab_report_url: null,
      }));

      return void res.json({
        success: true,
        isLimited: true,
        patient: null,
        appointments: maskedAppointments,
      });
    }

    res.json({
      success: true,
      patient,
      appointments,
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
/* -------------------------------------------------------------------------- */

router.post("/:id/consent", async (req: Request, res: Response) => {
  try {
    // Fixes TS2345 (string | string[])
    const id = String(req.params.id);
    const { accept } = req.body;

    const { data: appointment, error: appointmentError } = await serviceClient
      .from("appointments")
      .select("id, status, lab_required")
      .eq("id", id)
      .single();

    if (appointmentError || !appointment) {
      return void res.status(404).json({
        error: "Appointment not found",
      });
    }

    if (appointment.status !== "PENDING_PATIENT_APPROVAL") {
      return void res.status(400).json({
        error: "Appointment is not pending approval",
      });
    }

    if (accept) {
      // Patient accepted medicines/lab

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
        return void res.status(500).json({
          error: updateError.message,
        });
      }

      // Invoice will be generated after lab/pharmacy completion
    } else {
      // Patient rejected medicines/lab

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
        .update({
          status: "CANCELLED",
        })
        .eq("appointment_id", id)
        .eq("status", "PENDING");

      // Cancel prescriptions
      await serviceClient
        .from("prescriptions")
        .update({
          status: "CANCELLED",
        })
        .eq("appointment_id", id);

      // Delete pending lab tests
      await serviceClient
        .from("lab_tests")
        .delete()
        .eq("appointment_id", id);

      // Delete prescriptions
      await serviceClient
        .from("prescriptions")
        .delete()
        .eq("appointment_id", id);

      // Generate consultation-only invoice
      try {
        await generateInvoiceForAppointment(id);
      } catch (err) {
        console.error("Invoice generation failed:", err);
      }
    }

    res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error while submitting consent",
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                                EXPORT ROUTER                               */
/* -------------------------------------------------------------------------- */

export default router;