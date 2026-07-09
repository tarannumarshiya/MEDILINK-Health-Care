"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/apiFetch";
import {
  ClipboardList, Droplet, Cog, Upload, CheckCircle, Loader2, Download,
} from "lucide-react";
import { DashboardShell, type TabItem } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Panel } from "@/components/dashboard/Panel";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { SuccessBanner } from "@/components/dashboard/SuccessBanner";

/* ── types ── */
type LabTest = {
  id: string;
  appointment_id: string | null;
  patient_id: string | null;
  doctor_id: string | null;
  test_type: string | null;
  status: string;
  sample_collected_at: string | null;
  created_at: string;
  patient_name?: string;
  doctor_name?: string;
};

type LabReport = {
  id: string;
  lab_test_id: string | null;
  result_summary: string | null;
  file_url: string | null;
  verified_by: string | null;
  verified_at: string | null;
  test_type?: string;
  patient_name?: string;
};

type Tab = "requests" | "collection" | "processing" | "upload" | "verification";

const tabs: TabItem[] = [
  { label: "Test Requests", value: "requests",     icon: <ClipboardList className="h-[18px] w-[18px]" /> },
  { label: "Collection",   value: "collection",   icon: <Droplet       className="h-[18px] w-[18px]" /> },
  { label: "Processing",   value: "processing",   icon: <Cog           className="h-[18px] w-[18px]" /> },
  { label: "Report Upload",value: "upload",       icon: <Upload        className="h-[18px] w-[18px]" /> },
  { label: "Verification", value: "verification", icon: <CheckCircle   className="h-[18px] w-[18px]" /> },
];

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-400">{text}</p>;
}


export default function LabQueuePage() {
  const [activeTab, setActiveTab]     = useState<Tab>("requests");
  const [loading, setLoading]         = useState(true);
  const [message, setMessage]         = useState("");
  const [tests, setTests]             = useState<LabTest[]>([]);
  const [reports, setReports]         = useState<LabReport[]>([]);
  const [flashId, setFlashId]         = useState<string | null>(null);
  const [uploadForm, setUploadForm]   = useState({ test_id: "", summary: "" });
  const [uploadFile, setUploadFile]   = useState<File | null>(null);
  const [actionId, setActionId]       = useState<string | null>(null);

  const [patMap, setPatMap] = useState<Record<string, string>>({});

  async function loadData() {
    try {
      const res = await apiFetch("/api/lab/queue");
      const data = await res.json();
      if (data.success) {
        const pm = data.patMap ?? {};
        setPatMap(pm);
        setTests(data.tests ?? []);
        setReports((data.reports ?? []).map((r: LabReport & { lab_test_id: string }) => {
          const t = (data.tests ?? []).find((tt: LabTest) => tt.id === r.lab_test_id);
          return {
            ...r,
            test_type:    t?.test_type ?? "Lab Test",
            patient_name: pm[t?.patient_id ?? ""] ?? "Unknown",
          };
        }));
      }
    } catch { /* network error - ignore */ }
    setLoading(false);
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = "/lab/login"; return; }
      loadData();
    });
  }, []);

  function flash(id: string) {
    setFlashId(id);
    setTimeout(() => setFlashId(null), 800);
  }

  async function updateTestStatus(id: string, status: string, extra?: Partial<LabTest>) {
    const res = await apiFetch("/api/lab/update-status", {
      method: "PATCH",
      body: JSON.stringify({ test_id: id, status, ...extra }),
    });
    const data = await res.json();
    // If a virtual id was just inserted, update it with the real id
    if (data.new_id && id.startsWith("appt-ref-")) {
      setTests(prev => prev.map(t => t.id === id ? { ...t, id: data.new_id, status, ...extra } : t));
    } else {
      setTests(prev => prev.map(t => t.id === id ? { ...t, status, ...extra } : t));
    }
    flash(data.new_id ?? id);
  }

  async function collectSample(id: string) {
    setActionId(id);
    const now = new Date().toISOString();
    await updateTestStatus(id, "COLLECTED", { sample_collected_at: now });
    setMessage("Sample collected successfully.");
    setActionId(null);
  }

  async function startProcessing(id: string) {
    setActionId(id);
    await updateTestStatus(id, "PROCESSING");
    setMessage("Test processing started.");
    setActionId(null);
  }

  async function completeTest(id: string) {
    setActionId(id);
    await updateTestStatus(id, "COMPLETED");
    setMessage("Test completed — ready for report upload.");
    setActionId(null);
  }

  async function verifyReport(reportId: string) {
    setActionId(reportId);
    const res = await apiFetch("/api/lab/verify-report", {
      method: "PATCH",
      body: JSON.stringify({ report_id: reportId }),
    });
    const data = await res.json();
    if (data.success) {
      const now = new Date().toISOString();
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, verified_by: "Lab Pathologist", verified_at: now } : r));
      flash(reportId);
      setMessage("Report verified and approved.");
    } else {
      setMessage(data.error ?? "Verify failed.");
    }
    setActionId(null);
  }

  async function uploadReport(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadForm.test_id || !uploadForm.summary) return;
    setActionId("upload");
    const supabase = createClient();
    const test = tests.find(t => t.id === uploadForm.test_id);

    /* upload file to Supabase Storage if one was selected */
    let file_url: string | null = null;
    if (uploadFile) {
      const ext      = uploadFile.name.split(".").pop();
      const path     = `${uploadForm.test_id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("lab-reports")
        .upload(path, uploadFile, { upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("lab-reports").getPublicUrl(path);
        file_url = urlData.publicUrl;
      }
    }

    const apptId = test?.appointment_id ?? null;
    const res2 = await apiFetch("/api/lab/upload-report", {
      method: "POST",
      body: JSON.stringify({
        test_id: uploadForm.test_id,
        result_summary: uploadForm.summary,
        file_url,
        appointment_id: apptId,
      }),
    });
    const data2 = await res2.json();
    if (data2.success && data2.report) {
      setReports(prev => [{
        ...data2.report,
        test_type:    test?.test_type   ?? "Lab Test",
        patient_name: patMap[test?.patient_id ?? ""] ?? "Unknown",
      }, ...prev]);
      setTests(prev => prev.map(t => t.id === uploadForm.test_id ? { ...t, status: "COMPLETED" } : t));
    }

    setUploadForm({ test_id: "", summary: "" });
    setUploadFile(null);
    setMessage("Report uploaded successfully.");
    setActionId(null);
  }

  const pendingTests    = tests.filter(t => t.status === "PENDING").length;
  const processingTests = tests.filter(t => t.status === "PROCESSING").length;
  const completedTests  = tests.filter(t => t.status === "COMPLETED" || t.status === "VERIFIED").length;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
    </div>
  );

  return (
    <DashboardShell
      portalName="Laboratory Portal"
      portalSubtitle="Test Processing & Reports"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={t => setActiveTab(t as Tab)}
      liveSummary={[
        { label: "Pending",    value: pendingTests },
        { label: "Processing", value: processingTests },
        { label: "Completed",  value: completedTests },
        { label: "Reports",    value: reports.length },
      ]}
    >
      {message && <SuccessBanner message={message} onDismiss={() => setMessage("")} />}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending"       value={pendingTests}    icon={<ClipboardList className="h-5 w-5" />} />
        <MetricCard label="Processing"    value={processingTests} icon={<Cog           className="h-5 w-5" />} />
        <MetricCard label="Completed"     value={completedTests}  icon={<CheckCircle   className="h-5 w-5" />} />
        <MetricCard label="Total Reports" value={reports.length}  icon={<Upload        className="h-5 w-5" />} />
      </div>

      <div key={activeTab} className="animate-fade-rise">

        {/* TEST REQUESTS */}
        {activeTab === "requests" && (
          <Panel title="Test Requests" subtitle="Doctor-requested tests awaiting processing">
            {tests.length === 0
              ? <Empty text="No lab test requests yet." />
              : (
                <div className="grid gap-4">
                  {tests.map(test => (
                    <div key={test.id}
                      className={`rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] transition-colors duration-300 ${flashId === test.id ? "animate-row-flash" : ""}`}>
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--ink)]">{test.patient_name}</h3>
                          <p className="mt-1 text-sm text-[var(--ink-2)]">{test.test_type} • Ordered by {test.doctor_name}</p>
                        </div>
                        <StatusBadge status={test.status} />
                      </div>
                      <p className="mt-2 text-xs text-[var(--muted)]">{new Date(test.created_at).toLocaleString()}</p>
                      <div className="mt-4 flex gap-3">
                        {test.status === "PENDING" && (
                          <button onClick={() => collectSample(test.id)} disabled={actionId === test.id}
                            className="rounded-[var(--radius-sm)] bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-50">
                            {actionId === test.id ? "…" : "Collect Sample"}
                          </button>
                        )}
                        {test.status === "COLLECTED" && (
                          <button onClick={() => startProcessing(test.id)} disabled={actionId === test.id}
                            className="rounded-[var(--radius-sm)] bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-50">
                            {actionId === test.id ? "…" : "Start Processing"}
                          </button>
                        )}
                        {test.status === "PROCESSING" && (
                          <button onClick={() => completeTest(test.id)} disabled={actionId === test.id}
                            className="rounded-[var(--radius-sm)] bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:brightness-95 disabled:opacity-50">
                            {actionId === test.id ? "…" : "Mark Complete"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </Panel>
        )}

        {/* SAMPLE COLLECTION */}
        {activeTab === "collection" && (() => {
          const collectionTests = tests.filter(t => t.status === "PENDING" || t.status === "COLLECTED");
          return (
            <Panel title="Sample Collection" subtitle="Track sample collection status">
              {collectionTests.length === 0
                ? <div className="rounded-3xl bg-emerald-50 p-6 text-center font-bold text-emerald-700">All samples collected! ✓</div>
                : (
                  <div className="grid gap-4">
                    {collectionTests.map(test => (
                      <div key={test.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <div>
                          <p className="font-black text-slate-950">{test.patient_name}</p>
                          <p className="text-sm font-bold text-slate-500">{test.test_type}</p>
                          {test.sample_collected_at && (
                            <p className="text-xs text-emerald-600">Collected: {new Date(test.sample_collected_at).toLocaleString()}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={test.status === "COLLECTED" ? "COLLECTED" : "PENDING"} />
                          {test.status === "PENDING" && (
                            <button onClick={() => collectSample(test.id)} disabled={actionId === test.id}
                              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-50">
                              {actionId === test.id ? "…" : "Collect"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </Panel>
          );
        })()}

        {/* PROCESSING */}
        {activeTab === "processing" && (() => {
          const procTests = tests.filter(t => t.status === "PROCESSING" || t.status === "COLLECTED");
          return (
            <Panel title="Processing Tests" subtitle="Tests currently being processed">
              {procTests.length === 0
                ? <Empty text="No tests in processing queue." />
                : (
                  <div className="grid gap-4">
                    {procTests.map(test => (
                      <div key={test.id}
                        className={`rounded-2xl border border-slate-200 p-5 shadow-sm transition-colors duration-300 ${flashId === test.id ? "animate-row-flash" : ""}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-black text-slate-950">{test.patient_name}</p>
                            <p className="text-sm font-bold text-slate-500">{test.test_type}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusBadge status={test.status} />
                            {test.status === "COLLECTED" && (
                              <button onClick={() => startProcessing(test.id)} disabled={actionId === test.id}
                                className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-black text-white hover:bg-indigo-500 disabled:opacity-50">
                                {actionId === test.id ? "…" : "Process"}
                              </button>
                            )}
                            {test.status === "PROCESSING" && (
                              <button onClick={() => completeTest(test.id)} disabled={actionId === test.id}
                                className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-500 disabled:opacity-50">
                                {actionId === test.id ? "…" : "Complete"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </Panel>
          );
        })()}

        {/* REPORT UPLOAD */}
        {activeTab === "upload" && (
          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <form onSubmit={uploadReport} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-black text-slate-950">Upload Report</h2>
              <select
                className="mt-5 w-full rounded-2xl border border-slate-300 p-4 outline-none focus:border-teal-500"
                value={uploadForm.test_id}
                onChange={e => setUploadForm({ ...uploadForm, test_id: e.target.value })}
                required
              >
                <option value="">Select Test</option>
                {tests.filter(t => t.status === "COMPLETED").map(t => (
                  <option key={t.id} value={t.id}>{t.patient_name} — {t.test_type}</option>
                ))}
              </select>
              <textarea
                className="mt-4 min-h-32 w-full rounded-2xl border border-slate-300 p-4 outline-none focus:border-teal-500"
                placeholder="Result summary..."
                value={uploadForm.summary}
                onChange={e => setUploadForm({ ...uploadForm, summary: e.target.value })}
                required
              />
              <label className="mt-4 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 transition hover:border-teal-400 hover:bg-teal-50">
                <Upload className="mb-2 h-6 w-6 text-slate-400" />
                {uploadFile
                  ? <span className="font-bold text-teal-700">{uploadFile.name}</span>
                  : <><span className="font-bold">Click to browse or drop file</span><span className="mt-1 text-xs">PDF, JPG, PNG — max 10MB</span></>}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                  onChange={e => setUploadFile(e.target.files?.[0] ?? null)} />
              </label>
              <button
                disabled={actionId === "upload"}
                className="mt-5 w-full rounded-2xl bg-teal-700 p-4 font-black text-white hover:bg-teal-600 disabled:opacity-50">
                {actionId === "upload" ? "Uploading…" : "Upload Report"}
              </button>
            </form>
            <Panel title="Uploaded Reports" subtitle="Recent lab reports">
              {reports.length === 0
                ? <Empty text="No reports uploaded yet." />
                : (
                  <div className="grid gap-4">
                    {reports.map(r => (
                      <div key={r.id} className="rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-black text-slate-950">{r.patient_name}</p>
                            <p className="text-sm font-bold text-slate-500">{r.test_type}</p>
                          </div>
                          <StatusBadge status={r.verified_at ? "VERIFIED" : "PENDING"} />
                        </div>
                        <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{r.result_summary}</p>
                        {r.file_url && (
                          <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700 hover:bg-teal-100">
                            <Download className="h-4 w-4" /> Download Report
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </Panel>
          </div>
        )}

        {/* VERIFICATION */}
        {activeTab === "verification" && (() => {
          const unverified = reports.filter(r => !r.verified_at);
          return (
            <Panel title="Report Verification" subtitle="Pathologist approval queue">
              {unverified.length === 0
                ? <div className="rounded-3xl bg-emerald-50 p-10 text-center font-bold text-emerald-700">All reports verified! ✓</div>
                : (
                  <div className="grid gap-4">
                    {unverified.map(report => (
                      <div key={report.id}
                        className={`rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-colors duration-300 ${flashId === report.id ? "animate-row-flash" : ""}`}>
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                          <div>
                            <h3 className="text-xl font-black text-slate-950">{report.patient_name}</h3>
                            <p className="text-sm font-bold text-slate-500">{report.test_type}</p>
                          </div>
                          <StatusBadge status="PENDING" />
                        </div>
                        <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{report.result_summary}</p>
                        <button
                          onClick={() => verifyReport(report.id)}
                          disabled={actionId === report.id}
                          className="mt-4 rounded-2xl bg-emerald-600 px-6 py-3 font-black text-white hover:bg-emerald-500 disabled:opacity-50">
                          {actionId === report.id ? "Verifying…" : "Verify & Approve"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </Panel>
          );
        })()}

      </div>
    </DashboardShell>
  );
}
