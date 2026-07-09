import { Router, Request, Response } from "express";
import { createRequestClient } from "../lib/supabase";
import {
  generateAppointmentCode,
  generatePatientCode,
} from "../lib/ids";

const router = Router();

function maskName(name: string) {
  if (!name) return name;
  return name.split(" ").map(n => {
    if (n.length <= 2) return n[0] + "*";
    return n[0] + "*".repeat(n.length - 2) + n[n.length - 1];
  }).join(" ");
}

function maskPhone(phone: string) {
  if (!phone) return phone;
  if (phone.length < 6) return "***";
  return phone.slice(0, 3) + "*".repeat(phone.length - 5) + phone.slice(-2);
}

function maskCode(code: string) {
  if (!code) return code;
  const parts = code.split("-");
  if (parts.length === 3) {
    return `${parts[0]}-${parts[1]}-***${parts[2].slice(-2)}`;
  }
  return "***";
}

// POST /api/appointments/create
router.post("/create", async (req: Request, res: Response) => {
  try {
    const supabase = createRequestClient(req);
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

    if (!full_name || !age || !phone || !department || !preferred_date)
      return void res.status(400).json({
        error: "Name, age, phone, department and date are required",
      });

    const appointmentCode = generateAppointmentCode();

    // Resolve department_id from department name
    const { data: deptRow } = await supabase
      .from("departments")
      .select("id")
      .ilike("name", department)
      .maybeSingle();
    const department_id = deptRow?.id ?? null;

    // Dedup: find existing patient by phone (or email as fallback)
    let orFilter = `phone.eq.${phone}`;
    if (email) orFilter += `,email.eq.${email}`;

    const { data: existing } = await supabase
      .from("patients")
      .select("id, patient_code, full_name, profile_id")
      .or(orFilter)
      .maybeSingle();

    let patient = existing;

    if (!patient) {
      const { data: created, error: patientError } = await supabase
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

      if (patientError || !created)
        return void res.status(500).json({
          error: patientError?.message ?? "Patient registration failed",
        });

      patient = created;
    }

    if (!patient)
      return void res.status(500).json({ error: "Patient resolution failed" });

    const { data: appointment, error: appointmentError } = await supabase
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

    if (appointmentError || !appointment)
      return void res.status(500).json({
        error: appointmentError?.message ?? "Appointment creation failed",
      });

    res.json({ success: true, patient, appointment });
  } catch {
    res
      .status(500)
      .json({ error: "Server error while booking appointment" });
  }
});

// POST /api/appointments/track
router.post("/track", async (req: Request, res: Response) => {
  try {
    const supabase = createRequestClient(req);
    const searchValue = String(req.body.search ?? "").trim();
    const isCodeSearch = searchValue.startsWith("PAT-") || searchValue.startsWith("APT-");

    if (!searchValue)
      return void res.status(400).json({
        error:
          "Patient ID, Appointment ID, or phone number is required",
      });

    const { data: patient } = await supabase
      .from("patients")
      .select("id, patient_code, full_name, age, phone, email, description")
      .or(
        `patient_code.eq.${searchValue},phone.eq.${searchValue},email.eq.${searchValue}`
      )
      .maybeSingle();

    let query = supabase
      .from("appointments")
      .select(
        `id, appointment_code, patient_id, patient_name, patient_phone,
         patient_email, department, preferred_date, preferred_time,
         symptoms, status, prescription_text, lab_report_url,
         lab_required, created_at, updated_at`
      )
      .order("created_at", { ascending: false });

    if (patient) {
      query = query.eq("patient_id", patient.id);
    } else {
      query = query.or(
        `appointment_code.eq.${searchValue},patient_phone.eq.${searchValue},patient_email.eq.${searchValue}`
      );
    }

    const { data: appointments, error } = await query;

    if (error) return void res.status(500).json({ error: error.message });

    if (!appointments || appointments.length === 0)
      return void res
        .status(404)
        .json({ error: "No appointment found for this detail" });

    if (!isCodeSearch) {
      const maskedAppointments = appointments.map(app => ({
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
        appointments: maskedAppointments
      });
    }

    res.json({ success: true, patient, appointments });
  } catch {
    res
      .status(500)
      .json({ error: "Server error while tracking appointment" });
  }
});

export default router;
