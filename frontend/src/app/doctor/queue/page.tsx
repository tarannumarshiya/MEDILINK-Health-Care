"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  FlaskConical,
  Loader2,
  Pill,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/apiFetch";
import { DashboardShell, type TabItem } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Panel } from "@/components/dashboard/Panel";
import { Info } from "@/components/dashboard/Info";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { SuccessBanner } from "@/components/dashboard/SuccessBanner";

type LabReport = {
  id: string;
  result_summary: string | null;
  file_url: string | null;
  verified_at: string | null;
  test_type?: string;
};

type Appointment = {
  id: string;
  patient_id: string | null;
  appointment_code: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string | null;
  department: string;
  preferred_date: string;
  preferred_time: string | null;
  symptoms: string | null;
  status: string;
  lab_required: boolean;
  lab_report_url: string | null;
  lab_reports: LabReport[];
  created_at: string;
};

type MedicineItem = {
  medicine_name: string;
  dosage: string;
  quantity: string;
  timing: string[];
  relation: string;
  instructions: string;
};

type Department = { id: string; name: string };
type HistoryRecord = Record<string, unknown>;
type PatientHistory = {
  appointments: HistoryRecord[];
  prescriptions: HistoryRecord[];
  lab_tests: HistoryRecord[];
  medical_records: HistoryRecord[];
};

type Tab = "queue" | "inprogress" | "completed";

const tabs: TabItem[] = [
  { label: "Patient Queue", value: "queue", icon: <Users className="h-[18px] w-[18px]" /> },
  { label: "In Progress", value: "inprogress", icon: <Clock className="h-[18px] w-[18px]" /> },
  { label: "Completed Today", value: "completed", icon: <CheckCircle2 className="h-[18px] w-[18px]" /> },
];

const EMPTY_MED: MedicineItem = {
  medicine_name: "",
  dosage: "",
  quantity: "1",
  timing: [],
  relation: "",
  instructions: "",
};

const TIMING_SLOTS = ["Morning", "Afternoon", "Evening", "Night"];
const FOOD_RELATION = ["Before food", "After food", "With food"];

function buildInstructions(timing: string[], relation: string, extra: string): string {
  const parts: string[] = [];
  if (timing.length > 0) parts.push(timing.join(" & "));
  if (relation) parts.push(relation);
  if (extra.trim()) parts.push(extra.trim());
  return parts.join(" — ");
}

function isRecord(value: unknown): value is HistoryRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toRecordArray(value: unknown): HistoryRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord);
}

function getText(row: HistoryRecord, key: string, fallback = "—") {
  const value = row[key];
  if (value === null || value === undefined || value === "") return fallback;
  if (["string", "number", "boolean"].includes(typeof value)) return String(value);
  return fallback;
}

function getFirstText(row: HistoryRecord, keys: string[], fallback = "—") {
  for (const key of keys) {
    const value = getText(row, key, "");
    if (value) return value;
  }
  return fallback;
}

function getNumberText(row: HistoryRecord, key: string, fallback = "—") {
  const value = row[key];
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value).toLocaleString();
  }
  return fallback;
}

function getRecordArrayField(row: HistoryRecord, keys: string[]) {
  for (const key of keys) {
    const value = toRecordArray(row[key]);
    if (value.length > 0) return value;
  }
  return [];
}

function getFileUrl(row: HistoryRecord) {
  const value = getFirstText(row, ["file_url", "report_url", "document_url", "attachment_url"], "");
  return value || null;
}

function normaliseHistory(value: unknown): PatientHistory {
  const source = isRecord(value) ? value : {};

  return {
    appointments: toRecordArray(source.appointments),
    prescriptions: toRecordArray(source.prescriptions),
    lab_tests: toRecordArray(source.lab_tests),
    medical_records: toRecordArray(source.medical_records),
  };
}

function formatBDDate(value: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatBDTime(value: string | null) {
  if (!value) return "Any time";
  const normalized = value.includes("T") ? value : `1970-01-01T${value}`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-BD", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka",
  });
}

function HistoryCountCard({
  title,
  count,
  icon,
}: {
  title: string;
  count: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">{title}</p>
        <span className="text-teal-700">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-black text-teal-700">{count}</p>
    </div>
  );
}

function EmptyHistory({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-400">
      {text}
    </p>
  );
}

function HistorySection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-black text-slate-950">{title}</h3>
        <p className="text-xs font-semibold text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function PatientHistoryModal({
  patient,
  history,
  loading,
  error,
  onClose,
}: {
  patient: Appointment;
  history: PatientHistory | null;
  loading: boolean;
  error: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[101] flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-6">
      <div className="w-full max-w-5xl rounded-[var(--radius)] bg-[var(--surface)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-teal-700">Complete Patient History</p>
            <h2 className="mt-1 text-2xl font-black text-[var(--ink)]">{patient.patient_name}</h2>
            <p className="text-sm text-[var(--muted)]">
              {patient.appointment_code} • {patient.patient_phone} • {patient.department}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--ink)] hover:bg-[var(--canvas)]"
          >
            <X className="h-4 w-4" /> Close
          </button>
        </div>

        {loading && (
          <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-2xl bg-slate-50 p-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
            <p className="text-sm font-bold text-slate-500">Loading previous consultations, prescriptions, reports and records...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && history && (
          <div className="mt-6 grid gap-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <HistoryCountCard title="Appointments" count={history.appointments.length} icon={<CalendarDays className="h-5 w-5" />} />
              <HistoryCountCard title="Prescriptions" count={history.prescriptions.length} icon={<Pill className="h-5 w-5" />} />
              <HistoryCountCard title="Lab Tests" count={history.lab_tests.length} icon={<FlaskConical className="h-5 w-5" />} />
              <HistoryCountCard title="Medical Records" count={history.medical_records.length} icon={<FileText className="h-5 w-5" />} />
            </div>

            <HistorySection title="Previous Consultations" subtitle="Dates, departments, symptoms and status">
              {history.appointments.length === 0 ? (
                <EmptyHistory text="No previous appointments found for this patient." />
              ) : (
                <div className="grid gap-3">
                  {history.appointments.map((row, index) => (
                    <div key={getText(row, "id", `appointment-${index}`)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <p className="font-black text-slate-950">
                            {getFirstText(row, ["department", "department_name"], "Department not available")}
                          </p>
                          <p className="text-xs font-mono text-slate-400">
                            {getFirstText(row, ["appointment_code", "code", "id"], "No appointment code")}
                          </p>
                        </div>
                        <StatusBadge status={getFirstText(row, ["status"], "UNKNOWN")} />
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <Info label="Date" value={formatBDDate(getFirstText(row, ["preferred_date", "appointment_date", "created_at"], ""))} />
                        <Info label="Time" value={formatBDTime(getFirstText(row, ["preferred_time", "appointment_time"], ""))} />
                        <Info label="Doctor" value={getFirstText(row, ["doctor_name", "doctor", "assigned_doctor"], "—")} />
                      </div>
                      {getFirstText(row, ["symptoms", "reason", "notes"], "") && (
                        <p className="mt-3 rounded-xl bg-white px-4 py-3 text-sm text-slate-600">
                          <span className="font-bold text-slate-500">Symptoms / Notes: </span>
                          {getFirstText(row, ["symptoms", "reason", "notes"], "")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </HistorySection>

            <HistorySection title="Prescription History" subtitle="Medicines, dosage, quantity and doctor notes">
              {history.prescriptions.length === 0 ? (
                <EmptyHistory text="No previous prescriptions found for this patient." />
              ) : (
                <div className="grid gap-3">
                  {history.prescriptions.map((row, index) => {
                    const items = getRecordArrayField(row, ["items", "prescription_items", "medicines"]);
                    return (
                      <div key={getText(row, "id", `prescription-${index}`)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div>
                            <p className="font-black text-slate-950">
                              Prescription {getFirstText(row, ["prescription_code", "id"], `#${index + 1}`)}
                            </p>
                            <p className="text-xs text-slate-500">{formatBDDate(getFirstText(row, ["created_at", "prescribed_at"], ""))}</p>
                          </div>
                          <StatusBadge status={getFirstText(row, ["status"], "SAVED")} />
                        </div>

                        {getFirstText(row, ["prescription_notes", "notes", "diagnosis"], "") && (
                          <p className="mt-3 rounded-xl bg-white px-4 py-3 text-sm text-slate-600">
                            <span className="font-bold text-slate-500">Doctor Notes: </span>
                            {getFirstText(row, ["prescription_notes", "notes", "diagnosis"], "")}
                          </p>
                        )}

                        {items.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {items.map((item, itemIndex) => (
                              <span
                                key={getText(item, "id", `medicine-${index}-${itemIndex}`)}
                                className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-bold text-blue-700"
                              >
                                {getFirstText(item, ["medicine_name", "name"], "Medicine")}
                                {getFirstText(item, ["dosage"], "") ? ` • ${getFirstText(item, ["dosage"], "")}` : ""}
                                {getFirstText(item, ["quantity"], "") ? ` ×${getFirstText(item, ["quantity"], "")}` : ""}
                                {getFirstText(item, ["instructions"], "") ? ` — ${getFirstText(item, ["instructions"], "")}` : ""}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm font-semibold text-slate-400">No medicine items attached.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </HistorySection>

            <HistorySection title="Lab Reports / Tests" subtitle="Requested tests, summaries, verified reports and files">
              {history.lab_tests.length === 0 ? (
                <EmptyHistory text="No lab tests or reports found for this patient." />
              ) : (
                <div className="grid gap-3">
                  {history.lab_tests.map((row, index) => {
                    const fileUrl = getFileUrl(row);
                    return (
                      <div key={getText(row, "id", `lab-${index}`)} className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div>
                            <p className="font-black text-slate-950">
                              {getFirstText(row, ["test_type", "test_name", "name", "lab_test_name"], "Lab Test")}
                            </p>
                            <p className="text-xs text-blue-700">
                              Created: {formatBDDate(getFirstText(row, ["created_at", "requested_at"], ""))}
                              {getFirstText(row, ["verified_at"], "") ? ` • Verified: ${formatBDDate(getFirstText(row, ["verified_at"], ""))}` : ""}
                            </p>
                          </div>
                          <StatusBadge status={getFirstText(row, ["status"], "REPORT")} />
                        </div>
                        {getFirstText(row, ["result_summary", "summary", "remarks", "notes"], "") && (
                          <p className="mt-3 rounded-xl bg-white px-4 py-3 text-sm text-slate-700">
                            {getFirstText(row, ["result_summary", "summary", "remarks", "notes"], "")}
                          </p>
                        )}
                        {fileUrl && (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white hover:bg-blue-600"
                          >
                            <FileText className="h-4 w-4" /> View / Download Report
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </HistorySection>

            <HistorySection title="Medical Records" subtitle="Uploaded records, diagnoses, clinical notes and attachments">
              {history.medical_records.length === 0 ? (
                <EmptyHistory text="No medical records uploaded for this patient." />
              ) : (
                <div className="grid gap-3">
                  {history.medical_records.map((row, index) => {
                    const fileUrl = getFileUrl(row);
                    return (
                      <div key={getText(row, "id", `record-${index}`)} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="font-black text-slate-950">
                          {getFirstText(row, ["title", "record_type", "type", "name"], `Medical Record ${index + 1}`)}
                        </p>
                        <p className="text-xs text-slate-500">{formatBDDate(getFirstText(row, ["created_at", "uploaded_at", "record_date"], ""))}</p>
                        {getFirstText(row, ["description", "notes", "diagnosis", "summary"], "") && (
                          <p className="mt-3 rounded-xl bg-white px-4 py-3 text-sm text-slate-600">
                            {getFirstText(row, ["description", "notes", "diagnosis", "summary"], "")}
                          </p>
                        )}
                        {fileUrl && (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:border-teal-300 hover:text-teal-700"
                          >
                            <FileText className="h-4 w-4" /> Open Attachment
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </HistorySection>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DoctorQueuePage() {
  const [activeTab, setActiveTab] = useState<Tab>("queue");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [medicines, setMedicines] = useState<MedicineItem[]>([{ ...EMPTY_MED }]);
  const [labTestName, setLabTestName] = useState("");
  const [history, setHistory] = useState<PatientHistory | null>(null);
  const [historyPatient, setHistoryPatient] = useState<Appointment | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const loadQueue = useCallback(async () => {
    setErrorMsg("");
    try {
      const res = await apiFetch("/api/doctor/queue");
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to load queue");
        return;
      }
      setAppointments(data.appointments || []);
      setDepartment(data.department || null);
    } catch {
      setErrorMsg("Network error while loading queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let interval: number;
    const timer = window.setTimeout(() => {
      const supabase = createClient();
      void supabase.auth.getUser().then(({ data }) => {
        if (!data.user) {
          window.location.replace("/doctor/login");
          return;
        }
        void loadQueue();
        
        // Auto-refresh the queue every 10 seconds to catch updates from admin or reception
        interval = window.setInterval(() => {
          void loadQueue();
        }, 10000);
      });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      if (interval) window.clearInterval(interval);
    };
  }, [loadQueue]);

  async function approveAppointment(id: string) {
    setActionId(id);
    const res = await apiFetch("/api/admin/appointments/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: id }),
    });
    const data = await res.json();
    if (data.success) {
      setAppointments(prev => prev.map(a => (a.id === id ? { ...a, status: "APPROVED" } : a)));
      setMessage("Appointment approved.");
    } else {
      setMessage(data.error ?? "Approval failed.");
    }
    setActionId(null);
  }

  async function rejectAppointment(id: string) {
    setActionId(id);
    const res = await apiFetch("/api/admin/appointments/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: id }),
    });
    const data = await res.json();
    if (data.success) {
      setAppointments(prev => prev.map(a => (a.id === id ? { ...a, status: "REJECTED" } : a)));
      setMessage("Appointment rejected.");
    } else {
      setMessage(data.error ?? "Reject failed.");
    }
    setActionId(null);
  }

  async function startConsultation(id: string) {
    setActionId(id);
    const res = await apiFetch("/api/doctor/start-consultation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed to start");
      setActionId(null);
      return;
    }
    setAppointments(prev => prev.map(a => (a.id === id ? { ...a, status: "IN_PROGRESS" } : a)));
    setMessage("Consultation started.");
    setActiveTab("inprogress");
    setActionId(null);
  }

  async function loadHistory(appt: Appointment) {
    if (!appt.patient_id) {
      setMessage("Patient history is not linked for this record.");
      return;
    }

    setHistoryPatient(appt);
    setHistory(null);
    setHistoryError("");
    setHistoryLoading(true);

    try {
      const res = await apiFetch(`/api/doctor/patient-history?patient_id=${encodeURIComponent(appt.patient_id)}`);
      const data = await res.json();
      if (!res.ok) {
        setHistoryError(data.error || "Unable to load history.");
        return;
      }
      setHistory(normaliseHistory(data.history));
    } catch {
      setHistoryError("Network error while loading patient history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function submitPrescription(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;

    const clean = medicines.filter(m => m.medicine_name.trim());
    const willSendToLab = Boolean(labTestName.trim());

    if (!notes.trim() || clean.length === 0) {
      setMessage("Notes and at least one medicine are required.");
      return;
    }

    setActionId(selected.id);
    const res = await apiFetch("/api/doctor/prescription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: selected.id,
        notes,
        labRequired: willSendToLab,
        labTestName,
        medicines: clean.map(m => ({
          medicine_name: m.medicine_name,
          dosage: m.dosage,
          quantity: Number(m.quantity || 1),
          instructions: buildInstructions(m.timing, m.relation, m.instructions),
        })),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed to submit");
      setActionId(null);
      return;
    }

    setSelected(null);
    setMedicines([{ ...EMPTY_MED }]);
    setNotes("");
    setLabTestName("");
    await loadQueue();
    setMessage(willSendToLab ? "Prescription saved — patient sent to lab." : "Prescription saved — patient sent to pharmacy.");
    setActionId(null);
  }

  // Today's date in local timezone (YYYY-MM-DD)
  const todayStr = new Date().toLocaleDateString("en-CA"); // "YYYY-MM-DD"

  const queue = appointments.filter(a =>
    ["PENDING", "APPROVED"].includes(a.status)
  );
  const inProgress = appointments.filter(a => a.status === "IN_PROGRESS");
  const completed = appointments.filter(a =>
    ["COMPLETED", "PRESCRIBED", "LAB_COMPLETED", "PRESCRIPTION_READY", "LAB_REQUESTED", "LAB_PROCESSING", "PHARMACY_PENDING", "PHARMACY_FULFILLED", "INVOICE_GENERATED"].includes(a.status) &&
    a.preferred_date === todayStr  // only today's completed
  );
  const tabData: Record<Tab, Appointment[]> = { queue, inprogress: inProgress, completed };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <DashboardShell
      portalName="Doctor"
      portalSubtitle={`Patient Queue${department ? ` — ${department.name}` : ""}`}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={t => setActiveTab(t as Tab)}
      liveSummary={[
        { label: "Queue", value: queue.length },
        { label: "In Progress", value: inProgress.length },
        { label: "Completed", value: completed.length },
        { label: "Total", value: appointments.length },
      ]}
    >
      {message && <SuccessBanner message={message} onDismiss={() => setMessage("")} />}
      {errorMsg && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" /> {errorMsg}
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <MetricCard label="Awaiting" value={queue.length} icon={<Users className="h-5 w-5" />} />
        <MetricCard label="In Progress" value={inProgress.length} icon={<Clock className="h-5 w-5" />} />
        <MetricCard label="Completed" value={completed.length} icon={<CheckCircle2 className="h-5 w-5" />} />
        <MetricCard label="Total" value={appointments.length} icon={<Stethoscope className="h-5 w-5" />} />
      </div>

      <Panel
        title={activeTab === "queue" ? "Patient Queue" : activeTab === "inprogress" ? "In Progress" : "Completed Today"}
        subtitle={`${tabData[activeTab].length} appointments`}
      >
        {tabData[activeTab].length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-10 text-center text-sm text-slate-400">
            {activeTab === "queue"
              ? "No patients waiting. Queue is clear."
              : activeTab === "inprogress"
                ? "No consultations in progress."
                : "No completed appointments yet today."}
          </p>
        ) : (
          <div className="grid gap-4">
            {tabData[activeTab].map(a => (
              <div key={a.id} className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="text-lg font-black text-[var(--ink)]">{a.patient_name}</h3>
                    <p className="text-sm text-[var(--muted)]">{a.appointment_code} • {a.patient_phone}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <Info label="Department" value={a.department} />
                  <Info label="Date" value={formatBDDate(a.preferred_date)} />
                  <Info label="Time" value={formatBDTime(a.preferred_time)} />
                  <Info label="Booked" value={formatBDDate(a.created_at)} />
                </div>

                {a.symptoms && (
                  <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="font-bold text-slate-500">Symptoms: </span>
                    {a.symptoms}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => loadHistory(a)}
                    className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-black text-teal-700 hover:border-teal-400 hover:bg-teal-100"
                  >
                    <FileText className="h-4 w-4" /> View Full History
                  </button>
                </div>

                {a.status === "PENDING" && (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <p className="text-xs font-bold text-amber-600">⏳ Pending — approve or reject this request:</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => approveAppointment(a.id)}
                        disabled={actionId === a.id}
                        className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-black text-white hover:bg-emerald-500 disabled:opacity-60"
                      >
                        {actionId === a.id ? "…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectAppointment(a.id)}
                        disabled={actionId === a.id}
                        className="rounded-xl bg-red-600 px-5 py-2 text-sm font-black text-white hover:bg-red-500 disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  {a.status === "APPROVED" && (
                    <button
                      type="button"
                      onClick={() => startConsultation(a.id)}
                      disabled={actionId === a.id}
                      className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-60"
                    >
                      {actionId === a.id ? "Starting…" : "Start Consultation"}
                    </button>
                  )}

                  {a.status === "IN_PROGRESS" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(a);
                        setNotes("");
                        setLabTestName("");
                        setMedicines([{ ...EMPTY_MED }]);
                      }}
                      className="rounded-xl bg-teal-700 px-5 py-2 text-sm font-black text-white hover:bg-teal-600"
                    >
                      Write Prescription
                    </button>
                  )}

                  {a.status === "LAB_COMPLETED" && a.lab_reports.length > 0 && (
                    <div className="mt-3 w-full rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-sm font-black text-blue-700">🧪 Lab Report Available</p>
                      {a.lab_reports.map((r, i) => (
                        <div key={r.id || i} className="mt-2">
                          <p className="text-xs font-semibold text-blue-600">{r.test_type}</p>
                          <p className="text-sm text-slate-700">{r.result_summary}</p>
                          {r.file_url && (
                            <a
                              href={r.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-blue-700 underline"
                            >
                              Download Report ↗
                            </a>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(a);
                          setNotes("");
                          setLabTestName("");
                          setMedicines([{ ...EMPTY_MED }]);
                        }}
                        className="mt-3 rounded-xl bg-teal-700 px-5 py-2 text-sm font-black text-white hover:bg-teal-600"
                      >
                        Write Prescription
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-6">
          <form onSubmit={submitPrescription} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[var(--radius)] bg-[var(--surface)] p-6 shadow-2xl">
            <h2 className="text-xl font-black text-[var(--ink)]">Prescription — {selected.patient_name}</h2>
            <p className="text-sm text-[var(--muted)]">{selected.appointment_code}</p>

            <textarea
              required
              className="mt-4 min-h-28 w-full rounded-[var(--radius-sm)] border border-[var(--line)] p-3 text-sm outline-none focus:border-[var(--brand)]"
              placeholder="Diagnosis, clinical notes, advice..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />

            <p className="mt-5 text-sm font-black uppercase tracking-widest text-[var(--muted)]">Medicines</p>
            <div className="mt-3 grid gap-3">
              {medicines.map((m, i) => (
                <div key={i} className="grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--canvas)] p-4">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      className="rounded-lg border border-[var(--line)] p-2.5 text-sm outline-none focus:border-teal-500"
                      placeholder="Medicine name"
                      required
                      value={m.medicine_name}
                      onChange={e => setMedicines(prev => prev.map((p, j) => (j === i ? { ...p, medicine_name: e.target.value } : p)))}
                    />
                    <input
                      className="rounded-lg border border-[var(--line)] p-2.5 text-sm outline-none focus:border-teal-500"
                      placeholder="Dosage e.g. 500mg"
                      value={m.dosage}
                      onChange={e => setMedicines(prev => prev.map((p, j) => (j === i ? { ...p, dosage: e.target.value } : p)))}
                    />
                    <input
                      type="number"
                      min="1"
                      className="rounded-lg border border-[var(--line)] p-2.5 text-sm outline-none focus:border-teal-500"
                      placeholder="Qty"
                      value={m.quantity}
                      onChange={e => setMedicines(prev => prev.map((p, j) => (j === i ? { ...p, quantity: e.target.value } : p)))}
                    />
                  </div>

                  <div>
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">When to take</p>
                    <div className="flex flex-wrap gap-2">
                      {TIMING_SLOTS.map(slot => {
                        const checked = m.timing.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() =>
                              setMedicines(prev =>
                                prev.map((p, j) =>
                                  j === i ? { ...p, timing: checked ? p.timing.filter(t => t !== slot) : [...p.timing, slot] } : p,
                                ),
                              )
                            }
                            className={`rounded-lg border px-3 py-1.5 text-xs font-black transition ${
                              checked
                                ? "border-teal-600 bg-teal-600 text-white"
                                : "border-slate-300 bg-white text-slate-600 hover:border-teal-400 hover:text-teal-700"
                            }`}
                          >
                            {slot === "Morning" ? "🌅" : slot === "Afternoon" ? "☀️" : slot === "Evening" ? "🌆" : "🌙"} {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Food relation</p>
                    <div className="flex flex-wrap gap-2">
                      {FOOD_RELATION.map(rel => (
                        <button
                          key={rel}
                          type="button"
                          onClick={() => setMedicines(prev => prev.map((p, j) => (j === i ? { ...p, relation: p.relation === rel ? "" : rel } : p)))}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-black transition ${
                            m.relation === rel
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-700"
                          }`}
                        >
                          {rel === "Before food" ? "🍽️ Before food" : rel === "After food" ? "✅ After food" : "🥗 With food"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded-lg border border-[var(--line)] p-2.5 text-sm outline-none focus:border-teal-500"
                      placeholder="Additional instructions (optional)"
                      value={m.instructions}
                      onChange={e => setMedicines(prev => prev.map((p, j) => (j === i ? { ...p, instructions: e.target.value } : p)))}
                    />
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setMedicines(prev => prev.filter((_, j) => j !== i))}
                        className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {(m.timing.length > 0 || m.relation) && (
                    <p className="rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700">
                      📋 {m.medicine_name || "This medicine"}: {buildInstructions(m.timing, m.relation, m.instructions)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMedicines(prev => [...prev, { ...EMPTY_MED }])}
              className="mt-3 rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--ink)] hover:bg-[var(--canvas)]"
            >
              + Add Medicine
            </button>

            <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3">
              <label className="text-sm font-bold text-blue-700">Lab test name optional</label>
              <input
                value={labTestName}
                onChange={e => setLabTestName(e.target.value)}
                placeholder="Example: CBC, ECG, MRI Brain"
                className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <p className="mt-1 text-xs font-semibold text-blue-600">Entering a test name sends this patient to the Lab Queue.</p>
            </div>

            <div className="mt-5 flex gap-3">
              <button disabled={actionId === selected.id} className="flex-1 rounded-xl bg-teal-700 py-3 font-black text-white hover:bg-teal-600 disabled:opacity-60">
                {actionId === selected.id ? "Submitting…" : "Submit Prescription"}
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex-1 rounded-xl border border-[var(--line)] py-3 font-bold text-[var(--ink)] hover:bg-[var(--canvas)]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {historyPatient && (
        <PatientHistoryModal
          patient={historyPatient}
          history={history}
          loading={historyLoading}
          error={historyError}
          onClose={() => {
            setHistoryPatient(null);
            setHistory(null);
            setHistoryError("");
          }}
        />
      )}
    </DashboardShell>
  );
}
