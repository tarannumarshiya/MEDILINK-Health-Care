
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Video,
  FileText,
  Pill,
  Loader2,
  User,
  Stethoscope,
  Calendar,
  Clock,
  ClipboardList,
  Hash,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/apiFetch";
import { DashboardShell, type TabItem } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Panel } from "@/components/dashboard/Panel";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { SuccessBanner } from "@/components/dashboard/SuccessBanner";

type Session = {
  id: string;
  appointment_id: string | null;
  doctor_id: string | null;
  patient_id: string | null;
  scheduled_at: string;
  status: string;
  recording_url: string | null;
  doctor_name?: string | null;
  patient_name?: string | null;
  department?: string | null;
  reason?: string | null;
  room_url?: string | null;
  consultation_reason?: string | null;
};

type PrescriptionItem = {
  id: string;
  medicine_name: string;
  dosage: string | null;
  quantity: number;
  instructions: string | null;
};

type Prescription = {
  id: string;
  appointment_id: string | null;
  doctor_id: string | null;
  patient_id: string | null;
  prescription_notes: string | null;
  status: string;
  created_at: string;
  doctor_name?: string | null;
  patient_name?: string | null;
  department?: string | null;
  consultation_reference?: string | null;
  items?: PrescriptionItem[];
};

type PrescriptionItemRow = PrescriptionItem & {
  prescription_id: string;
};

type AppointmentRow = {
  id: string;
  patient_name?: string | null;
  name?: string | null;
  department?: string | null;
  symptoms?: string | null;
  reason?: string | null;
  description?: string | null;
  [key: string]: unknown;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  name?: string | null;
  department?: string | null;
  specialty_dept?: string | null;
  [key: string]: unknown;
};

type Tab = "sessions" | "recordings" | "prescriptions";

const tabs: TabItem[] = [
  {
    label: "Video Sessions",
    value: "sessions",
    icon: <Video className="h-[18px] w-[18px]" />,
  },
  {
    label: "Recordings",
    value: "recordings",
    icon: <FileText className="h-[18px] w-[18px]" />,
  },
  {
    label: "Digital Prescriptions",
    value: "prescriptions",
    icon: <Pill className="h-[18px] w-[18px]" />,
  },
];

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

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-400">
      {text}
    </p>
  );
}

function normalizeStatus(status?: string | null) {
  return String(status ?? "").trim().toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString();
}

function formatTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function cleanText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function displayShortId(value?: string | null) {
  if (!value) return "—";
  return value.length > 8 ? value.slice(0, 8).toUpperCase() : value.toUpperCase();
}

function getFallbackPatientName(index: number) {
  return fallbackPatientNames[index % fallbackPatientNames.length];
}

export default function TelemedicineDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("sessions");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [flashId, setFlashId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const [sessRes, rxRes, itemsRes] = await Promise.all([
        supabase
          .from("telemedicine_sessions")
          .select("*")
          .order("scheduled_at", { ascending: false }),

        supabase
          .from("prescriptions")
          .select("*")
          .order("created_at", { ascending: false })
          .not("appointment_id", "is", null),

        supabase.from("prescription_items").select("*"),
      ]);

      if (sessRes.error) {
        setMessage(sessRes.error.message ?? "Failed to load telemedicine sessions.");
      }

      if (rxRes.error) {
        setMessage(rxRes.error.message ?? "Failed to load prescriptions.");
      }

      const sessionRows = (sessRes.data ?? []) as Session[];
      const prescriptionRows = (rxRes.data ?? []) as Prescription[];
      const itemRows = (itemsRes.data ?? []) as PrescriptionItemRow[];

      const appointmentIds = uniqueStrings(
        [
          ...sessionRows.map((session) => session.appointment_id),
          ...prescriptionRows.map((rx) => rx.appointment_id),
        ].filter(isNonEmptyString)
      );

      const profileIds = uniqueStrings(
        [
          ...sessionRows.map((session) => session.patient_id),
          ...sessionRows.map((session) => session.doctor_id),
          ...prescriptionRows.map((rx) => rx.patient_id),
          ...prescriptionRows.map((rx) => rx.doctor_id),
        ].filter(isNonEmptyString)
      );

      let appointmentRows: AppointmentRow[] = [];
      let profileRows: ProfileRow[] = [];

      if (appointmentIds.length > 0) {
        const { data } = await supabase
          .from("appointments")
          .select("*")
          .in("id", appointmentIds);

        appointmentRows = (data ?? []) as AppointmentRow[];
      }

      if (profileIds.length > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .in("id", profileIds);

        profileRows = (data ?? []) as ProfileRow[];
      }

      const appointmentsById = new Map(
        appointmentRows.map((appointment) => [appointment.id, appointment])
      );

      const profilesById = new Map(
        profileRows.map((profile) => [profile.id, profile])
      );

      const mappedSessions: Session[] = sessionRows.map((session, index) => {
        const appointment = session.appointment_id
          ? appointmentsById.get(session.appointment_id)
          : undefined;

        const patientProfile = session.patient_id
          ? profilesById.get(session.patient_id)
          : undefined;

        const doctorProfile = session.doctor_id
          ? profilesById.get(session.doctor_id)
          : undefined;

        const patientName =
          cleanText(session.patient_name) ||
          cleanText(patientProfile?.full_name) ||
          cleanText(patientProfile?.name) ||
          cleanText(appointment?.patient_name) ||
          cleanText(appointment?.name) ||
          getFallbackPatientName(index);

        const doctorName =
          cleanText(session.doctor_name) ||
          cleanText(doctorProfile?.full_name) ||
          cleanText(doctorProfile?.name) ||
          "Medical Practitioner";

        const department =
          cleanText(session.department) ||
          cleanText(doctorProfile?.department) ||
          cleanText(doctorProfile?.specialty_dept) ||
          cleanText(appointment?.department) ||
          "General Consultation";

        const reason =
          cleanText(session.reason) ||
          cleanText(session.consultation_reason) ||
          cleanText(appointment?.reason) ||
          cleanText(appointment?.symptoms) ||
          cleanText(appointment?.description) ||
          "General consultation";

        let currentStatus = normalizeStatus(session.status || "SCHEDULED");
        if (currentStatus === "SCHEDULED") {
          const scheduledTime = new Date(session.scheduled_at).getTime();
          // Mark as missed if 60 minutes have passed
          if (Date.now() > scheduledTime + 60 * 60 * 1000) {
            currentStatus = "MISSED";
            // Fire-and-forget background update
            supabase.from("telemedicine_sessions").update({ status: "MISSED" }).eq("id", session.id).then();
          }
        }

        return {
          ...session,
          status: currentStatus,
          patient_name: patientName,
          doctor_name: doctorName,
          department,
          reason,
        };
      });

      const mappedPrescriptions: Prescription[] = prescriptionRows.map((rx, index) => {
        const appointment = rx.appointment_id
          ? appointmentsById.get(rx.appointment_id)
          : undefined;

        const patientProfile = rx.patient_id
          ? profilesById.get(rx.patient_id)
          : undefined;

        const doctorProfile = rx.doctor_id
          ? profilesById.get(rx.doctor_id)
          : undefined;

        const patientName =
          cleanText(rx.patient_name) ||
          cleanText(patientProfile?.full_name) ||
          cleanText(patientProfile?.name) ||
          cleanText(appointment?.patient_name) ||
          cleanText(appointment?.name) ||
          getFallbackPatientName(index);

        const doctorName =
          cleanText(rx.doctor_name) ||
          cleanText(doctorProfile?.full_name) ||
          cleanText(doctorProfile?.name) ||
          "Medical Practitioner";

        const department =
          cleanText(rx.department) ||
          cleanText(doctorProfile?.department) ||
          cleanText(doctorProfile?.specialty_dept) ||
          cleanText(appointment?.department) ||
          "General Consultation";

        return {
          ...rx,
          patient_name: patientName,
          doctor_name: doctorName,
          department,
          consultation_reference: rx.appointment_id || rx.id,
          items: itemRows.filter((item) => item.prescription_id === rx.id),
        };
      });

      setSessions(mappedSessions);
      setPrescriptions(mappedPrescriptions);
    } catch {
      setMessage("Unable to load telemedicine data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: auth }) => {
      if (!auth.user) {
        window.location.href = "/telemedicine/login";
        return;
      }

      await loadData();
    });
  }, []);

  function flash(id: string, msg: string) {
    setFlashId(id);
    setMessage(msg);

    setTimeout(() => setFlashId(null), 800);
  }

  async function updateSessionStatus(
    id: string,
    status: "SCHEDULED" | "ONGOING" | "COMPLETED"
  ) {
    setBusyId(id);
    setMessage("");

    try {
      const res = await apiFetch("/api/telemedicine/update-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: id,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(data.error ?? "Failed to update session status.");
        return false;
      }

      setSessions((prev) =>
        prev.map((session) =>
          session.id === id ? { ...session, status } : session
        )
      );

      if (status === "COMPLETED") {
        flash(id, "Joined room successfully. Status updated to Completed.");
      }

      if (status === "ONGOING") {
        flash(id, "Session moved to Ongoing.");
      }

      return true;
    } catch {
      setMessage("Something went wrong while updating session.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function joinSession(session: Session) {
    const updated = await updateSessionStatus(session.id, "ONGOING");

    if (updated) {
      const roomUrl = session.room_url || `https://meet.jit.si/medlink-session-${session.id}`;
      window.open(roomUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function endSession(id: string) {
    await updateSessionStatus(id, "COMPLETED");
  }

  const scheduledSessions = useMemo(
    () => sessions.filter((session) => normalizeStatus(session.status) === "SCHEDULED"),
    [sessions]
  );

  const ongoingSessions = useMemo(
    () => sessions.filter((session) => normalizeStatus(session.status) === "ONGOING"),
    [sessions]
  );

  const completedSessions = useMemo(
    () => sessions.filter((session) => normalizeStatus(session.status) === "COMPLETED"),
    [sessions]
  );

  const activeSessions = useMemo(
    () => [...ongoingSessions, ...scheduledSessions],
    [ongoingSessions, scheduledSessions]
  );

  const recordings = useMemo(
    () =>
      sessions.filter(
        (session) =>
          normalizeStatus(session.status) === "COMPLETED" &&
          Boolean(session.recording_url)
      ),
    [sessions]
  );

  const scheduled = scheduledSessions.length;
  const ongoing = ongoingSessions.length;
  const completed = completedSessions.length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <DashboardShell
      portalName="Telemedicine"
      portalSubtitle="Virtual Consultation Platform"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as Tab)}
      liveSummary={[
        { label: "Ongoing Now", value: ongoing },
        { label: "Scheduled", value: scheduled },
        { label: "Completed", value: completed },
      ]}
    >
      {message && (
        <SuccessBanner message={message} onDismiss={() => setMessage("")} />
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Ongoing"
          value={ongoing}
          icon={<Video className="h-5 w-5" />}
        />
        <MetricCard
          label="Scheduled"
          value={scheduled}
          icon={<FileText className="h-5 w-5" />}
        />
        <MetricCard
          label="Completed"
          value={completed}
          icon={<Pill className="h-5 w-5" />}
        />
      </div>

      <div key={activeTab} className="animate-fade-rise">
        {activeTab === "sessions" && (
          <div className="grid gap-6">
            <Panel
              title="Scheduled / Ongoing Video Consultations"
              subtitle={`${activeSessions.length} active sessions`}
            >
              <div className="grid gap-4">
                {activeSessions.map((session) => {
                  const status = normalizeStatus(session.status);
                  const isScheduled = status === "SCHEDULED";
                  const isOngoing = status === "ONGOING";

                  return (
                    <div
                      key={session.id}
                      className={`rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] transition-colors duration-300 ${
                        flashId === session.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div className="space-y-3">
                          <h3 className="flex items-center gap-2 text-xl font-black text-slate-950">
                            <User className="h-5 w-5 text-slate-400" />
                            Patient: {session.patient_name}
                          </h3>

                          <div className="grid gap-2 text-sm font-bold text-slate-600 sm:grid-cols-2">
                            <p>
                              <span className="text-slate-400">Doctor:</span>{" "}
                              {session.doctor_name}
                            </p>

                            <p>
                              <span className="text-slate-400">
                                Department:
                              </span>{" "}
                              {session.department}
                            </p>

                            <p className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              {formatDate(session.scheduled_at)}
                            </p>

                            <p className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-slate-400" />
                              {formatTime(session.scheduled_at)}
                            </p>
                          </div>

                          <p className="inline-flex items-center gap-1 rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700">
                            <Stethoscope className="h-4 w-4" />
                            Reason: {session.reason}
                          </p>
                        </div>

                        <StatusBadge status={session.status} />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        {isScheduled && (() => {
                          const scheduledTime = new Date(session.scheduled_at).getTime();
                          const now = Date.now();
                          // Allow joining 5 minutes before scheduled time, up to 1 hour after
                          const isTime = now >= scheduledTime - 5 * 60 * 1000 && now <= scheduledTime + 60 * 60 * 1000;
                          
                          if (!isTime) {
                            return (
                              <button disabled className="rounded-2xl bg-blue-600 px-6 py-3 font-black text-white opacity-50 cursor-not-allowed">
                                Opens at {new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </button>
                            );
                          }
                          return (
                            <button
                              disabled={busyId === session.id}
                              onClick={() => joinSession(session)}
                              className="rounded-2xl bg-blue-600 px-6 py-3 font-black text-white hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {busyId === session.id ? "Joining…" : "Join Room"}
                            </button>
                          );
                        })()}

                        {isOngoing && (
                          <button
                            disabled={busyId === session.id}
                            onClick={() => endSession(session.id)}
                            className="rounded-2xl bg-red-600 px-6 py-3 font-black text-white hover:bg-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {busyId === session.id ? "Ending…" : "End Session"}
                          </button>
                        )}

                        {session.recording_url && (
                          <a
                            href={session.recording_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 font-bold text-slate-600 hover:bg-slate-100"
                          >
                            View Recording
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}

                {activeSessions.length === 0 && (
                  <Empty text="No scheduled or ongoing video consultations found." />
                )}
              </div>
            </Panel>

            <Panel
              title="Completed Consultations"
              subtitle={`${completedSessions.length} completed`}
            >
              <div className="grid gap-4">
                {completedSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] ${
                      flashId === session.id ? "bg-emerald-50" : ""
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <h3 className="font-black text-slate-950">
                          Patient: {session.patient_name}
                        </h3>

                        <p className="mt-1 text-sm font-bold text-slate-500">
                          Doctor: {session.doctor_name} • {session.department}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(session.scheduled_at)} at{" "}
                          {formatTime(session.scheduled_at)}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Reason: {session.reason}
                        </p>
                      </div>

                      <StatusBadge status={session.status} />
                    </div>

                    {session.recording_url && (
                      <a
                        href={session.recording_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex rounded-xl border border-teal-200 px-4 py-2 text-sm font-black text-teal-700 hover:bg-teal-50"
                      >
                        View Recording
                      </a>
                    )}
                  </div>
                ))}

                {completedSessions.length === 0 && (
                  <Empty text="No completed consultations yet." />
                )}
              </div>
            </Panel>
          </div>
        )}

        {activeTab === "recordings" && (
          <Panel
            title="Session Recordings"
            subtitle={`${recordings.length} recordings`}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {recordings.map((session) => (
                <div
                  key={session.id}
                  className="overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)] transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex h-40 items-center justify-center bg-slate-100 text-5xl">
                    ▶️
                  </div>

                  <div className="p-5">
                    <h3 className="font-black text-slate-950">
                      {session.patient_name}
                    </h3>

                    <p className="text-sm font-bold text-slate-500">
                      {session.doctor_name}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {session.department}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-slate-400">
                        {formatDate(session.scheduled_at)}
                      </p>

                      <a
                        href={session.recording_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-teal-200 px-3 py-1 text-sm font-black text-teal-700 hover:bg-teal-50"
                      >
                        View
                      </a>
                    </div>
                  </div>
                </div>
              ))}

              {recordings.length === 0 && (
                <Empty text="No recordings yet. They appear here once sessions are completed." />
              )}
            </div>
          </Panel>
        )}

        {activeTab === "prescriptions" && (
          <Panel
            title="Digital Prescriptions"
            subtitle={`${prescriptions.length} e-prescriptions`}
          >
            <div className="grid gap-4">
              {prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]"
                >
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start">
                    <div className="space-y-3">
                      <h3 className="flex items-center gap-2 text-xl font-black text-slate-950">
                        <User className="h-5 w-5 text-slate-400" />
                        Patient: {rx.patient_name}
                      </h3>

                      <div className="grid gap-2 text-sm font-bold text-slate-600 sm:grid-cols-2">
                        <p>
                          <span className="text-slate-400">Doctor:</span>{" "}
                          {rx.doctor_name}
                        </p>

                        <p>
                          <span className="text-slate-400">
                            Department/Specialization:
                          </span>{" "}
                          {rx.department}
                        </p>

                        <p className="flex items-center gap-1">
                          <Hash className="h-4 w-4 text-slate-400" />
                          Prescription ID: RX-{displayShortId(rx.id)}
                        </p>

                        <p className="flex items-center gap-1">
                          <ClipboardList className="h-4 w-4 text-slate-400" />
                          Consultation Ref:{" "}
                          {displayShortId(rx.consultation_reference)}
                        </p>

                        <p className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          Date: {formatDate(rx.created_at)}
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={rx.status} />
                  </div>

                  {rx.prescription_notes && (
                    <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="mb-1 text-xs font-black uppercase tracking-widest text-slate-500">
                        Doctor Notes
                      </p>

                      <p className="text-sm font-medium text-slate-700">
                        {rx.prescription_notes}
                      </p>
                    </div>
                  )}

                  <div className="mt-5">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Prescribed Medicines
                    </p>

                    <div className="mt-3 grid gap-3">
                      {rx.items && rx.items.length > 0 ? (
                        rx.items.map((item) => (
                          <div
                            key={item.id}
                            className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-[1fr_auto]"
                          >
                            <div>
                              <p className="font-black text-slate-950">
                                {item.medicine_name}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                Instructions: {item.instructions ?? "—"}
                              </p>
                            </div>

                            <div className="rounded-xl bg-white px-4 py-2 text-right shadow-sm">
                              <p className="text-xs font-bold uppercase text-slate-400">
                                Dosage / Qty
                              </p>

                              <p className="font-black text-teal-700">
                                {item.dosage ?? "—"} × {item.quantity}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <Empty text="No medicine items added to this prescription." />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {prescriptions.length === 0 && (
                <Empty text="No digital prescriptions yet." />
              )}
            </div>
          </Panel>
        )}
      </div>
    </DashboardShell>
  );
}
