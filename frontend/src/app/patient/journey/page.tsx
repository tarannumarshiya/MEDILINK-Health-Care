"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import {
  UserPlus, Building2, CalendarCheck, ShieldCheck, Stethoscope,
  FlaskConical, Pill, Receipt, CheckCircle2, Search, Loader2, ChevronRight,
  Clock, AlertCircle,
} from "lucide-react";

/* ─── Journey Steps Definition ─────────────────────────────────────────── */
const JOURNEY_STEPS = [
  {
    key: "REGISTRATION",
    label: "Registration",
    desc: "Patient creates account & profile",
    icon: UserPlus,
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    details: ["Full Name & Age", "Gender & Mobile", "Address", "Insurance Details", "Medical History"],
  },
  {
    key: "DEPARTMENT",
    label: "Department Selection",
    desc: "Choose the right speciality",
    icon: Building2,
    color: "from-violet-500 to-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    details: ["Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Dermatology", "General Medicine"],
  },
  {
    key: "PENDING",
    label: "Appointment Request",
    desc: "Booking submitted, awaiting admin approval",
    icon: CalendarCheck,
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    details: ["Preferred date & time", "Symptoms description", "Patient ID generated", "Appointment ID generated"],
  },
  {
    key: "APPROVED",
    label: "Admin Approval",
    desc: "Appointment confirmed by hospital admin",
    icon: ShieldCheck,
    color: "from-teal-500 to-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-700",
    details: ["Admin reviews request", "Assigns to department", "Slot confirmed", "Patient notified"],
  },
  {
    key: "IN_PROGRESS",
    label: "Doctor Consultation",
    desc: "Patient meets doctor in the assigned department",
    icon: Stethoscope,
    color: "from-cyan-500 to-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    text: "text-cyan-700",
    details: ["Symptom review", "Physical examination", "Diagnosis", "Prescription writing"],
  },
  {
    key: "LAB_REQUESTED",
    label: "Lab Tests",
    desc: "Doctor orders lab tests if required",
    icon: FlaskConical,
    color: "from-indigo-500 to-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700",
    details: ["Sample collection", "Test processing", "Report generation", "Pathologist verification"],
    optional: true,
  },
  {
    key: "PHARMACY_PENDING",
    label: "Pharmacy",
    desc: "Medicines dispensed based on prescription",
    icon: Pill,
    color: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    details: ["Prescription received", "Stock verification", "Medicines dispensed", "Pharmacy order closed"],
  },
  {
    key: "INVOICE_GENERATED",
    label: "Billing",
    desc: "Invoice generated and payment collected",
    icon: Receipt,
    color: "from-rose-500 to-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    details: ["Consultation charge", "Lab charges", "Medicine cost", "Insurance deduction"],
  },
  {
    key: "COMPLETED",
    label: "Journey Complete",
    desc: "Patient discharged with full records",
    icon: CheckCircle2,
    color: "from-green-500 to-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    details: ["Prescription on patient portal", "Lab reports downloadable", "Invoice receipt", "Follow-up reminders"],
  },
];

/* Map appointment statuses to journey step index */
const STATUS_TO_STEP: Record<string, number> = {
  PENDING:             2,
  APPROVED:            3,
  IN_PROGRESS:         4,
  PRESCRIPTION_READY:  4,
  LAB_REQUESTED:       5,
  LAB_PROCESSING:      5,
  LAB_COMPLETED:       5,
  PHARMACY_PENDING:    6,
  PHARMACY_FULFILLED:  6,
  INVOICE_GENERATED:   7,
  COMPLETED:           8,
  REJECTED:            -1,
  cancelled:           -1,
};

type Appointment = {
  appointment_code: string;
  department: string;
  status: string;
  preferred_date: string;
  preferred_time: string | null;
  patient_name: string;
};

function StepIcon({ Icon, active, done, index }: { Icon: React.ElementType; active: boolean; done: boolean; index: number }) {
  return (
    <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all duration-500 ${
      done
        ? "bg-gradient-to-br from-teal-500 to-emerald-500 shadow-[0_4px_16px_rgba(26,170,116,.35)]"
        : active
        ? "bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] shadow-[var(--shadow-glow)]"
        : "bg-slate-100"
    }`}>
      <Icon className={`h-6 w-6 ${done || active ? "text-white" : "text-slate-400"}`} />
      {done && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow">
          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
        </span>
      )}
      {active && !done && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 shadow">
          <Clock className="h-3 w-3 text-white" />
        </span>
      )}
    </div>
  );
}

function PatientJourneyInner() {
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("appt") ?? params.get("patient") ?? "");
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [rejected, setRejected] = useState(false);

  /* Auto-search if URL has param */
  useEffect(() => {
    const q = params.get("appt") ?? params.get("patient");
    if (q) { setSearch(q); fetchAppointment(q); }
  }, []);

  async function fetchAppointment(q: string) {
    setLoading(true);
    setError("");
    setAppointment(null);
    setActiveStep(null);
    setRejected(false);
    try {
      const res = await fetch("/api/appointments/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ search: q }),
      });
      const data = await res.json();
      if (!res.ok || !data.appointments?.length) {
        setError(data.error ?? "No appointment found. Please check your ID.");
        setLoading(false);
        return;
      }
      const appt: Appointment = data.appointments[0];
      setAppointment(appt);
      const stepIdx = STATUS_TO_STEP[appt.status] ?? 2;
      if (stepIdx === -1) { setRejected(true); setActiveStep(-1); }
      else setActiveStep(stepIdx);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) fetchAppointment(search.trim());
  }

  return (
    <main className="min-h-screen bg-[var(--canvas)]">
      <PublicNavbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-slate-950 px-6 py-20 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-[.06]"
          style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle,#1e6eb5,transparent)" }} />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle,#1aaa74,transparent)" }} />

        <div className="relative mx-auto max-w-3xl">
          <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white/70">
            End-to-End Healthcare
          </span>
          <h1 className="mt-5 font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
            Your Complete{" "}
            <span className="animate-gradient-text"
              style={{ backgroundImage: "linear-gradient(90deg,#1e6eb5,#06b6d4,#1aaa74,#1e6eb5)" }}>
              Patient Journey
            </span>
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            From registration to discharge — track every step of your healthcare experience.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <input
              className="h-14 w-full rounded-2xl border border-white/20 bg-white/10 px-5 text-sm text-white placeholder-white/40 outline-none backdrop-blur focus:border-teal-400 focus:bg-white/15 sm:w-96"
              placeholder="Enter Appointment ID / Patient ID / Phone"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] px-7 font-black text-white shadow-[0_4px_20px_rgba(30,110,181,.5)] transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Search className="h-4 w-4" /> Track Journey</>}
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">

        {/* Error */}
        {error && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Rejected */}
        {rejected && appointment && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-xl font-black text-red-700">Appointment Not Approved</p>
            <p className="mt-2 text-sm font-bold text-red-500">
              Your appointment ({appointment.appointment_code}) was rejected. Please book a new appointment or contact reception.
            </p>
            <Link href="/appointment" className="mt-5 inline-block rounded-2xl bg-red-600 px-6 py-3 font-black text-white hover:bg-red-500">
              Book New Appointment
            </Link>
          </div>
        )}

        {/* Appointment Info Banner */}
        {appointment && !rejected && (
          <div className="mb-10 rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[var(--shadow-md)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[var(--muted)]">Tracking Appointment</p>
                <h2 className="mt-1 text-2xl font-black text-[var(--ink)]">{appointment.patient_name}</h2>
                <p className="mt-1 text-sm font-bold text-[var(--ink-2)]">
                  {appointment.appointment_code} &bull; {appointment.department}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {appointment.preferred_date}{appointment.preferred_time ? ` at ${appointment.preferred_time}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-teal-50 px-4 py-2 text-sm font-black text-teal-700 ring-1 ring-teal-200">
                  {appointment.status.replaceAll("_", " ")}
                </span>
                <Link href={`/patient/track?patient=${appointment.appointment_code}`}
                  className="rounded-2xl border border-[var(--line)] px-4 py-2 text-sm font-bold text-[var(--ink-2)] hover:border-teal-400 hover:text-teal-700">
                  Full Details →
                </Link>
              </div>
            </div>

            {/* Progress bar */}
            {activeStep !== null && activeStep >= 0 && (
              <div className="mt-5">
                <div className="flex justify-between text-xs font-bold text-[var(--muted)]">
                  <span>Started</span>
                  <span>Step {activeStep + 1} of {JOURNEY_STEPS.length}</span>
                  <span>Complete</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all duration-700"
                    style={{ width: `${((activeStep) / (JOURNEY_STEPS.length - 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Journey Steps ── */}
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-7 top-0 hidden h-full w-0.5 bg-slate-200 sm:block" style={{ marginTop: "56px", height: "calc(100% - 56px)" }} />

          <div className="grid gap-5">
            {JOURNEY_STEPS.map((step, idx) => {
              const done   = activeStep !== null && activeStep > idx;
              const active = activeStep === idx;
              const future = activeStep === null || activeStep < idx;
              const Icon   = step.icon;

              return (
                <div
                  key={step.key}
                  className={`relative rounded-[var(--radius)] border p-6 shadow-[var(--shadow)] transition-all duration-500 ${
                    active
                      ? `${step.border} ${step.bg} shadow-[var(--shadow-md)]`
                      : done
                      ? "border-emerald-200 bg-emerald-50/60"
                      : "border-[var(--line)] bg-white opacity-70"
                  }`}
                >
                  <div className="flex gap-5">
                    <StepIcon Icon={Icon} active={active} done={done} index={idx} />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`text-lg font-black ${active ? step.text : done ? "text-emerald-700" : "text-[var(--ink)]"}`}>
                              {step.label}
                            </h3>
                            {step.optional && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
                                If Required
                              </span>
                            )}
                          </div>
                          <p className={`mt-1 text-sm ${active ? step.text : "text-[var(--ink-2)]"} opacity-80`}>
                            {step.desc}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {done && (
                            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Done
                            </span>
                          )}
                          {active && (
                            <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                              <Clock className="h-3.5 w-3.5" /> In Progress
                            </span>
                          )}
                          {future && (
                            <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details pills */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {step.details.map(d => (
                          <span key={d}
                            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                              done
                                ? "bg-emerald-100 text-emerald-700"
                                : active
                                ? `${step.bg} ${step.text}`
                                : "bg-slate-100 text-slate-500"
                            }`}>
                            {done && <CheckCircle2 className="h-3 w-3" />}
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Step number */}
                  <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[11px] font-black text-slate-600 shadow">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CTA strip ── */}
        {activeStep === null && !loading && !error && (
          <div className="mt-12 rounded-3xl border border-[var(--line)] bg-white p-8 text-center shadow-[var(--shadow-md)]">
            <p className="text-xl font-black text-[var(--ink)]">Don&apos;t have an appointment yet?</p>
            <p className="mt-2 text-[var(--ink-2)]">Book one and we&apos;ll guide you through every step of your care journey.</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/appointment"
                className="btn-primary rounded-full px-8 py-4 font-black text-white">
                Book Appointment
              </Link>
              <Link href="/patient/register"
                className="rounded-full border-2 border-[var(--primary)] px-8 py-4 font-black text-[var(--primary)] transition hover:bg-[var(--primary-soft)]">
                Create Account
              </Link>
            </div>
          </div>
        )}

        {/* ── Completed state ── */}
        {activeStep === JOURNEY_STEPS.length - 1 && appointment && (
          <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-[0_8px_32px_rgba(26,170,116,.35)]">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <p className="text-2xl font-black text-emerald-800">Journey Complete! 🎉</p>
            <p className="mt-2 text-emerald-700">All steps for {appointment.patient_name}&apos;s visit are done.</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/patient/dashboard"
                className="rounded-2xl bg-emerald-600 px-6 py-3 font-black text-white hover:bg-emerald-500">
                View Dashboard
              </Link>
              <Link href="/appointment"
                className="rounded-2xl border border-emerald-300 px-6 py-3 font-black text-emerald-700 hover:bg-emerald-100">
                Book Follow-up
              </Link>
            </div>
          </div>
        )}
      </section>

      <PublicFooter />
    </main>
  );
}

export default function PatientJourneyPage() {
  return (
    <Suspense fallback={null}>
      <PatientJourneyInner />
    </Suspense>
  );
}
