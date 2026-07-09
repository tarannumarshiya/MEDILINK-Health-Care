"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/apiFetch";
import {
  ClipboardList, Calendar, UserCheck, BarChart3, Stethoscope, Loader2, Users, UserPlus,
} from "lucide-react";
import { DashboardShell, type TabItem } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Panel } from "@/components/dashboard/Panel";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { SuccessBanner } from "@/components/dashboard/SuccessBanner";

/* ── types ── */
type Appointment = {
  id: string; appointment_code: string; patient_name: string;
  patient_phone: string; department: string;
  preferred_date: string; preferred_time: string | null;
  symptoms: string | null; status: string;
};

type Patient = {
  id: string; patient_code: string; full_name: string;
  phone: string; email: string | null; age: number | null; created_at: string;
};

type Doctor = {
  id: string; full_name: string; department_name: string;
  qualification: string | null; experience_years: number;
  consultation_fee: number; is_available: boolean;
};

type WalkIn = { id: string; patient_name: string; phone: string; department: string; reason: string | null; arrived_at: string; status: string; position: number };

type Tab = "registration" | "appointments" | "walkins" | "queue" | "availability" | "patients";

const tabs: TabItem[] = [
  { label: "Registration",  value: "registration",  icon: <ClipboardList className="h-[18px] w-[18px]" /> },
  { label: "Appointments",  value: "appointments",  icon: <Calendar      className="h-[18px] w-[18px]" /> },
  { label: "Patients",      value: "patients",      icon: <Users         className="h-[18px] w-[18px]" /> },
  { label: "Walk-Ins",      value: "walkins",       icon: <UserCheck     className="h-[18px] w-[18px]" /> },
  { label: "Queue",         value: "queue",         icon: <BarChart3     className="h-[18px] w-[18px]" /> },
  { label: "Doctors",       value: "availability",  icon: <Stethoscope   className="h-[18px] w-[18px]" /> },
];

const DEPARTMENTS = [
  "General Medicine", "Cardiology", "Orthopedics",
  "Pediatrics", "Neurology", "Emergency / Trauma",
];

const visibleRegisterButtonCls =
  "flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-teal-900 px-6 text-base font-black text-white shadow-xl transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70";

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-400">{text}</p>;
}

export default function ReceptionDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("registration");
  const [loading, setLoading]     = useState(true);
  const [message, setMessage]     = useState("");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients]         = useState<Patient[]>([]);
  const [doctors, setDoctors]           = useState<Doctor[]>([]);

  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);

  const [regForm, setRegForm] = useState({
    full_name: "", age: "", phone: "", email: "", department: "", symptoms: "",
  });
  const [registering, setRegistering] = useState(false);
  const [toggling, setToggling]       = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: auth }) => {
      if (!auth.user) { window.location.href = "/reception/login"; return; }
      const res = await apiFetch("/api/reception/queue");
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments ?? []);
        setPatients(data.patients ?? []);
        setDoctors(data.doctors ?? []);
        setWalkIns(data.walkIns ?? []);
      }
      setLoading(false);
    });
  }, []);

  async function registerPatient(e: React.FormEvent) {
    e.preventDefault();
    if (!regForm.full_name || !regForm.phone) return;
    setRegistering(true);
    const res = await apiFetch("/api/reception/check-in", {
      method: "POST",
      body: JSON.stringify(regForm),
    });
    const data = await res.json();
    if (data.success) {
      setAppointments(prev => [data.appointment, ...prev]);
      setMessage(`Registered: ${data.patient.patient_code} — Appointment ${data.appointment.appointment_code}`);

      // Add walk-in queue entry before clearing the form.
      const wiRes = await apiFetch("/api/reception/walk-in", {
        method: "POST",
        body: JSON.stringify({
          patient_name: regForm.full_name,
          phone: regForm.phone,
          department: regForm.department || "General Medicine",
          reason: regForm.symptoms || null,
        }),
      });
      const wiData = await wiRes.json();
      if (wiData.success) setWalkIns(prev => [...prev, wiData.walkIn]);

      setRegForm({ full_name: "", age: "", phone: "", email: "", department: "", symptoms: "" });
    } else {
      setMessage(data.error ?? "Registration failed");
    }
    setRegistering(false);
  }

  function moveUp(id: string) {
    const idx = walkIns.findIndex(q => q.id === id);
    if (idx <= 0) return;
    const updated = [...walkIns];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    setWalkIns(updated.map((q, i) => ({ ...q, position: i + 1 })));
  }

  function moveDown(id: string) {
    const idx = walkIns.findIndex(q => q.id === id);
    if (idx < 0 || idx >= walkIns.length - 1) return;
    const updated = [...walkIns];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    setWalkIns(updated.map((q, i) => ({ ...q, position: i + 1 })));
  }

  async function markSeen(id: string) {
    await apiFetch("/api/reception/walk-in-status", {
      method: "PATCH",
      body: JSON.stringify({ id, status: "WITH_DOCTOR" }),
    });
    setWalkIns(prev => prev.map(q => q.id === id ? { ...q, status: "WITH_DOCTOR" } : q));
    setMessage("Patient sent to doctor.");
  }

  /* ── Toggle doctor availability — writes to DB ── */
  async function toggleDoctor(id: string) {
    setToggling(id);
    const doc = doctors.find(d => d.id === id);
    if (!doc) { setToggling(null); return; }
    await apiFetch("/api/reception/toggle-doctor", { method: "PATCH", body: JSON.stringify({ doctor_id: id, is_available: !doc.is_available }) });
    setDoctors(prev => prev.map(d => d.id === id ? { ...d, is_available: !d.is_available } : d));
    setToggling(null);
  }

  const todayCount     = appointments.length;
  const waitingQueue   = walkIns.filter(q => q.status === "WAITING").length;
  const availableDocs  = doctors.filter(d => d.is_available).length;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
    </div>
  );

  return (
    <DashboardShell
      portalName="Reception"
      portalSubtitle="Front Desk Management"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={t => setActiveTab(t as Tab)}
      liveSummary={[
        { label: "Today Appts", value: todayCount },
        { label: "In Queue",    value: waitingQueue },
        { label: "Walk-Ins", value: walkIns.length },
        { label: "Doctors On",  value: availableDocs },
      ]}
    >
      {message && <SuccessBanner message={message} onDismiss={() => setMessage("")} />}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Today Appts"   value={todayCount}    icon={<Calendar    className="h-5 w-5" />} />
        <MetricCard label="In Queue"      value={waitingQueue}  icon={<BarChart3   className="h-5 w-5" />} />
        <MetricCard label="Walk-Ins"      value={walkIns.length} icon={<UserCheck   className="h-5 w-5" />} />
        <MetricCard label="Available Drs" value={availableDocs} icon={<Stethoscope className="h-5 w-5" />} />
      </div>

      <div key={activeTab} className="animate-fade-rise">

        {/* REGISTRATION */}
        {activeTab === "registration" && (
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <form onSubmit={registerPatient}
              className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6 pb-10 shadow-[var(--shadow)]">
              <h2 className="text-2xl font-bold text-[var(--ink)]">Register Walk-In Patient</h2>
              <div className="mt-5 grid gap-4">
                <input
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--line)] p-3 text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-tint)]"
                  placeholder="Full Name *" value={regForm.full_name}
                  onChange={e => setRegForm({ ...regForm, full_name: e.target.value })} required />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    className="rounded-[var(--radius-sm)] border border-[var(--line)] p-3 text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-tint)]"
                    placeholder="Age" type="number" value={regForm.age}
                    onChange={e => setRegForm({ ...regForm, age: e.target.value })} />
                  <input
                    className="rounded-[var(--radius-sm)] border border-[var(--line)] p-3 text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-tint)]"
                    placeholder="Phone *" value={regForm.phone}
                    onChange={e => setRegForm({ ...regForm, phone: e.target.value })} required />
                </div>
                <input
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--line)] p-3 text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-tint)]"
                  placeholder="Email (optional)" type="email" value={regForm.email}
                  onChange={e => setRegForm({ ...regForm, email: e.target.value })} />
                <select
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--line)] p-3 text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-tint)]"
                  value={regForm.department}
                  onChange={e => setRegForm({ ...regForm, department: e.target.value })}>
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
                <textarea
                  className="min-h-24 w-full rounded-[var(--radius-sm)] border border-[var(--line)] p-3 text-[var(--ink)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-tint)]"
                  placeholder="Symptoms / Reason for visit" value={regForm.symptoms}
                  onChange={e => setRegForm({ ...regForm, symptoms: e.target.value })} />

                {/* Bug 18 fix: do not depend on var(--brand). Use explicit visible colors. */}
                <div className="sticky bottom-4 z-50 mt-3 rounded-2xl border border-teal-300 bg-teal-50 p-3 shadow-2xl">
                  <p className="mb-2 text-center text-xs font-black uppercase tracking-wide text-teal-900">
                    Primary Action
                  </p>
                  <button
                    type="submit"
                    disabled={registering}
                    className={visibleRegisterButtonCls}
                    style={{ backgroundColor: "#0f766e", color: "#ffffff" }}
                  >
                    {registering ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <UserPlus className="h-5 w-5" />
                    )}
                    {registering ? "Registering Patient…" : "Register Patient & Add to Queue"}
                  </button>
                </div>
              </div>
            </form>
            <Panel title="Recent Walk-Ins" subtitle="Added this session">
              {walkIns.length === 0
                ? <Empty text="No walk-ins registered this session." />
                : (
                  <div className="grid gap-3">
                    {walkIns.map(wi => (
                      <div key={wi.id}
                        className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--canvas)] p-4">
                        <div>
                          <p className="font-semibold text-[var(--ink)]">{wi.patient_name}</p>
                          <p className="text-sm text-[var(--ink-2)]">{wi.department} • {wi.reason}</p>
                        </div>
                        <StatusBadge status={wi.status} />
                      </div>
                    ))}
                  </div>
                )}
            </Panel>
          </div>
        )}

        {/* APPOINTMENTS */}
        {activeTab === "appointments" && (
          <Panel title="Today's Appointments" subtitle={`${appointments.length} scheduled for today`}>
            {appointments.length === 0
              ? <Empty text="No appointments scheduled for today." />
              : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-left text-sm text-white">
                        <th className="px-5 py-4">Patient</th>
                        <th className="px-5 py-4">Code</th>
                        <th className="px-5 py-4">Department</th>
                        <th className="px-5 py-4">Time</th>
                        <th className="px-5 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map(a => (
                        <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-5 py-4 font-black text-slate-900">{a.patient_name}</td>
                          <td className="px-5 py-4 font-bold text-teal-700">{a.appointment_code}</td>
                          <td className="px-5 py-4 text-slate-600">{a.department}</td>
                          <td className="px-5 py-4 text-slate-600">{a.preferred_time ?? "Any time"}</td>
                          <td className="px-5 py-4"><StatusBadge status={a.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </Panel>
        )}

        {/* PATIENTS */}
        {activeTab === "patients" && (
          <Panel title="Registered Patients" subtitle={`${patients.length} total`}>
            {patients.length === 0
              ? <Empty text="No patients registered yet." />
              : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-left text-sm text-white">
                        <th className="px-5 py-4">Name</th>
                        <th className="px-5 py-4">Code</th>
                        <th className="px-5 py-4">Phone</th>
                        <th className="px-5 py-4">Age</th>
                        <th className="px-5 py-4">Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map(p => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-5 py-4 font-bold text-slate-900">{p.full_name}</td>
                          <td className="px-5 py-4 font-bold text-teal-700">{p.patient_code}</td>
                          <td className="px-5 py-4 text-slate-600">{p.phone}</td>
                          <td className="px-5 py-4 text-slate-600">{p.age ?? "—"}</td>
                          <td className="px-5 py-4 text-slate-500 text-sm">{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </Panel>
        )}

        {/* WALK-INS */}
        {activeTab === "walkins" && (
          <Panel title="Walk-In Patients" subtitle={`${walkIns.length} in queue`}>
            {walkIns.length === 0
              ? <Empty text="No walk-ins yet. Register one from the Registration tab." />
              : (
                <div className="grid gap-4">
                  {walkIns.map(wi => (
                    <div key={wi.id} className="rounded-2xl border border-slate-200 p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-950">{wi.patient_name}</p>
                          <p className="text-sm font-bold text-slate-500">{wi.department} • {wi.phone}</p>
                          {wi.reason && <p className="mt-1 text-sm text-slate-600">{wi.reason}</p>}
                          <p className="mt-1 text-xs text-slate-400">Arrived: {new Date(wi.arrived_at).toLocaleTimeString()}</p>
                        </div>
                        <StatusBadge status={wi.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </Panel>
        )}

        {/* QUEUE */}
        {activeTab === "queue" && (
          <Panel title="Live Queue" subtitle="Manage patient queue order">
            {walkIns.length === 0
              ? <Empty text="Queue is empty. Register walk-ins from the Registration tab." />
              : (
                <div className="grid gap-3">
                  {walkIns.map((q, idx) => (
                    <div key={q.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 shadow-sm">
                      <div className="flex items-center gap-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 font-black text-white">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-black text-slate-950">{q.patient_name}</p>
                          <p className="text-sm font-bold text-slate-500">{q.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={q.status} />
                        {q.status === "WAITING" && (
                          <>
                            <button onClick={() => moveUp(q.id)} className="rounded-xl bg-slate-100 px-3 py-2 font-black text-slate-600 hover:bg-slate-200">↑</button>
                            <button onClick={() => moveDown(q.id)} className="rounded-xl bg-slate-100 px-3 py-2 font-black text-slate-600 hover:bg-slate-200">↓</button>
                            <button onClick={() => markSeen(q.id)} className="rounded-xl bg-emerald-600 px-3 py-2 font-black text-white hover:bg-emerald-500">Send</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </Panel>
        )}

        {/* DOCTOR AVAILABILITY */}
        {activeTab === "availability" && (
          <Panel title="Doctor Availability" subtitle="Toggle doctor availability status">
            {doctors.length === 0
              ? <Empty text="No doctors found." />
              : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {doctors.map(doc => (
                    <div key={doc.id}
                      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-black text-slate-950">{doc.full_name}</h3>
                          <p className="mt-1 font-bold text-teal-700">{doc.department_name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {doc.qualification ?? "—"} • {doc.experience_years}+ yrs • ₹{doc.consultation_fee}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleDoctor(doc.id)}
                          disabled={toggling === doc.id}
                          className={`rounded-2xl px-5 py-3 font-black text-white transition duration-200 disabled:opacity-50 ${
                            doc.is_available
                              ? "bg-red-600 hover:bg-red-500"
                              : "bg-emerald-600 hover:bg-emerald-500"
                          }`}>
                          {toggling === doc.id ? "…" : doc.is_available ? "Set Unavailable" : "Set Available"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </Panel>
        )}

      </div>
    </DashboardShell>
  );
}
