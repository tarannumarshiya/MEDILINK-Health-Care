import { Router, Request, Response } from "express";
import { serviceClient } from "../lib/supabase";
import { requireAuth, requireRole } from "../middleware/auth";
import { generateInvoiceForAppointment } from "../lib/billing";
import { LAB_ROLES } from "../lib/roles";
import { sendEmail } from "../lib/email";
import { sendWhatsAppLabNotification } from "../lib/whatsapp";
import { sendSMS } from "../lib/sms";

const router = Router();

// GET /api/lab/queue
router.get("/queue", requireAuth, requireRole(LAB_ROLES), async (_req: Request, res: Response) => {
  try {
    const { data, error } = await serviceClient
      .from("lab_tests")
      .select(`
        id, appointment_id, patient_id, doctor_id, test_type, status,
        priority, sample_collected_at, created_at,
        patients:patient_id ( full_name, patient_code, phone ),
        doctors:doctor_id ( profiles:profile_id ( full_name ) )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const rows = data ?? [];

    const tests = rows.map((o: any) => ({
      id: o.id,
      appointment_id: o.appointment_id,
      patient_id: o.patient_id,
      doctor_id: o.doctor_id,
      test_type: o.test_type ?? "Lab Test",
      status: o.status ?? "PENDING",
      priority: o.priority ?? "ROUTINE",
      sample_collected_at: o.sample_collected_at ?? null,
      created_at: o.created_at,
      patient_name: (o.patients as any)?.full_name ?? "Unknown",
      doctor_name: (o.doctors as any)?.profiles?.full_name
        ? `Dr. ${(o.doctors as any).profiles.full_name}`
        : "Unknown",
    }));

    const patMap: Record<string, string> = {};
    rows.forEach((o: any) => {
      if (o.patient_id && (o.patients as any)?.full_name)
        patMap[o.patient_id] = (o.patients as any).full_name;
    });

    // Fetch lab_reports for completed/verified tests
    const doneIds = rows
      .filter((o: any) => o.status === "COMPLETED" || o.status === "VERIFIED")
      .map((o: any) => o.id);

    let reports: any[] = [];
    if (doneIds.length > 0) {
      const { data: rData } = await serviceClient
        .from("lab_reports")
        .select("id, lab_test_id, result_summary, file_url, test_type, verified_by, verified_at, created_at")
        .in("lab_test_id", doneIds)
        .order("created_at", { ascending: false });
      reports = rData ?? [];
    }

    res.json({ success: true, tests, reports, patMap });
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? "Lab queue error" });
  }
});

// PATCH /api/lab/update-status
router.patch("/update-status", requireAuth, requireRole(LAB_ROLES), async (req: Request, res: Response) => {
  try {
    const { test_id, status, sample_collected_at } = req.body;
    if (!test_id || !status) {
      res.status(400).json({ error: "test_id and status are required" });
      return;
    }

    const allowed = ["PENDING", "COLLECTED", "PROCESSING", "COMPLETED", "VERIFIED"];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: "Invalid lab status" });
      return;
    }

    const payload: Record<string, unknown> = { status };
    if (status === "COLLECTED" && sample_collected_at) payload.sample_collected_at = sample_collected_at;

    const { data, error } = await serviceClient
      .from("lab_tests")
      .update(payload)
      .eq("id", test_id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    if (!data) {
      res.status(404).json({ error: "Lab test not found" });
      return;
    }

    // Sync appointment status
    if (data?.appointment_id) {
      let apptStatus =
        status === "PROCESSING" ? "LAB_PROCESSING" :
          status === "COMPLETED" ? "LAB_COMPLETED" :
            status === "VERIFIED" ? "LAB_COMPLETED" : "LAB_REQUESTED";

      // If Lab is completed, check if pharmacy is still pending
      if (status === "COMPLETED" || status === "VERIFIED") {
        const { data: activePrescriptions } = await serviceClient
          .from("prescriptions")
          .select("id")
          .eq("appointment_id", data.appointment_id)
          .eq("status", "ACTIVE");

        if (!activePrescriptions || activePrescriptions.length === 0) {
          // No active pharmacy items, so we can generate the final invoice
          const invoice = await generateInvoiceForAppointment(data.appointment_id);
          if (invoice) {
            apptStatus = "INVOICE_GENERATED"; // Override status
          }
        } else {
          // Pharmacy is still pending, so advance appointment status to PHARMACY_PENDING
          apptStatus = "PHARMACY_PENDING";
        }
      }

      await serviceClient
        .from("appointments")
        .update({ status: apptStatus, updated_at: new Date().toISOString() })
        .eq("id", data.appointment_id);
    }

    res.json({ success: true, test: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? "Update status error" });
  }
});

// POST /api/lab/upload-report
router.post("/upload-report", requireAuth, requireRole(LAB_ROLES), async (req: Request, res: Response) => {
  try {
    const { test_id, result_summary, file_url } = req.body;
    if (!test_id) {
      res.status(400).json({ error: "test_id is required" });
      return;
    }

    // Get lab_test to know patient_id and test_type
    const { data: labTest, error: ltErr } = await serviceClient
      .from("lab_tests")
      .select("id, appointment_id, patient_id, test_type")
      .eq("id", test_id)
      .single();
    if (ltErr || !labTest) {
      res.status(404).json({ error: "Lab test not found" });
      return;
    }

    // Insert lab_report
    const { data: report, error: repErr } = await serviceClient
      .from("lab_reports")
      .insert({
        lab_test_id: test_id,
        patient_id: labTest.patient_id ?? null,
        result_summary: result_summary ?? null,
        file_url: file_url ?? null,
        test_type: labTest.test_type ?? null,
      })
      .select()
      .single();
    if (repErr) {
      res.status(500).json({ error: repErr.message });
      return;
    }

    // Mark lab_test COMPLETED
    await serviceClient
      .from("lab_tests")
      .update({ status: "COMPLETED" })
      .eq("id", test_id);

    // Update appointment
    if (labTest.appointment_id) {
      await serviceClient
        .from("appointments")
        .update({ status: "LAB_COMPLETED", updated_at: new Date().toISOString() })
        .eq("id", labTest.appointment_id);

      // Notify patient
      const { data: appt } = await serviceClient
        .from("appointments").select("patient_id").eq("id", labTest.appointment_id).single();
      if (appt?.patient_id) {
        const { data: patient } = await serviceClient
          .from("patients").select("profile_id, full_name, email, phone").eq("id", appt.patient_id).single();
        if (patient?.profile_id) {
          await serviceClient.from("notifications").insert({
            user_id: patient.profile_id,
            type: "LAB",
            title: "Lab Report Ready",
            body: "Your lab report is ready. Please check your patient portal.",
            entity_id: report.id,
            priority: "NORMAL",
          });
        }
        if (patient?.phone) {
          sendWhatsAppLabNotification({
            recipientPhone: patient.phone,
            patientName: patient.full_name || "Patient",
            testType: labTest.test_type ?? "General Test",
          }).catch((err) => console.error("WhatsApp lab notification failure:", err));

          sendSMS({
            recipientPhone: patient.phone,
            message: `Hello ${patient.full_name || "Patient"}, your lab report for ${labTest.test_type ?? "General Test"} is ready. Check your Medilink patient portal.`,
          }).catch((err) => console.error("SMS lab notification failure:", err));
        }
        if (patient?.email) {
          sendEmail({
            toEmail: patient.email,
            toName: patient.full_name || undefined,
            subject: `Lab Report Ready: ${labTest.test_type ?? "General Test"}`,
            htmlContent: `
              <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 12px;">
                <h2 style="color: #0d7550;">Lab Report Notification</h2>
                <p>Dear <strong>${patient.full_name || "Patient"}</strong>,</p>
                <p>We are pleased to inform you that your lab report for <strong>${labTest.test_type ?? "General Test"}</strong> is ready.</p>
                <p>You can view and download the complete report details, including the PDF, from your patient portal dashboard.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #666; width: 120px;">Test Type:</td>
                    <td style="padding: 6px 0; font-weight: bold;">${labTest.test_type ?? "General Test"}</td>
                  </tr>
                  ${result_summary ? `
                  <tr>
                    <td style="padding: 6px 0; color: #666; width: 120px;">Summary:</td>
                    <td style="padding: 6px 0; font-weight: bold;">${result_summary}</td>
                  </tr>` : ""}
                </table>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p>Thank you for choosing Medilink Digital Health Care!</p>
              </div>
            `,
          }).catch((err) => console.error("Brevo email lab report failure:", err));
        }
      }
    }

    res.json({ success: true, report });
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? "Upload error" });
  }
});

// PATCH /api/lab/verify-report
router.patch("/verify-report", requireAuth, requireRole(LAB_ROLES), async (req: Request, res: Response) => {
  try {
    const { report_id } = req.body;
    if (!report_id) {
      res.status(400).json({ error: "report_id required" });
      return;
    }

    const now = new Date().toISOString();
    const { data, error } = await serviceClient
      .from("lab_reports")
      .update({ verified_by: "Lab Pathologist", verified_at: now })
      .eq("id", report_id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Also mark the linked lab_test as VERIFIED
    if (data?.lab_test_id) {
      await serviceClient.from("lab_tests").update({ status: "VERIFIED" }).eq("id", data.lab_test_id);
    }

    res.json({ success: true, report: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? "Verify error" });
  }
});

// GET /api/lab/reports
router.get("/reports", requireAuth, requireRole(LAB_ROLES), async (_req: Request, res: Response) => {
  try {
    const { data, error } = await serviceClient
      .from("lab_reports")
      .select("id, lab_test_id, patient_id, result_summary, file_url, test_type, verified_by, verified_at, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true, reports: data ?? [] });
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? "Reports fetch error" });
  }
});

export default router;
