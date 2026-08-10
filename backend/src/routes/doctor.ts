import { Router, Request, Response } from "express";
import { getServiceClient, resolveRequestClient } from "../lib/supabase";
import { requireAuth, requireRole } from "../middleware/auth";
import { generateInvoiceCode } from "../lib/ids";
import { DOCTOR_ROLES } from "../lib/roles";

const router = Router();

const LAB_CHARGE_PER_REQUEST = 200;
const MEDICINE_CHARGE_PER_QTY = 50;

const APPT_SELECT = `id, appointment_code, patient_id, patient_name, patient_phone,
  patient_email, department, department_id, doctor_id, preferred_date, preferred_time,
  symptoms, status, prescription_text, lab_required, lab_report_url, created_at, updated_at`;

// ── GET /api/doctor/queue ─────────────────────────────────────────────────────
router.get("/queue", requireAuth,
  requireRole(DOCTOR_ROLES),
  async (req: Request, res: Response) => {
    try {
      const supabase = resolveRequestClient(req);
      const user = (req as any).user;

      const { data: doctor, error: doctorError } = await supabase
        .from("doctors")
        .select("id, profile_id, department_id, departments:department_id (id, name)")
        .eq("profile_id", user.id)
        .single();

      if (doctorError || !doctor)
        return void res.status(404).json({ error: "Doctor record not found" });

      const department = (Array.isArray(doctor.departments)
        ? doctor.departments[0] : doctor.departments) as { id: string; name: string } | null;

      // Show appointments either:
      // 1. Directly assigned to this doctor (doctor_id = doctor.id)
      // 2. Belong to this doctor's department AND have no doctor assigned yet (doctor_id IS NULL)
      // This way new bookings show up for the right department even before admin assigns a doctor.
      const { data: appointments, error } = await getServiceClient()
        .from("appointments")
        .select(APPT_SELECT)
        .or(`doctor_id.eq.${doctor.id}${department?.id ? `,and(department_id.eq.${department.id},doctor_id.is.null)` : ""}`)
        .not("status", "in", '("REJECTED","cancelled")')
        .order("created_at", { ascending: true });

      if (error) return void res.status(500).json({ error: error.message });

      // Fetch lab reports from both legacy lab_tests/lab_reports and current lab_orders.
      const apptIds = (appointments ?? []).map((a: any) => a.id);
      const labReports: Record<string, any[]> = {};

      if (apptIds.length > 0) {
        const { data: ltRows } = await getServiceClient()
          .from("lab_tests")
          .select("id,appointment_id,status,test_type")
          .in("appointment_id", apptIds);

        const testIds = (ltRows ?? []).map((t: any) => t.id);
        if (testIds.length > 0) {
          const { data: repRows } = await getServiceClient()
            .from("lab_reports")
            .select("id,lab_test_id,result_summary,file_url,verified_at")
            .in("lab_test_id", testIds);

          (ltRows ?? []).forEach((t: any) => {
            const apptId = t.appointment_id;
            if (!labReports[apptId]) labReports[apptId] = [];
            const reps = (repRows ?? []).filter((r: any) => r.lab_test_id === t.id);
            labReports[apptId].push(...reps.map((r: any) => ({ ...r, test_type: t.test_type })));
          });
        }
      }

      const enriched = (appointments ?? []).map((a: any) => ({
        ...a,
        lab_reports: labReports[a.id] ?? [],
      }));

      res.json({ success: true, doctor, department, appointments: enriched });
    } catch {
      res.status(500).json({ error: "Server error while loading doctor queue" });
    }
  }
);

// ── PATCH /api/doctor/start-consultation ─────────────────────────────────────
router.patch("/start-consultation", requireAuth,
  requireRole(DOCTOR_ROLES),
  async (req: Request, res: Response) => {
    try {
      const { appointmentId } = req.body;
      if (!appointmentId)
        return void res.status(400).json({ error: "Appointment ID is required" });

      const user = (req as any).user;
      const { data: doctor } = await getServiceClient()
        .from("doctors").select("id").eq("profile_id", user.id).single();

      const { data: appointment, error } = await getServiceClient()
        .from("appointments")
        .update({
          status: "IN_PROGRESS",
          doctor_id: doctor?.id ?? undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId)
        .select().single();

      if (error) return void res.status(500).json({ error: error.message });

      await getServiceClient().from("audit_logs").insert({
        action: "CONSULTATION_STARTED",
        entity: "appointments",
        entity_id: appointmentId,
        actor_id: (req as any).profile?.id ?? null,
        detail: `Doctor ${doctor?.id} started consultation`,
      });

      res.json({ success: true, appointment });
    } catch {
      res.status(500).json({ error: "Server error while starting consultation" });
    }
  }
);

// ── POST /api/doctor/prescription ─────────────────────────────────────────────
router.post("/prescription", requireAuth, requireRole(DOCTOR_ROLES),
  async (req: Request, res: Response) => {
    try {
      const supabase = resolveRequestClient(req);
      const user = (req as any).user;
      const profile = (req as any).profile;

      if (!profile.is_active)
        return void res.status(403).json({ error: "Doctor access only" });

      type MedicineItem = {
        medicine_name: string;
        dosage?: string;
        quantity?: number;
        instructions?: string;
      };

      const { appointmentId, notes, medicines, labRequired, labTestName } = req.body as {
        appointmentId: string;
        notes: string;
        medicines: MedicineItem[];
        labRequired?: boolean;
        labTestName?: string;
      };
      const wantsLab = Boolean(labRequired || labTestName?.trim());

      if (!appointmentId || !notes)
        return void res.status(400).json({ error: "Appointment and prescription notes are required" });
      if (!medicines || medicines.length === 0)
        return void res.status(400).json({ error: "At least one medicine is required" });

      if (/[<>]/g.test(notes)) {
        return void res.status(400).json({ error: "Prescription notes cannot contain HTML or script characters" });
      }

      for (const item of medicines) {
        if (item.quantity !== undefined && (isNaN(Number(item.quantity)) || Number(item.quantity) <= 0)) {
          return void res.status(400).json({ error: "Medicine quantity must be positive" });
        }
      }

      const { data: doctor, error: doctorError } = await supabase
        .from("doctors").select("id, consultation_fee").eq("profile_id", user.id).single();
      if (doctorError || !doctor)
        return void res.status(404).json({ error: "Doctor record not found" });

      const { data: appointment, error: apptError } = await getServiceClient()
        .from("appointments").select("id, patient_id, patient_name").eq("id", appointmentId).single();
      if (apptError || !appointment)
        return void res.status(404).json({ error: "Appointment not found" });

      // 1. Save prescription
      const { data: prescription, error: prescriptionError } = await getServiceClient()
        .from("prescriptions")
        .insert({ appointment_id: appointmentId, doctor_id: doctor.id, prescription_notes: notes, status: "ACTIVE" })
        .select().single();

      if (prescriptionError || !prescription)
        return void res.status(500).json({ error: prescriptionError?.message ?? "Prescription creation failed" });

      // 2. Save prescription items
      const { error: itemsError } = await getServiceClient()
        .from("prescription_items")
        .insert(medicines.map((item) => ({
          prescription_id: prescription.id,
          medicine_name: item.medicine_name,
          dosage: item.dosage ?? null,
          quantity: Number(item.quantity ?? 1),
          instructions: item.instructions ?? null,
        })));

      if (itemsError)
        return void res.status(500).json({ error: itemsError.message });

      // 3. Update appointment status
      const nextStatus = wantsLab ? "LAB_REQUESTED" : "PRESCRIPTION_READY";

      await getServiceClient().from("appointments").update({
        status: nextStatus,
        prescription_text: notes,
        lab_required: wantsLab,
        updated_at: new Date().toISOString(),
      }).eq("id", appointmentId);

      // 4. If lab requested, create a lab_test record
      if (wantsLab) {
        const testName = labTestName?.trim() || "General Lab Test";
        await getServiceClient().from("lab_tests").insert({
          appointment_id: appointmentId,
          patient_id: appointment.patient_id,
          doctor_id: doctor.id,
          test_type: testName,
          status: "PENDING",
          priority: "ROUTINE",
        });
      }

      // 5. Auto-generate invoice
      const consultationCharge = Number(doctor.consultation_fee) || 0;
      const labCharge = wantsLab ? LAB_CHARGE_PER_REQUEST : 0;
      const medicineCharge = medicines.reduce(
        (sum, m) => sum + (Number(m.quantity) || 1) * MEDICINE_CHARGE_PER_QTY, 0
      );
      const total = consultationCharge + labCharge + medicineCharge;

      const { data: invoice, error: invoiceError } = await getServiceClient()
        .from("invoices")
        .insert({
          invoice_code: generateInvoiceCode(),
          patient_id: appointment.patient_id ?? null,
          appointment_id: appointmentId,
          patient_name: appointment.patient_name ?? null,
          consultation_charge: consultationCharge,
          lab_charge: labCharge,
          medicine_charge: medicineCharge,
          insurance_deduction: 0,
          total,
          status: "UNPAID",
        }).select().single();

      if (invoiceError) {
        console.error("Invoice auto-generation failed:", invoiceError.message);
      }

      // 6. Audit log
      await getServiceClient().from("audit_logs").insert({
        action: "PRESCRIPTION_CREATED",
        entity: "prescriptions",
        entity_id: prescription.id,
        actor_id: profile.id,
        detail: `Prescription created for appointment ${appointmentId}`,
      });

      // 7. Notify patient
      if (appointment.patient_id) {
        const { data: patient } = await getServiceClient()
          .from("patients").select("profile_id").eq("id", appointment.patient_id).single();
        if (patient?.profile_id) {
          const body = wantsLab
            ? "Your prescription is ready. Lab tests have been requested — please proceed to the lab."
            : "Your prescription is ready. Please proceed to the pharmacy.";
          await getServiceClient().from("notifications").insert({
            user_id: patient.profile_id,
            type: wantsLab ? "LAB" : "PRESCRIPTION",
            title: wantsLab ? "Lab Test Requested" : "Prescription Ready",
            body,
            entity_id: prescription.id,
            priority: "NORMAL",
          });
        }
      }

      res.json({ success: true, prescription, nextStatus, invoice: invoice ?? null });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error while submitting prescription" });
    }
  }
);

// ── GET /api/doctor/lab-report ────────────────────────────────────────────────
router.get("/lab-report", requireAuth, requireRole(DOCTOR_ROLES),
  async (req: Request, res: Response) => {
    try {
      const { appointment_id } = req.query;
      if (!appointment_id)
        return void res.status(400).json({ error: "appointment_id required" });

      const { data: labTest } = await getServiceClient()
        .from("lab_tests").select("id").eq("appointment_id", String(appointment_id)).maybeSingle();

      if (!labTest)
        return void res.json({ success: true, report: null });

      const { data: report } = await getServiceClient()
        .from("lab_reports").select("*").eq("lab_test_id", labTest.id).maybeSingle();

      res.json({ success: true, report: report ?? null });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

// ── PATCH /api/doctor/complete ────────────────────────────────────────────────
router.patch("/complete", requireAuth, requireRole(DOCTOR_ROLES),
  async (req: Request, res: Response) => {
    try {
      const { appointmentId } = req.body;
      if (!appointmentId)
        return void res.status(400).json({ error: "appointmentId required" });

      const { data, error } = await getServiceClient()
        .from("appointments")
        .update({ status: "COMPLETED", updated_at: new Date().toISOString() })
        .eq("id", appointmentId).select().single();

      if (error) return void res.status(500).json({ error: error.message });

      await getServiceClient().from("audit_logs").insert({
        action: "CONSULTATION_COMPLETED",
        entity: "appointments",
        entity_id: appointmentId,
        actor_id: (req as any).profile?.id ?? null,
        detail: `Consultation completed for appointment ${appointmentId}`,
      });

      res.json({ success: true, appointment: data });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

// ── GET /api/doctor/patient-history ─────────────────────────────────────────
router.get("/patient-history", requireAuth, requireRole(DOCTOR_ROLES),
  async (req: Request, res: Response) => {
    try {
      const patientId = String(req.query.patient_id ?? "");
      if (!patientId) return void res.status(400).json({ error: "patient_id required" });

      const [appointmentsRes, prescriptionsRes, labTestsRes, recordsRes] = await Promise.all([
        getServiceClient().from("appointments").select("id,appointment_code,department,preferred_date,preferred_time,status,symptoms,prescription_text,lab_report_url,created_at").eq("patient_id", patientId).order("created_at", { ascending: false }),
        getServiceClient().from("prescriptions").select("id,appointment_id,prescription_notes,status,created_at,prescription_items(id,medicine_name,dosage,quantity,instructions)").eq("patient_id", patientId).order("created_at", { ascending: false }),
        getServiceClient().from("lab_tests").select("id,appointment_id,test_type,status,sample_collected_at,created_at").eq("patient_id", patientId).order("created_at", { ascending: false }),
        getServiceClient().from("medical_records").select("id,type,title,notes,file_url,created_at").eq("patient_id", patientId).order("created_at", { ascending: false }),
      ]);

      res.json({
        success: true,
        history: {
          appointments: appointmentsRes.data ?? [],
          prescriptions: prescriptionsRes.data ?? [],
          lab_tests: labTestsRes.data ?? [],
          medical_records: recordsRes.data ?? [],
        },
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message ?? "Unable to load patient history" });
    }
  }
);

export default router;
