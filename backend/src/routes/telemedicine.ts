import { Router, Request, Response } from "express";
import { serviceClient } from "../lib/supabase";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

const TELE_ROLES = [
  "DOCTOR",
  "TELEMEDICINE",
  "TELEMEDICINE_ADMIN",
  "ADMIN",
  "SUPER_ADMIN",
  "HOSPITAL_ADMIN",
  "PATIENT",
];

type TelemedicineStatus = "PENDING" | "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED" | "MISSED";

type TelemedicineSessionRow = {
  id: string;
  appointment_id: string | null;
  doctor_id: string | null;
  patient_id: string | null;
  scheduled_at: string;
  status: string;
  recording_url: string | null;
  created_at?: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  name?: string | null;
  department?: string | null;
  specialty_dept?: string | null;
};

type AppointmentRow = {
  id: string;
  patient_name?: string | null;
  name?: string | null;
  department?: string | null;
  symptoms?: string | null;
  reason?: string | null;
  description?: string | null;
};

type CreateSessionBody = {
  appointment_id?: string | null;
  doctor_id?: string | null;
  patient_id?: string | null;
  scheduled_at?: string;
};

type UpdateStatusBody = {
  session_id?: string;
  status?: string;
  recording_url?: string | null;
};

const fallbackPatientNames = [
  "Jhansi",
  "Sameer",
  "Arshiya",
  "Manohar",
  "Preetham",
  "Ayesha",
  "Rahul",
  "Sana",
  "Kiran",
  "Meghana",
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

function cleanText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStatus(status: string): TelemedicineStatus | null {
  const upperStatus = status.trim().toUpperCase();

  if (
    upperStatus === "PENDING" ||
    upperStatus === "SCHEDULED" ||
    upperStatus === "ONGOING" ||
    upperStatus === "COMPLETED" ||
    upperStatus === "CANCELLED" ||
    upperStatus === "MISSED"
  ) {
    return upperStatus as TelemedicineStatus;
  }

  return null;
}

function getFallbackPatientName(index: number) {
  return fallbackPatientNames[index % fallbackPatientNames.length];
}

// GET /api/telemedicine/sessions
router.get(
  "/sessions",
  requireAuth,
  requireRole(TELE_ROLES),
  async (_req: Request, res: Response) => {
    try {
      const { data, error } = await serviceClient
        .from("telemedicine_sessions")
        .select(
          "id,appointment_id,doctor_id,patient_id,scheduled_at,status,recording_url,created_at"
        )
        .order("scheduled_at", { ascending: false });

      if (error) {
        return void res.status(500).json({
          success: false,
          error: error.message,
        });
      }

      const sessions = (data ?? []) as TelemedicineSessionRow[];

      const doctorIds = Array.from(
        new Set(
          sessions
            .map((session) => session.doctor_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      const patientIds = Array.from(
        new Set(
          sessions
            .map((session) => session.patient_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      const appointmentIds = Array.from(
        new Set(
          sessions
            .map((session) => session.appointment_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      const profileIds = Array.from(new Set([...doctorIds, ...patientIds]));

      let profiles: ProfileRow[] = [];
      let appointments: AppointmentRow[] = [];

      if (profileIds.length > 0) {
        const { data: profileData, error: profileError } = await serviceClient
          .from("profiles")
          .select("id,full_name,name,department,specialty_dept")
          .in("id", profileIds);

        if (profileError) {
          return void res.status(500).json({
            success: false,
            error: profileError.message,
          });
        }

        profiles = (profileData ?? []) as ProfileRow[];
      }

      if (appointmentIds.length > 0) {
        const { data: appointmentData, error: appointmentError } =
          await serviceClient
            .from("appointments")
            .select("id,patient_name,name,department,symptoms,reason,description")
            .in("id", appointmentIds);

        if (appointmentError) {
          return void res.status(500).json({
            success: false,
            error: appointmentError.message,
          });
        }

        appointments = (appointmentData ?? []) as AppointmentRow[];
      }

      const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
      const appointmentMap = new Map(
        appointments.map((appointment) => [appointment.id, appointment])
      );

      const now = new Date();
      const expiredSessionIds: string[] = [];

      const enriched = sessions.map((session, index) => {
        let currentStatus = normalizeStatus(session.status) ?? "SCHEDULED";

        if (currentStatus === "SCHEDULED") {
          const scheduledTime = new Date(session.scheduled_at);
          // Mark as missed if 60 minutes have passed since the scheduled time
          const expirationTime = new Date(scheduledTime.getTime() + 60 * 60 * 1000);
          if (now > expirationTime) {
            currentStatus = "MISSED";
            expiredSessionIds.push(session.id);
          }
        }

        const doctorProfile = session.doctor_id
          ? profileMap.get(session.doctor_id)
          : undefined;

        const patientProfile = session.patient_id
          ? profileMap.get(session.patient_id)
          : undefined;

        const appointment = session.appointment_id
          ? appointmentMap.get(session.appointment_id)
          : undefined;

        const doctorName =
          cleanText(doctorProfile?.full_name) ||
          cleanText(doctorProfile?.name) ||
          "Medical Practitioner";

        const patientName =
          cleanText(patientProfile?.full_name) ||
          cleanText(patientProfile?.name) ||
          cleanText(appointment?.patient_name) ||
          cleanText(appointment?.name) ||
          getFallbackPatientName(index);

        const department =
          cleanText(doctorProfile?.department) ||
          cleanText(doctorProfile?.specialty_dept) ||
          cleanText(appointment?.department) ||
          "General Consultation";

        const reason =
          cleanText(appointment?.reason) ||
          cleanText(appointment?.symptoms) ||
          cleanText(appointment?.description) ||
          "General consultation";

        return {
          ...session,
          status: currentStatus,
          doctor_name: doctorName.startsWith("Dr.")
            ? doctorName
            : `Dr. ${doctorName}`,
          patient_name: patientName,
          department,
          reason,
        };
      });

      // Asynchronously update expired sessions in the database
      if (expiredSessionIds.length > 0) {
        serviceClient
          .from("telemedicine_sessions")
          .update({ status: "MISSED" })
          .in("id", expiredSessionIds)
          .then(({ error }) => {
            if (error) console.error("Failed to auto-miss telemedicine sessions:", error);
          });
      }

      return void res.json({
        success: true,
        sessions: enriched,
      });
    } catch (error: unknown) {
      return void res.status(500).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  }
);

// POST /api/telemedicine/create
router.post("/create", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      appointment_id,
      doctor_id,
      patient_id,
      scheduled_at,
      reason,
    } = req.body as CreateSessionBody & { reason?: string };

    if (!scheduled_at) {
      return void res.status(400).json({
        success: false,
        error: "scheduled_at required",
      });
    }

    const { data, error } = await serviceClient
      .from("telemedicine_sessions")
      .insert({
        appointment_id: appointment_id ?? null,
        doctor_id: doctor_id ?? null,
        patient_id: patient_id ?? null,
        scheduled_at,
        status: "SCHEDULED",
        reason: reason ?? null
      })
      .select()
      .single();

    if (error) {
      return void res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return void res.json({
      success: true,
      session: data,
    });
  } catch (error: unknown) {
    return void res.status(500).json({
      success: false,
      error: getErrorMessage(error),
    });
  }
});

// PATCH /api/telemedicine/update-status
router.patch(
  "/update-status",
  requireAuth,
  requireRole(TELE_ROLES),
  async (req: Request, res: Response) => {
    try {
      const { session_id, status, recording_url } =
        req.body as UpdateStatusBody;

      if (!session_id || !status) {
        return void res.status(400).json({
          success: false,
          error: "session_id and status required",
        });
      }

      const normalizedStatus = normalizeStatus(status);

      if (!normalizedStatus) {
        return void res.status(400).json({
          success: false,
          error: "Invalid status. Use SCHEDULED, ONGOING, COMPLETED, CANCELLED, or MISSED.",
        });
      }

      const updates: {
        status: TelemedicineStatus;
        recording_url?: string;
      } = {
        status: normalizedStatus,
      };

      if (recording_url) {
        updates.recording_url = recording_url;
      }

      const { data, error } = await serviceClient
        .from("telemedicine_sessions")
        .update(updates)
        .eq("id", session_id)
        .select(
          "id,appointment_id,doctor_id,patient_id,scheduled_at,status,recording_url,created_at"
        )
        .single();

      if (error) {
        return void res.status(500).json({
          success: false,
          error: error.message,
        });
      }

      // Sync status to the original appointment
      if (data.appointment_id) {
        let appointmentStatus = "PENDING";
        if (normalizedStatus === "SCHEDULED" || normalizedStatus === "ONGOING") appointmentStatus = "APPROVED";
        else if (normalizedStatus === "COMPLETED") appointmentStatus = "COMPLETED";
        else if (normalizedStatus === "CANCELLED" || normalizedStatus === "MISSED") appointmentStatus = "REJECTED"; // or CANCELLED if supported
        
        await serviceClient
          .from("appointments")
          .update({ status: appointmentStatus })
          .eq("id", data.appointment_id);
      }

      return void res.json({
        success: true,
        message: `Session status updated to ${normalizedStatus}`,
        session: data,
      });
    } catch (error: unknown) {
      return void res.status(500).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  }
);

// PATCH /api/telemedicine/admin-approve
router.patch(
  "/admin-approve",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN", "HOSPITAL_ADMIN", "TELEMEDICINE_ADMIN"]),
  async (req: Request, res: Response) => {
    try {
      const { session_id, doctor_id } = req.body;

      if (!session_id || !doctor_id) {
        return void res.status(400).json({
          success: false,
          error: "session_id and doctor_id are required",
        });
      }

      const { data, error } = await serviceClient
        .from("telemedicine_sessions")
        .update({
          status: "SCHEDULED",
          doctor_id,
        })
        .eq("id", session_id)
        .select()
        .single();

      if (error) {
        return void res.status(500).json({
          success: false,
          error: error.message,
        });
      }

      return void res.json({
        success: true,
        message: "Session approved and doctor assigned.",
        session: data,
      });
    } catch (error: unknown) {
      return void res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;