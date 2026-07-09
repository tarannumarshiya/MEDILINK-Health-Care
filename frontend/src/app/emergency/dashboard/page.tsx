"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Bed } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/apiFetch";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Stat } from "@/components/dashboard/Stat";
import { Panel } from "@/components/dashboard/Panel";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { SuccessBanner } from "@/components/dashboard/SuccessBanner";

type Bed = {
  id: string; ward: string; bed_no: string;
  is_occupied: boolean; patient_id: string | null; patient_name?: string;
};

type EmCase = {
  id: string; patient_name: string; age: number | null;
  department: string; description: string | null;
  severity: string; status: string; arrived_at: string;
  bed_id: string | null;
};

type Tab = "triage" | "beds";

const tabs = [
  { label: "Active Triage",  value: "triage" as Tab, icon: "🚑" },
  { label: "Bed Management", value: "beds"   as Tab, icon: "🛏️" },
];

const WARDS = ["ICU", "Emergency", "General", "Pediatric", "Cardiac"];
const SEVERITY_ORDER: Record<string, number> = { CRITICAL: 0, URGENT: 1, NORMAL: 2, LOW: 3 };
const DEPARTMENTS = ["Emergency / Trauma", "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "General Medicine"];
const EMPTY_FORM = { patient_name: "", age: "", gender: "", department: "Emergency / Trauma", description: "", severity: "NORMAL" };

export default function EmergencyDashboardPage() {
  const [activeTab,   setActiveTab]   = useState<Tab>("triage");
  const [loading,     setLoading]     = useState(true);
  const [busyId,      setBusyId]      = useState<string | null>(null);
  const [message,     setMessage]     = useState("");
  const [showForm,    setShowForm]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState("");
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [bedAssign,   setBedAssign]   = useState<Record<string, string>>({});

  const [beds,  setBeds]  = useState<Bed[]>([]);
  const [cases, setCases] = useState<EmCase[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: auth }) => {
      if (!auth.user) { window.location.href = "/emergency/login"; return; }
      const res = await apiFetch("/api/emergency/cases");
      const data = await res.json();
      if (data.success) {
        setBeds(data.beds ?? []);
        setCases(data.cases ?? []);
      }
      setLoading(false);
    });
  }, []);

  async function addCase(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const res = await apiFetch("/api/emergency/create", {
        method: "POST",
        body: JSON.stringify({
          patient_name: form.patient_name,
          age:          form.age ? Number(form.age) : null,
          gender:       form.gender || null,
          department:   form.department,
          description:  form.description || null,
          severity:     form.severity,
        }),
      });
      const result = await res.json();
      if (result.success && result.case) {
        setCases(prev => [...prev, result.case]);
        setMessage("Emergency case added.");
        setForm(EMPTY_FORM);
        setShowForm(false);
      } else {
        setFormError(result.error ?? "Failed to add case. Please try again.");
      }
    } catch {
      setFormError("Network error. Is the backend running?");
    }
    setSubmitting(false);
  }

  async function updateCaseStatus(id: string, status: string) {
    setBusyId(id);
    await apiFetch("/api/emergency/update-status", {
      method: "PATCH",
      body: JSON.stringify({ case_id: id, status }),
    });
    setCases(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    setBusyId(null);
    setMessage(`Case marked as ${status.replace("_", " ").toLowerCase()}.`);
  }

  async function assignBed(caseId: string) {
    const bedId = bedAssign[caseId];
    if (!bedId) return;
    setBusyId(caseId);
    const res = await apiFetch("/api/emergency/assign-bed", {
      method: "PATCH",
      body: JSON.stringify({ case_id: caseId, bed_id: bedId }),
    });
    const result = await res.json();
    if (result.success && result.case) {
      setCases(prev => prev.map(c => c.id === caseId ? { ...c, ...result.case } : c));
      setBeds(prev => prev.map(b => b.id === bedId ? { ...b, is_occupied: true, patient_name: result.case.patient_name } : b));
      const bed = beds.find(b => b.id === bedId);
      setMessage(`Bed ${bed?.bed_no} (${bed?.ward}) assigned to ${result.case.patient_name}.`);
      setBedAssign(prev => { const n = { ...prev }; delete n[caseId]; return n; });
    }
    setBusyId(null);
  }

  async function toggleBed(id: string) {
    const bed = beds.find(b => b.id === id);
    if (!bed) return;
    const next = !bed.is_occupied;
    setBeds(prev => prev.map(b =>
      b.id === id ? { ...b, is_occupied: next, patient_id: next ? "manual-entry" : null, patient_name: next ? "Occupied" : undefined } : b
    ));
    setBusyId(id);
    const supabase = createClient();
    const { error } = await supabase.from("beds").update({ is_occupied: next, patient_id: null }).eq("id", id);
    if (error) setBeds(prev => prev.map(b => b.id === id ? bed : b));
    setBusyId(null);
  }

  const criticalCases = cases.filter(c => c.severity === "CRITICAL").length;
  const urgentCases   = cases.filter(c => c.severity === "URGENT").length;
  const availableBeds = beds.filter(b => !b.is_occupied).length;

  // Beds not yet occupied — for assignment dropdown
  const freeBeds = beds.filter(b => !b.is_occupied);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
    </div>
  );

  return (
    <DashboardShell
      portalName="Emergency & Trauma"
      portalSubtitle="Critical Care Operations"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={t => setActiveTab(t as Tab)}
      liveSummary={[
        { label: "Critical Cases",  value: criticalCases },
        { label: "Urgent Cases",    value: urgentCases },
        { label: "Available Beds",  value: availableBeds },
      ]}
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat title="Critical Cases"  value={criticalCases} color="from-red-600 to-red-700" />
        <Stat title="Urgent Cases"    value={urgentCases}   color="from-orange-500 to-amber-600" />
        <Stat title="Available Beds"  value={availableBeds} color="from-emerald-500 to-green-600" />
      </div>

      <div key={activeTab} className="animate-fade-rise">

        {message && <SuccessBanner message={message} onDismiss={() => setMessage("")} />}

        {/* ── TRIAGE ── */}
        {activeTab === "triage" && (
          <div className="grid gap-6">
            <Panel
              title="Active Cases"
              subtitle={`${cases.length} active — sorted by severity`}
              action={
                <button onClick={() => setShowForm(v => !v)}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500">
                  <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Add Case"}
                </button>
              }
            >
              {showForm && (
                <form onSubmit={addCase} className="mb-6 grid gap-3 rounded-2xl border border-red-100 bg-red-50 p-5 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Patient Name</label>
                    <input required className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-red-500"
                      placeholder="Full name" value={form.patient_name} onChange={e => setForm(p => ({ ...p, patient_name: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500">Age</label>
                      <input type="number" className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-red-500"
                        placeholder="Age" value={form.age} onChange={e => setForm(p => ({ ...p, age: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500">Gender</label>
                      <select className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-red-500"
                        value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                        <option value="">—</option>
                        <option>MALE</option><option>FEMALE</option><option>OTHER</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Department</label>
                    <select required className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-red-500"
                      value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Severity</label>
                    <select required className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-red-500"
                      value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}>
                      <option>CRITICAL</option><option>URGENT</option><option>NORMAL</option><option>LOW</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Description</label>
                    <textarea className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-red-500 min-h-20"
                      placeholder="Chief complaint / presenting condition"
                      value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    {formError && (
                      <div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-bold text-red-600">
                        {formError}
                      </div>
                    )}
                    <button disabled={submitting} className="rounded-xl bg-red-600 px-6 py-3 font-black text-white hover:bg-red-500 disabled:opacity-50">
                      {submitting ? "Saving…" : "Register Emergency Case"}
                    </button>
                  </div>
                </form>
              )}

              {cases.length === 0
                ? <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-400">No active emergency cases.</p>
                : (
                  <div className="grid gap-4">
                    {[...cases]
                      .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9))
                      .map(c => {
                        const assignedBed = c.bed_id ? beds.find(b => b.id === c.bed_id) : null;
                        return (
                          <div key={c.id} className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                              <div>
                                <div className="flex items-center gap-3">
                                  <h3 className="text-xl font-black text-slate-950">{c.patient_name}</h3>
                                  {c.age && <span className="text-sm font-bold text-slate-500">{c.age} yrs</span>}
                                </div>
                                <p className="mt-1 font-bold text-slate-500">{c.department}</p>
                                <p className="text-xs text-slate-400">Arrived: {new Date(c.arrived_at).toLocaleTimeString()}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <StatusBadge status={c.severity} />
                                <StatusBadge status={c.status} />
                              </div>
                            </div>

                            {/* ── Assigned bed tag ── */}
                            {assignedBed ? (
                              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2">
                                <Bed className="h-4 w-4 text-emerald-600" />
                                <span className="text-sm font-black text-emerald-700">
                                  Bed {assignedBed.bed_no} — {assignedBed.ward} Ward
                                </span>
                              </div>
                            ) : (
                              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2">
                                <Bed className="h-4 w-4 text-amber-500" />
                                <span className="text-sm font-bold text-amber-600">No bed assigned yet</span>
                              </div>
                            )}

                            {c.description && <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{c.description}</p>}

                            {/* ── Actions row ── */}
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              {/* Status buttons */}
                              {c.status === "WAITING" && (
                                <button disabled={busyId === c.id} onClick={() => updateCaseStatus(c.id, "IN_TREATMENT")}
                                  className="rounded-2xl bg-blue-600 px-5 py-2 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-50">
                                  {busyId === c.id ? "…" : "Start Treatment"}
                                </button>
                              )}
                              {c.status === "IN_TREATMENT" && (
                                <button disabled={busyId === c.id} onClick={() => updateCaseStatus(c.id, "STABLE")}
                                  className="rounded-2xl bg-emerald-600 px-5 py-2 text-sm font-black text-white hover:bg-emerald-500 disabled:opacity-50">
                                  {busyId === c.id ? "…" : "Mark Stable"}
                                </button>
                              )}
                              {c.status === "STABLE" && (
                                <button disabled={busyId === c.id} onClick={() => updateCaseStatus(c.id, "DISCHARGED")}
                                  className="rounded-2xl bg-slate-600 px-5 py-2 text-sm font-black text-white hover:bg-slate-500 disabled:opacity-50">
                                  {busyId === c.id ? "…" : "Discharge"}
                                </button>
                              )}

                              {/* Assign bed — only if no bed yet */}
                              {!assignedBed && (
                                <div className="flex items-center gap-2 ml-auto">
                                  <select
                                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                                    value={bedAssign[c.id] ?? ""}
                                    onChange={e => setBedAssign(prev => ({ ...prev, [c.id]: e.target.value }))}
                                  >
                                    <option value="">Assign a bed</option>
                                    {WARDS.map(ward => {
                                      const wardFreeBeds = freeBeds.filter(b => b.ward === ward);
                                      if (wardFreeBeds.length === 0) return null;
                                      return (
                                        <optgroup key={ward} label={`── ${ward} Ward ──`}>
                                          {wardFreeBeds.map(b => (
                                            <option key={b.id} value={b.id}>{b.bed_no}</option>
                                          ))}
                                        </optgroup>
                                      );
                                    })}
                                  </select>
                                  <button
                                    disabled={!bedAssign[c.id] || busyId === c.id}
                                    onClick={() => assignBed(c.id)}
                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-500 disabled:opacity-40"
                                  >
                                    {busyId === c.id ? "…" : "Assign"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
            </Panel>
          </div>
        )}

        {/* ── BEDS ── */}
        {activeTab === "beds" && (
          <div className="grid gap-6">
            {WARDS.map(ward => {
              const wardBeds = beds.filter(b => b.ward === ward);
              if (wardBeds.length === 0) return null;
              const free = wardBeds.filter(b => !b.is_occupied).length;
              return (
                <Panel
                  key={ward}
                  title={`${ward} Ward`}
                  subtitle={`${free} of ${wardBeds.length} available`}
                >
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {wardBeds.map(bed => (
                      <button
                        key={bed.id}
                        disabled={busyId === bed.id}
                        onClick={() => toggleBed(bed.id)}
                        className={`rounded-2xl border-2 p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed ${
                          bed.is_occupied
                            ? "border-red-200 bg-red-50 hover:bg-red-100"
                            : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                        }`}
                      >
                        <p className="text-2xl">{busyId === bed.id ? "⏳" : "🛏️"}</p>
                        <p className={`mt-2 font-black ${bed.is_occupied ? "text-red-700" : "text-emerald-700"}`}>
                          {bed.bed_no}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {bed.is_occupied ? (bed.patient_name || "Occupied") : "Available"}
                        </p>
                      </button>
                    ))}
                  </div>
                </Panel>
              );
            })}
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
