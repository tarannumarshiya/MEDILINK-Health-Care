"use client";

import { useEffect, useState } from "react";
import { ClipboardList, CheckCircle, FileText, Search, MapPin, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/apiFetch";
import { DashboardShell, type TabItem } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Panel } from "@/components/dashboard/Panel";
import { Info } from "@/components/dashboard/Info";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { SuccessBanner } from "@/components/dashboard/SuccessBanner";

type Claim = {
  id: string; 
  patient_id: string | null; 
  policy_id: string | null; 
  appointment_id: string | null;
  amount: number; 
  status: string; 
  decision_reason: string | null; 
  settled_amount: number | null;
  created_at: string; 
  patient_name?: string; 
  policy_no?: string;
};

type Policy = {
  id: string; 
  patient_id: string | null; 
  policy_no: string; 
  provider: string;
  coverage_amount: number; 
  valid_until: string; 
  patient_name?: string;
};

type Tab = "claims" | "approvals" | "policies" | "coverage" | "tracking";

const tabs: TabItem[] = [
  { label: "Claims",     value: "claims",    icon: <ClipboardList className="h-[18px] w-[18px]" /> },
  { label: "Approvals", value: "approvals",  icon: <CheckCircle   className="h-[18px] w-[18px]" /> },
  { label: "Policies",  value: "policies",   icon: <FileText      className="h-[18px] w-[18px]" /> },
  { label: "Coverage",  value: "coverage",   icon: <Search        className="h-[18px] w-[18px]" /> },
  { label: "Tracking",  value: "tracking",   icon: <MapPin        className="h-[18px] w-[18px]" /> },
];

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-400">{text}</p>;
}

export default function InsuranceDashboardPage() {
  const [activeTab, setActiveTab]     = useState<Tab>("claims");
  const [loading, setLoading]         = useState(true);
  const [message, setMessage]         = useState("");
  const [flashId, setFlashId]         = useState<string | null>(null);
  const [busyId,  setBusyId]          = useState<string | null>(null);

  const [claims,  setClaims]  = useState<Claim[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);

  /* per-claim decision inputs */
  const [decisions, setDecisions] = useState<Record<string, { reason: string; settled_amount: string }>>({});

  /* coverage check */
  const [coverageQuery,  setCoverageQuery]  = useState("");
  const [coverageResult, setCoverageResult] = useState<Policy | null>(null);
  const [coverageMsg,    setCoverageMsg]    = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: auth }) => {
      if (!auth.user) { window.location.href = "/insurance/login"; return; }

      const res = await apiFetch("/api/insurance/claims");
      const data = await res.json();
      if (data.success) {
        setClaims(data.claims ?? []);
        setPolicies(data.policies ?? []);
      }
      setLoading(false);
    });
  }, []);

  function flash(id: string, msg: string) {
    setFlashId(id);
    setMessage(msg);
    setTimeout(() => setFlashId(null), 800);
  }

  function decisionFor(id: string) {
    return decisions[id] ?? { reason: "", settled_amount: "" };
  }

  function setDecision(id: string, patch: Partial<{ reason: string; settled_amount: string }>) {
    setDecisions(prev => ({ ...prev, [id]: { ...decisionFor(id), ...patch } }));
  }

  async function approveClaim(claimId: string) {
    setBusyId(claimId);
    const d = decisionFor(claimId);
    const res = await apiFetch("/api/insurance/approve", {
      method: "PATCH",
      body: JSON.stringify({ claim_id: claimId, settled_amount: d.settled_amount, decision_reason: d.reason }),
    });
    const data = await res.json();
    if (data.success) {
      setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: "APPROVED", settled_amount: Number(d.settled_amount), decision_reason: d.reason } : c));
      setMessage("Claim approved.");
      flash(claimId, "Claim approved.");
    } else {
      setMessage(data.error ?? "Approval failed.");
    }
    setBusyId(null);
  }

  async function rejectClaim(id: string) {
    const { reason } = decisionFor(id);
    if (!reason.trim()) { setMessage("Enter a rejection reason."); return; }
    setBusyId(id);
    const res = await apiFetch("/api/insurance/reject", {
      method: "PATCH",
      body: JSON.stringify({ claim_id: id, decision_reason: reason }),
    });
    const data = await res.json();
    if (!data.success) { setMessage(data.error ?? "Reject failed."); setBusyId(null); return; }
    setClaims(prev => prev.map(c => c.id === id
      ? { ...c, status: "REJECTED", decision_reason: reason, settled_amount: null }
      : c));
    setDecisions(prev => { const n = { ...prev }; delete n[id]; return n; });
    setBusyId(null);
    flash(id, "Claim rejected.");
  }

  async function checkCoverage(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { data } = await supabase
      .from("insurance_policies")
      .select("*")
      .eq("policy_no", coverageQuery.trim())
      .maybeSingle();
    if (data) { setCoverageResult(data); setCoverageMsg(""); }
    else { setCoverageResult(null); setCoverageMsg("Policy not found."); }
  }

  const pendingClaims   = claims.filter(c => c.status === "pending"  || c.status === "PENDING").length;
  const approvedClaims  = claims.filter(c => ["approved","settled","APPROVED","SETTLED"].includes(c.status)).length;
  const totalSettled    = claims.reduce((s, c) => s + (c.settled_amount ?? 0), 0);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
    </div>
  );

  return (
    <DashboardShell
      portalName="Insurance Portal"
      portalSubtitle="Claims & Coverage Management"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={t => setActiveTab(t as Tab)}
      liveSummary={[
        { label: "Pending Claims", value: pendingClaims },
        { label: "Approved",       value: approvedClaims },
        { label: "Total Settled",  value: `₹${totalSettled.toLocaleString()}` },
        { label: "Policies",       value: policies.length },
      ]}
    >
      {message && <SuccessBanner message={message} onDismiss={() => setMessage("")} />}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending"      value={pendingClaims}  icon={<ClipboardList className="h-5 w-5" />} />
        <MetricCard label="Approved"     value={approvedClaims} icon={<CheckCircle   className="h-5 w-5" />} />
        <MetricCard label="Total Claims" value={claims.length}  icon={<FileText      className="h-5 w-5" />} />
        <MetricCard label="Policies"     value={policies.length} icon={<Search       className="h-5 w-5" />} />
      </div>

      <div key={activeTab} className="animate-fade-rise">

        {/* ── CLAIMS ── */}
        {activeTab === "claims" && (
          <Panel title="Claims Queue" subtitle={`${claims.length} total`}>
            <div className="grid gap-4">
              {claims.map(claim => {
                const matchedPolicy = policies.find(p => p.id === claim.policy_id);
                const patientName = claim.patient_name || matchedPolicy?.patient_name || "—";
                const policyNo    = claim.policy_no    || matchedPolicy?.policy_no    || "—";
                const provider    = matchedPolicy?.provider ?? null;
                return (
                  <div key={claim.id}
                    className={`rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] transition-colors duration-300 ${flashId === claim.id ? "bg-teal-50" : ""}`}>
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <h3 className="text-xl font-black text-slate-950">{patientName}</h3>
                        <p className="text-sm font-bold text-slate-500">
                          Policy: <span className="font-black text-teal-700">{policyNo}</span>
                          {provider && <span className="ml-2 text-slate-400">• {provider}</span>}
                          <span className="ml-2">• Amount: ₹{claim.amount.toLocaleString()}</span>
                        </p>
                        <p className="text-xs text-slate-400">{new Date(claim.created_at).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={claim.status} />
                    </div>
                    {claim.decision_reason && (
                      <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{claim.decision_reason}</p>
                    )}
                    {claim.settled_amount != null && (
                      <p className="mt-2 text-sm font-black text-emerald-700">Settled: ₹{claim.settled_amount.toLocaleString()}</p>
                    )}
                  </div>
                );
              })}
              {claims.length === 0 && <Empty text="No claims found." />}
            </div>
          </Panel>
        )}

        {/* ── APPROVALS (FIXED FOR BUG 17) ── */}
        {activeTab === "approvals" && (
          <Panel title="Approve / Reject Claims" subtitle="Process pending claims with complete evaluation visibility">
            <div className="grid gap-5">
              {claims.filter(c => c.status === "pending" || c.status === "PENDING").length === 0 ? (
                <div className="rounded-2xl bg-emerald-50 p-10 text-center font-bold text-emerald-700">
                  No pending claims ✓
                </div>
              ) : (
                claims
                  .filter(c => c.status === "pending" || c.status === "PENDING")
                  .map(claim => {
                    const d = decisionFor(claim.id);
                    const matchedPolicy = policies.find(p => p.id === claim.policy_id);
                    const patientName = claim.patient_name || matchedPolicy?.patient_name || "—";
                    const policyNo    = claim.policy_no    || matchedPolicy?.policy_no    || "—";
                    const provider    = matchedPolicy?.provider || "—";
                    const patientId   = claim.patient_id || matchedPolicy?.patient_id || "N/A";
                    const appointmentId = claim.appointment_id || "N/A";

                    return (
                      <div key={claim.id}
                        className={`rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] transition-colors duration-300 ${flashId === claim.id ? "bg-teal-50" : ""}`}>
                        
                        {/* Summary Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                          <div>
                            <h3 className="text-xl font-black text-slate-950">{patientName}</h3>
                            <p className="text-sm font-bold text-slate-500">
                              Requested Claim Amount: <span className="text-slate-900 font-extrabold">₹{claim.amount.toLocaleString()}</span>
                            </p>
                          </div>
                          <StatusBadge status="PENDING" />
                        </div>

                        {/* Bug 17 Fix: Complete Patient, Policy, and Claim Detail Grid Block */}
                        <div className="mt-4 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3 border border-slate-200">
                          <Info label="Patient Name" value={patientName} />
                          <Info label="Patient ID" value={patientId} />
                          <Info label="Policy Number" value={policyNo} />
                          <Info label="Claim Reference ID" value={claim.id} />
                          <Info label="Insurance Provider" value={provider} />
                          <Info label="Appointment Reference ID" value={appointmentId} />
                          <div className="sm:col-span-2 lg:col-span-3">
                            <Info label="Submission Date" value={new Date(claim.created_at).toLocaleString()} />
                          </div>
                        </div>

                        {/* Action Decision Form Fields */}
                        <div className="mt-5 grid gap-3">
                          <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Decision Reason</label>
                            <input
                              className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-500"
                              placeholder="e.g. Covered under outpatient benefit"
                              value={d.reason}
                              onChange={e => setDecision(claim.id, { reason: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Settlement Amount (₹)</label>
                            <input
                              type="number"
                              min="0"
                              className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-500"
                              placeholder="Leave blank when rejecting"
                              value={d.settled_amount}
                              onChange={e => {
                                const val = e.target.value;
                                if (val === "" || Number(val) >= 0) setDecision(claim.id, { settled_amount: val });
                              }}
                            />
                          </div>
                          <div className="flex gap-3 pt-2">
                            <button
                              disabled={busyId === claim.id}
                              onClick={() => approveClaim(claim.id)}
                              className="rounded-2xl bg-emerald-600 px-6 py-3 font-black text-white hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50">
                              {busyId === claim.id ? "Saving…" : "Approve & Settle"}
                            </button>
                            <button
                              disabled={busyId === claim.id}
                              onClick={() => rejectClaim(claim.id)}
                              className="rounded-2xl bg-red-600 px-6 py-3 font-black text-white hover:bg-red-500 active:scale-[0.98] disabled:opacity-50">
                              {busyId === claim.id ? "Saving…" : "Reject Claim"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </Panel>
        )}

        {/* ── POLICIES ── */}
        {activeTab === "policies" && (
          <Panel title="Insurance Policies" subtitle={`${policies.length} active records`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-left text-sm text-white">
                    <th className="px-5 py-4">Patient</th>
                    <th className="px-5 py-4">Policy No.</th>
                    <th className="px-5 py-4">Provider</th>
                    <th className="px-5 py-4">Coverage (₹)</th>
                    <th className="px-5 py-4">Valid Until</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map(pol => (
                    <tr key={pol.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-4 font-black text-slate-900">{pol.patient_name ?? "—"}</td>
                      <td className="px-5 py-4 font-bold text-teal-700">{pol.policy_no}</td>
                      <td className="px-5 py-4 text-slate-600">{pol.provider}</td>
                      <td className="px-5 py-4 font-bold text-slate-900">₹{pol.coverage_amount.toLocaleString()}</td>
                      <td className="px-5 py-4 text-slate-600">{pol.valid_until}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={new Date(pol.valid_until) > new Date() ? "ACTIVE" : "EXPIRED"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {policies.length === 0 && <Empty text="No policies found." />}
            </div>
          </Panel>
        )}

        {/* ── COVERAGE CHECK ── */}
        {activeTab === "coverage" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Coverage Verification" subtitle="Check patient eligibility">
              <form onSubmit={checkCoverage} className="grid gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">Policy Number</label>
                  <input
                    required
                    className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-500"
                    placeholder="e.g. MED-POL-2026-8837"
                    value={coverageQuery}
                    onChange={e => { setCoverageQuery(e.target.value); setCoverageResult(null); setCoverageMsg(""); }}
                  />
                </div>
                {coverageMsg && <p className="text-sm font-bold text-red-600">{coverageMsg}</p>}
                <button className="rounded-2xl bg-teal-700 p-3 font-black text-white hover:bg-teal-600 active:scale-[0.98]">
                  Check Eligibility
                </button>
              </form>
            </Panel>

            {coverageResult && (
              <Panel title="Coverage Details" subtitle={coverageResult.patient_name ?? ""}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Patient"     value={coverageResult.patient_name ?? "—"} />
                  <Info label="Policy No."  value={coverageResult.policy_no} />
                  <Info label="Provider"    value={coverageResult.provider} />
                  <Info label="Coverage"    value={`₹${coverageResult.coverage_amount.toLocaleString()}`} />
                  <Info label="Valid Until" value={coverageResult.valid_until} />
                  <Info label="Status"      value={new Date(coverageResult.valid_until) > new Date() ? "ACTIVE" : "EXPIRED"} />
                </div>
              </Panel>
            )}
          </div>
        )}

        {/* ── TRACKING ── */}
        {activeTab === "tracking" && (
          <Panel title="Claim Status Timeline" subtitle="Track claim progress">
            <div className="grid gap-6">
              {claims.slice(0, 8).map(claim => {
                const stepOrder: Record<string, number> = { pending: 0, PENDING: 0, approved: 1, APPROVED: 1, settled: 2, SETTLED: 2 };
                const currentOrder = stepOrder[claim.status] ?? -1;
                const isRejected = claim.status === "rejected" || claim.status === "REJECTED";
                return (
                  <div key={claim.id} className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="font-black text-slate-950">{claim.patient_name ?? "—"}</h3>
                        <p className="text-sm text-slate-500">₹{claim.amount.toLocaleString()} • {new Date(claim.created_at).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={claim.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {["Submitted", "Approved", "Settled"].map((step, si) => {
                        const active = !isRejected && si <= currentOrder;
                        return (
                          <div key={step} className="flex items-center gap-2">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${active ? "bg-teal-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                              {si + 1}
                            </div>
                            <span className={`text-sm font-bold ${active ? "text-teal-700" : "text-slate-400"}`}>{step}</span>
                            {si < 2 && <div className={`h-0.5 w-8 ${active ? "bg-teal-400" : "bg-slate-200"}`} />}
                          </div>
                        );
                      })}
                      {isRejected && <span className="ml-2 text-sm font-black text-red-600">✗ REJECTED</span>}
                    </div>
                    {claim.decision_reason && (
                      <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{claim.decision_reason}</p>
                    )}
                  </div>
                );
              })}
              {claims.length === 0 && <Empty text="No claims to track." />}
            </div>
          </Panel>
        )}

      </div>
    </DashboardShell>
  );
}