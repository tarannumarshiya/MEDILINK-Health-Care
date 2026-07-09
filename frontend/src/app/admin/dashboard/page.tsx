"use client";

export const dynamic = "force-dynamic";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/apiFetch";
import { DashboardShell, type TabItem, SESSION_TIMEOUT_KEY, DEFAULT_TIMEOUT_MIN } from "@/components/dashboard/DashboardShell";
import { Panel } from "@/components/dashboard/Panel";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Info } from "@/components/dashboard/Info";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  BarChart3, Calendar, Users, Building2,
  Stethoscope, Mail, Loader2, RefreshCw, Settings, Clock, CheckCircle2,
} from "lucide-react";

/* ── types ── */
type Appointment = {
  id: string; appointment_code: string; patient_id: string | null;
  patient_name: string; patient_phone: string; patient_email: string | null;
  department: string; preferred_date: string; preferred_time: string | null;
  symptoms: string | null; status: string; doctor_id: string | null; created_at: string;
};
type Patient = {
  id: string; patient_code: string; full_name: string; age: number;
  phone: string; email: string | null; created_at: string;
};
type Department = {
  id: string; name: string; description: string | null; is_active: boolean; created_at: string;
};
type Doctor = {
  id: string; profile_id: string; department_id: string; qualification: string | null;
  experience_years: number; consultation_fee: number; is_available: boolean; created_at: string;
  profiles: { id: string; full_name: string | null; email: string } | { id: string; full_name: string | null; email: string }[] | null;
  departments: { id: string; name: string } | { id: string; name: string }[] | null;
};
type ContactMessage = {
  id: string; full_name: string; email: string; phone: string | null;
  subject: string; message: string; status: string; created_at: string;
};

type Tab = "overview" | "appointments" | "patients" | "departments" | "doctors" | "contact" | "settings";

const tabs: TabItem[] = [
  { label: "Overview",     value: "overview",     icon: <BarChart3    className="h-[18px] w-[18px]" /> },
  { label: "Appointments", value: "appointments", icon: <Calendar     className="h-[18px] w-[18px]" /> },
  { label: "Patients",     value: "patients",     icon: <Users        className="h-[18px] w-[18px]" /> },
  { label: "Departments",  value: "departments",  icon: <Building2    className="h-[18px] w-[18px]" /> },
  { label: "Doctors",      value: "doctors",      icon: <Stethoscope  className="h-[18px] w-[18px]" /> },
  { label: "Contact",      value: "contact",      icon: <Mail         className="h-[18px] w-[18px]" /> },
  { label: "Settings",     value: "settings",     icon: <Settings     className="h-[18px] w-[18px]" /> },
];

const p = (v: Doctor["profiles"]) => Array.isArray(v) ? v[0] : v;
const d = (v: Doctor["departments"]) => Array.isArray(v) ? v[0] : v;

export default function AdminDashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading]     = useState(true);
  const [actionId, setActionId]   = useState<string | null>(null);
  const [msg, setMsg]             = useState("");
  const [patientSearch, setPatientSearch] = useState("");

  const [appointments,   setAppointments]   = useState<Appointment[]>([]);
  const [patients,       setPatients]       = useState<Patient[]>([]);
  const [departments,    setDepartments]    = useState<Department[]>([]);
  const [doctors,        setDoctors]        = useState<Doctor[]>([]);
  const [contacts,       setContacts]       = useState<ContactMessage[]>([]);

  const [deptForm,   setDeptForm]   = useState({ name: "", description: "" });
  const [doctorForm, setDoctorForm] = useState({
    email: "", department_id: "", qualification: "", experience_years: "", consultation_fee: "",
  });

  /* ── session-timeout setting ── */
  const [timeoutMin,    setTimeoutMin]    = useState<number>(DEFAULT_TIMEOUT_MIN);
  const [savedTimeout,  setSavedTimeout]  = useState<number | null>(null); // shows confirmation

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_TIMEOUT_KEY);
      if (raw) setTimeoutMin(parseFloat(raw));
    } catch { /* ignore */ }
  }, []);

  function saveTimeout() {
    const clamped = Math.max(0.5, Math.min(60, timeoutMin));
    setTimeoutMin(clamped);
    localStorage.setItem(SESSION_TIMEOUT_KEY, String(clamped));
    setSavedTimeout(clamped);
    setTimeout(() => setSavedTimeout(null), 3000);
  }

  async function load(showLoader = false) {
    if (showLoader) setLoading(true);
    setMsg("");
    const [apptRes, patRes, deptRes, docRes, contactRes] = await Promise.all([
      supabase.from("appointments")
        .select("id,appointment_code,patient_id,patient_name,patient_phone,patient_email,department,preferred_date,preferred_time,symptoms,status,doctor_id,created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("patients")
        .select("id,patient_code,full_name,age,phone,email,created_at")
        .order("created_at", { ascending: false }),
      apiFetch("/api/admin/departments").then(r => r.json()),
      apiFetch("/api/admin/doctors").then(r => r.json()),
      apiFetch("/api/admin/contact-messages").then(r => r.json()),
    ]);
    if (!apptRes.error)    { setAppointments(apptRes.data ?? []); const initial: Record<string,string> = {}; (apptRes.data ?? []).forEach((a: Appointment) => { if (a.doctor_id) initial[a.id] = a.doctor_id; }); setAssignMap(prev => ({ ...initial, ...prev })); }
    if (!patRes.error)     setPatients(patRes.data ?? []);
    if (!deptRes.error)    setDepartments(deptRes.departments ?? []);
    if (!docRes.error)     setDoctors(docRes.doctors ?? []);
    if (!contactRes.error) setContacts(contactRes.messages ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.replace("/admin/login"); return; }
      const { data: profile } = await supabase
        .from("profiles").select("role, is_active").eq("id", data.user.id).single();
      const allowed = ["HOSPITAL_ADMIN", "ADMIN", "DEPARTMENT_ADMIN", "SUPER_ADMIN"];
      if (!profile || !allowed.includes(profile.role) || !profile.is_active) {
        window.location.replace("/login");
        return;
      }
      load(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [assignMap, setAssignMap] = useState<Record<string, string>>({});

  async function updateAppt(id: string, status: "APPROVED" | "REJECTED") {
    setActionId(id);
    const doctor_id = assignMap[id] || null;
    const endpoint = status === "APPROVED" ? "/api/admin/appointments/approve" : "/api/admin/appointments/reject";
    const res = await apiFetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: id, doctor_id }),
    });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error); setActionId(null); return; }
    await load(false);
    setMsg(`Appointment ${status.toLowerCase()} successfully.`);
    setActionId(null);
  }

  async function createDept(e: React.FormEvent) {
    e.preventDefault();
    const res = await apiFetch("/api/admin/departments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deptForm),
    });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error); return; }
    setDeptForm({ name: "", description: "" });
    await load(false);
    setMsg("Department created.");
  }

  async function toggleDept(dept: Department) {
    const res = await apiFetch("/api/admin/departments", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: dept.id, is_active: !dept.is_active }),
    });
    if (res.ok) await load(false);
  }

  async function createDoctor(e: React.FormEvent) {
    e.preventDefault();
    const res = await apiFetch("/api/admin/doctors", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doctorForm),
    });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error); return; }
    setDoctorForm({ email: "", department_id: "", qualification: "", experience_years: "", consultation_fee: "" });
    await load(false);
    setMsg("Doctor added successfully.");
  }

  async function toggleDoctor(doc: Doctor) {
    const res = await apiFetch("/api/admin/doctors", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: doc.id, is_available: !doc.is_available }),
    });
    if (res.ok) await load(false);
  }

  async function updateContact(id: string, status: "NEW" | "READ" | "RESOLVED") {
    const res = await apiFetch("/api/admin/contact-messages", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error); return; }
    await load(false);
    setMsg(`Message marked as ${status}.`);
  }

  /* derived */
  const pendingCount   = appointments.filter(a => a.status === "PENDING").length;
  const approvedCount  = appointments.filter(a => a.status === "APPROVED").length;
  const rejectedCount  = appointments.filter(a => a.status === "REJECTED").length;
  const availDoctors   = doctors.filter(d => d.is_available).length;
  const activeDepts    = departments.filter(d => d.is_active).length;
  const newMsgs        = contacts.filter(m => m.status === "NEW").length;
  const filteredPats   = patients.filter(p => {
    const q = patientSearch.toLowerCase();
    return !q || p.full_name.toLowerCase().includes(q) || p.patient_code.toLowerCase().includes(q)
      || p.phone.includes(q) || (p.email ?? "").toLowerCase().includes(q);
  });

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
    </div>
  );

  return (
    <DashboardShell
      portalName="Admin"
      portalSubtitle="Hospital Operations Center"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={t => setActiveTab(t as Tab)}
      liveSummary={[
        { label: "Pending",    value: pendingCount },
        { label: "Approved",   value: approvedCount },
        { label: "Doctors",    value: availDoctors },
        { label: "New Msgs",   value: newMsgs },
      ]}
    >
      {/* banner */}
      {msg && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-teal-200 bg-teal-50 px-5 py-3 text-sm font-bold text-teal-800">
          {msg}
          <button onClick={() => setMsg("")} className="ml-4 text-teal-400 hover:text-teal-600">✕</button>
        </div>
      )}

      {/* ── OVERVIEW ── */}
      {activeTab === "overview" && (
        <div className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {[
              { label: "Patients",    value: patients.length,  icon: <Users       className="h-5 w-5" /> },
              { label: "Pending",     value: pendingCount,     icon: <Calendar    className="h-5 w-5" /> },
              { label: "Approved",    value: approvedCount,    icon: <Calendar    className="h-5 w-5" /> },
              { label: "Rejected",    value: rejectedCount,    icon: <Calendar    className="h-5 w-5" /> },
              { label: "Doctors",     value: availDoctors,     icon: <Stethoscope className="h-5 w-5" /> },
              { label: "New Msgs",    value: newMsgs,          icon: <Mail        className="h-5 w-5" /> },
            ].map(s => (
              <MetricCard key={s.label} label={s.label} value={s.value} icon={s.icon} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Recent Appointments" subtitle="Latest 5 requests">
              <div className="grid gap-3">
                {appointments.slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-bold text-slate-900">{a.patient_name}</p>
                      <p className="text-xs text-slate-500">{a.department} • {a.preferred_date}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
                {appointments.length === 0 && <p className="text-sm text-slate-400">No appointments yet.</p>}
              </div>
            </Panel>

            <Panel title="Recent Contact Messages" subtitle="Latest 5 inquiries">
              <div className="grid gap-3">
                {contacts.slice(0, 5).map(m => (
                  <div key={m.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="font-bold text-slate-900">{m.subject}</p>
                      <p className="text-xs text-slate-500">{m.full_name} • {m.email}</p>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                ))}
                {contacts.length === 0 && <p className="text-sm text-slate-400">No messages yet.</p>}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ── APPOINTMENTS ── */}
      {activeTab === "appointments" && (
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500">{appointments.length} total appointments</p>
            <button onClick={() => load(true)} className="flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:border-teal-400 hover:text-teal-700">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
          {appointments.map(a => (
            <div key={a.id} className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--ink)]">{a.patient_name}</h3>
                  <p className="text-sm text-[var(--muted)]">{a.appointment_code} • {a.patient_phone}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <Info label="Department" value={a.department} />
                <Info label="Date" value={a.preferred_date} />
                <Info label="Time" value={a.preferred_time ?? "Any time"} />
                <Info label="Created" value={new Date(a.created_at).toLocaleDateString()} />
              </div>
              {a.symptoms && (
                <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <span className="font-bold text-slate-500">Symptoms: </span>{a.symptoms}
                </p>
              )}
              {a.status === "PENDING" && (() => {
                const deptDoctors = doctors.filter(doc => {
                  const dept = d(doc.departments);
                  return dept?.name?.toLowerCase() === a.department.toLowerCase();
                });
                const otherDoctors = doctors.filter(doc => {
                  const dept = d(doc.departments);
                  return dept?.name?.toLowerCase() !== a.department.toLowerCase();
                });
                return (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <select
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
                      value={assignMap[a.id] ?? ""}
                      onChange={e => setAssignMap(prev => ({ ...prev, [a.id]: e.target.value }))}
                    >
                      <option value="">Assign Doctor (optional)</option>
                      {deptDoctors.length > 0 && (
                        <optgroup label={`── ${a.department} ──`}>
                          {deptDoctors.map(doc => {
                            const prof = p(doc.profiles);
                            return <option key={doc.id} value={doc.id}>{prof?.full_name ?? prof?.email ?? "Doctor"}</option>;
                          })}
                        </optgroup>
                      )}
                      {otherDoctors.length > 0 && (
                        <optgroup label="── Other Departments ──">
                          {otherDoctors.map(doc => {
                            const prof = p(doc.profiles);
                            const dept = d(doc.departments);
                            return <option key={doc.id} value={doc.id}>{prof?.full_name ?? prof?.email ?? "Doctor"} ({dept?.name ?? "—"})</option>;
                          })}
                        </optgroup>
                      )}
                    </select>
                    <button onClick={() => updateAppt(a.id, "APPROVED")} disabled={actionId === a.id}
                      className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-black text-white hover:bg-emerald-500 disabled:opacity-60">
                      {actionId === a.id ? "…" : "Approve"}
                    </button>
                    <button onClick={() => updateAppt(a.id, "REJECTED")} disabled={actionId === a.id}
                      className="rounded-xl bg-red-600 px-5 py-2 text-sm font-black text-white hover:bg-red-500 disabled:opacity-60">
                      Reject
                    </button>
                  </div>
                );
              })()}
            </div>
          ))}
          {appointments.length === 0 && (
            <Panel title="No Appointments" subtitle="Nothing to show yet"><p className="text-sm text-slate-400">Appointments will appear here once patients book.</p></Panel>
          )}
        </div>
      )}

      {/* ── PATIENTS ── */}
      {activeTab === "patients" && (
        <Panel title="Registered Patients" subtitle={`${patients.length} total patients`}>
          <input
            className="mb-4 h-10 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none focus:border-teal-500 lg:w-96"
            placeholder="Search name, code, phone or email..."
            value={patientSearch}
            onChange={e => setPatientSearch(e.target.value)}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950 text-left text-white">
                  {["Patient", "Patient ID", "Age", "Phone", "Email", "Registered"].map(h => (
                    <th key={h} className="px-4 py-3 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPats.map(pt => (
                  <tr key={pt.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{pt.full_name}</td>
                    <td className="px-4 py-3 font-bold text-teal-700">{pt.patient_code}</td>
                    <td className="px-4 py-3 text-slate-600">{pt.age}</td>
                    <td className="px-4 py-3 text-slate-600">{pt.phone}</td>
                    <td className="px-4 py-3 text-slate-500">{pt.email ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(pt.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {filteredPats.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No patients found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* ── DEPARTMENTS ── */}
      {activeTab === "departments" && (
        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <Panel title="Add Department" subtitle="Create a new hospital department">
            <form onSubmit={createDept} className="grid gap-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Name</label>
                <input required className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-500"
                  placeholder="e.g. Cardiology" value={deptForm.name}
                  onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Description</label>
                <textarea className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-500 min-h-20"
                  placeholder="Optional description" value={deptForm.description}
                  onChange={e => setDeptForm({ ...deptForm, description: e.target.value })} />
              </div>
              <button className="rounded-2xl bg-slate-950 p-3 font-black text-white hover:bg-slate-800">Create Department</button>
            </form>
          </Panel>

          <Panel title="All Departments" subtitle={`${departments.length} departments`}>
            <div className="grid gap-3">
              {departments.map(dept => (
                <div key={dept.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
                  <div>
                    <p className="font-bold text-slate-900">{dept.name}</p>
                    <p className="text-xs text-slate-500">{dept.description ?? "No description"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={dept.is_active ? "ACTIVE" : "INACTIVE"} />
                    <button onClick={() => toggleDept(dept)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-black text-white ${dept.is_active ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"}`}>
                      {dept.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
              {departments.length === 0 && <p className="text-sm text-slate-400">No departments yet.</p>}
            </div>
          </Panel>
        </div>
      )}

      {/* ── DOCTORS ── */}
      {activeTab === "doctors" && (
        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <Panel title="Add Doctor" subtitle="Assign a staff profile as doctor">
            <form onSubmit={createDoctor} className="grid gap-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Doctor Login Email</label>
                <input
                  required
                  type="email"
                  className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-500"
                  placeholder="doctor@hospital.com"
                  value={doctorForm.email}
                  onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })}
                />
                <p className="mt-1 text-xs text-slate-400">Must match a staff account with DOCTOR role in User Mgmt</p>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Department</label>
                <select required className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-500"
                  value={doctorForm.department_id}
                  onChange={e => setDoctorForm({ ...doctorForm, department_id: e.target.value })}>
                  <option value="">Select Department</option>
                  {departments.filter(d => d.is_active).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              {[
                { label: "Qualification", field: "qualification", placeholder: "e.g. MBBS, MD", type: "text" },
                { label: "Experience (Years)", field: "experience_years", placeholder: "e.g. 5", type: "number" },
                { label: "Consultation Fee (BDT)", field: "consultation_fee", placeholder: "e.g. 500", type: "number" },
              ].map(({ label, field, placeholder, type }) => (
                <div key={field}>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</label>
                  <input type={type} className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-500"
                    placeholder={placeholder} value={doctorForm[field as keyof typeof doctorForm]}
                    onChange={e => setDoctorForm({ ...doctorForm, [field]: e.target.value })} />
                </div>
              ))}
              <button className="rounded-2xl bg-slate-950 p-3 font-black text-white hover:bg-slate-800">Add Doctor</button>
            </form>
          </Panel>

          <Panel title="All Doctors" subtitle={`${doctors.length} registered doctors`}>
            <div className="grid gap-3">
              {doctors.map(doc => {
                const prof = p(doc.profiles);
                const dept = d(doc.departments);
                return (
                  <div key={doc.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
                    <div>
                      <p className="font-bold text-slate-900">{prof?.full_name ?? prof?.email ?? "Doctor"}</p>
                      <p className="text-xs text-teal-700">{dept?.name ?? "No dept"}</p>
                      <p className="text-xs text-slate-500">
                        {doc.qualification ?? "—"} • {doc.experience_years ?? 0} yrs • ৳{doc.consultation_fee ?? 0}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={doc.is_available ? "ACTIVE" : "INACTIVE"} />
                      <button onClick={() => toggleDoctor(doc)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-black text-white ${doc.is_available ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"}`}>
                        {doc.is_available ? "Unavailable" : "Available"}
                      </button>
                    </div>
                  </div>
                );
              })}
              {doctors.length === 0 && <p className="text-sm text-slate-400">No doctors added yet.</p>}
            </div>
          </Panel>
        </div>
      )}

      {/* ── CONTACT ── */}
      {activeTab === "contact" && (
        <Panel title="Contact Messages" subtitle={`${contacts.length} messages — ${newMsgs} new`}>
          <div className="grid gap-4">
            {contacts.map(m => (
              <div key={m.id} className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="font-semibold text-[var(--ink)]">{m.subject}</h3>
                    <p className="text-sm text-[var(--muted)]">{m.full_name} • {m.email}{m.phone ? ` • ${m.phone}` : ""}</p>
                    <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{m.message}</p>
                    <p className="mt-2 text-xs text-slate-400">{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(["READ", "RESOLVED", "NEW"] as const).map(s => (
                    <button key={s} onClick={() => updateContact(m.id, s)}
                      className={`rounded-xl px-4 py-2 text-xs font-black text-white transition ${
                        s === "RESOLVED" ? "bg-emerald-600 hover:bg-emerald-500" :
                        s === "READ"     ? "bg-blue-600 hover:bg-blue-500" :
                                           "bg-yellow-500 hover:bg-yellow-400"}`}>
                      Mark {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {contacts.length === 0 && <p className="text-sm text-slate-400">No contact messages yet.</p>}
          </div>
        </Panel>
      )}

      {/* ── SETTINGS ── */}
      {activeTab === "settings" && (
        <div className="grid gap-6 xl:grid-cols-[480px_1fr]">

          {/* ─ Session Timeout Card ─ */}
          <Panel title="Session Timeout" subtitle="Auto-logout all staff portals after inactivity">
            <div className="grid gap-6">

              {/* live preview badge */}
              <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-orange-500">Current Timeout</p>
                  <p className="text-2xl font-black text-slate-900 tabular-nums">
                    {timeoutMin < 1
                      ? `${Math.round(timeoutMin * 60)} sec`
                      : timeoutMin === 1
                      ? "1 min"
                      : `${timeoutMin} min`}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Warning shown {Math.round(Math.min(30, timeoutMin * 30))} s before logout</p>
                </div>
              </div>

              {/* slider */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Timeout (minutes)
                </label>
                <div className="mt-3 flex items-center gap-4">
                  <input
                    id="timeout-slider"
                    type="range"
                    min="0.5"
                    max="60"
                    step="0.5"
                    value={timeoutMin}
                    onChange={e => setTimeoutMin(parseFloat(e.target.value))}
                    className="flex-1 accent-teal-600"
                  />
                  <input
                    id="timeout-number"
                    type="number"
                    min="0.5"
                    max="60"
                    step="0.5"
                    value={timeoutMin}
                    onChange={e => setTimeoutMin(parseFloat(e.target.value) || DEFAULT_TIMEOUT_MIN)}
                    className="w-20 rounded-xl border border-slate-300 px-3 py-2 text-center text-sm font-black outline-none focus:border-teal-500"
                  />
                  <span className="text-sm text-slate-500 font-semibold">min</span>
                </div>
              </div>

              {/* quick presets */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Quick Presets</p>
                <div className="flex flex-wrap gap-2">
                  {[0.5, 1, 2, 5, 10, 15, 30].map(v => (
                    <button
                      key={v}
                      onClick={() => setTimeoutMin(v)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${
                        timeoutMin === v
                          ? "bg-teal-600 text-white shadow-sm"
                          : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-400 hover:text-teal-700"
                      }`}
                    >
                      {v < 1 ? `${v * 60}s` : `${v}m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* save button + confirmation */}
              <div className="flex items-center gap-3">
                <button
                  onClick={saveTimeout}
                  className="rounded-2xl bg-slate-950 px-6 py-3 font-black text-white hover:bg-slate-800 transition"
                >
                  Save Setting
                </button>
                {savedTimeout !== null && (
                  <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 animate-fade-rise">
                    <CheckCircle2 className="h-4 w-4" />
                    Saved! Staff will be logged out after {savedTimeout} min of inactivity.
                  </span>
                )}
              </div>

              <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500 leading-5">
                <strong className="text-slate-700">Note:</strong> This setting is stored in the browser and applies
                to all staff sessions on this device. The new timeout takes effect from the next idle cycle
                — no page refresh needed.
              </p>
            </div>
          </Panel>

          {/* ─ Info panel ─ */}
          <Panel title="How It Works" subtitle="Session security details">
            <div className="grid gap-4">
              {[
                {
                  icon: "🖱️",
                  title: "Activity Detection",
                  desc: "Any mouse move, click, keypress, scroll, or touch resets the idle timer.",
                },
                {
                  icon: "⏳",
                  title: "Warning Modal",
                  desc: "A countdown modal appears 30 seconds before logout, giving staff a chance to stay signed in.",
                },
                {
                  icon: "🔒",
                  title: "Auto Sign-Out",
                  desc: "After the timeout, the staff member is signed out of Supabase and redirected to their portal login.",
                },
                {
                  icon: "🌐",
                  title: "All Portals Covered",
                  desc: "Admin, Doctor, Reception, Lab, Pharmacy, Billing, Insurance, and Telemedicine portals all share this setting.",
                },
              ].map(item => (
                <div key={item.title} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-black text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

        </div>
      )}
    </DashboardShell>
  );
}
