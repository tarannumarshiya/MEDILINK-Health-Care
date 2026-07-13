"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validateLoginForm } from "@/lib/validate";
import BrandLogo from "@/components/BrandLogo";

function ECGLine({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 48" fill="none" className={className} aria-hidden>
      <path d="M0 24 L50 24 L63 6 L76 42 L89 4 L102 42 L115 24 L165 24 L178 6 L191 42 L204 4 L217 42 L230 24 L320 24"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="animate-ecg-loop" strokeDasharray="700" />
    </svg>
  );
}



function PatientLoginInner() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/patient/dashboard";
  const booking = next === "/appointment";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ email: "", password: "" });
  
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (fieldErrors[k]) setFieldErrors(p => ({ ...p, [k]: "" }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const errs: Record<string, string> = {};
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(form.email.trim())) errs.email = "Enter a valid email.";
    
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters.";
    
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true); setError("");
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (err || !data.user) { setError("Invalid login credentials"); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("role,is_active").eq("id", data.user.id).single();
    if (!profile || profile.role !== "PATIENT") { await supabase.auth.signOut(); setError("This is the patient portal. Please use the staff login."); setLoading(false); return; }
    if (!profile.is_active) { await supabase.auth.signOut(); setError("Account inactive. Contact support."); setLoading(false); return; }
    window.location.href = next;
  };

  return (
    <div className="flex min-h-screen">

      {/* Left form */}
      <div className="relative flex w-full flex-col justify-center px-8 py-12 lg:w-[48%] xl:px-16 bg-white">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full opacity-35 animate-blob blur-2xl"
          style={{ background: "radial-gradient(circle,var(--primary-soft),transparent 70%)" }} />
        <div className="pointer-events-none absolute -right-10 bottom-10 h-56 w-56 rounded-full opacity-30 animate-blob-2 blur-2xl"
          style={{ background: "radial-gradient(circle,var(--accent-soft),transparent 70%)" }} />

        <div className="relative mx-auto w-full max-w-md">
          <BrandLogo className="mb-10" />

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--primary)] mb-4">
              🔐 Patient Portal
            </div>
            <h1 className="font-display text-3xl font-black text-[var(--ink)]">
              {booking ? "Sign in to Book" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-[var(--ink-2)]">
              {booking
                ? "Sign in to your patient account to book your appointment."
                : "Sign in to manage your health records and appointments."}
            </p>
          </div>

          {booking && (
            <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
              <p className="text-sm font-black text-blue-800">First time here?</p>
              <p className="mt-1 text-xs text-blue-600">Create a free patient account to book appointments, view prescriptions, pay bills and more.</p>
              <Link href="/patient/register"
                className="mt-3 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-500">
                Register as Patient →
              </Link>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {[
              { label: "Email address", key: "email", type: "email", placeholder: "you@example.com" },
              { label: "Password", key: "password", type: "password", placeholder: "••••••••" },
            ].map(f => (
              <div key={f.key}>
                <label htmlFor={f.key} className="block mb-1.5 text-xs font-black uppercase tracking-widest text-[var(--ink-2)]">{f.label}</label>
                {f.key === "password" ? (
                  <div className="relative">
                    <input id={f.key} type={showPw ? "text" : "password"} required placeholder={f.placeholder} className={`input-field pr-11 ${fieldErrors[f.key] ? "border-red-400 bg-red-50 focus:border-red-500" : ""}`}
                      value={form[f.key as keyof typeof form]} onChange={set(f.key)} autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                ) : (
                  <input id={f.key} type={f.type} required placeholder={f.placeholder} className={`input-field ${fieldErrors[f.key] ? "border-red-400 bg-red-50 focus:border-red-500" : ""}`}
                    value={form[f.key as keyof typeof form]} onChange={set(f.key)} autoComplete="email" />
                )}
                {fieldErrors[f.key] && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors[f.key]}</p>}
                {f.key === "password" && (
                  <div className="flex justify-end mt-1.5">
                    <Link href="/patient/forgot-password"
                      className="text-[11px] font-black text-[var(--primary)] hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                )}
              </div>
            ))}

            <div aria-live="polite">
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 mb-4">{error}</div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full rounded-full py-4 font-black text-white flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In to Portal"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--ink-2)]">
            New patient?{" "}
            <Link href="/patient/register" className="font-black text-[var(--primary)] hover:underline">Create an account</Link>
          </p>
        </div>
      </div>

      {/* Right visual panel */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-1 items-center justify-center"
        style={{ background: "linear-gradient(135deg,var(--primary-deep) 0%,var(--primary) 45%,var(--accent) 100%)" }}>

        <div className="pointer-events-none absolute inset-0 opacity-[.05]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "36px 36px" }} />
        <div className="pointer-events-none absolute -left-16 top-20 h-64 w-64 rounded-full bg-white opacity-10 animate-blob" />
        <div className="pointer-events-none absolute -right-10 bottom-20 h-48 w-48 rounded-full bg-white opacity-8 animate-blob-2" />

        <div className="relative px-10 text-center">
          <div className="mb-8 glass rounded-3xl px-8 py-8 shadow-[0_28px_72px_rgba(0,0,0,.28)]">
            <div className="grid grid-cols-2 gap-5 mb-6">
              {[
                { val: "50K+", label: "Patients Served", bg: "bg-white/12" },
                { val: "200+", label: "Doctors", bg: "bg-white/12" },
                { val: "40+", label: "Specialities", bg: "bg-white/12" },
                { val: "99%", label: "Satisfaction", bg: "bg-white/12" },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-2xl px-4 py-3 text-center`}>
                  <p className="text-2xl font-black text-white">{s.val}</p>
                  <p className="text-[10px] text-white/55 font-bold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="overflow-hidden rounded-xl bg-white/8 px-3 py-2 mb-5">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">ECG — Rhythm Normal</p>
              <ECGLine className="h-8 w-full text-white/60" />
            </div>
            <p className="text-sm font-black text-white mb-0.5">Patient Portal</p>
            <p className="text-[11px] text-white/50">Secure · Private · Digital Health</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {["📋 Appointments", "💊 Prescriptions", "🧪 Lab Reports", "🛡️ Insurance", "💳 Billing"].map(h => (
              <div key={h} className="glass rounded-full px-3.5 py-1.5 text-[11px] font-bold text-white">{h}</div>
            ))}
          </div>

          <div className="glass absolute -left-5 top-8 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-xl">
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full rounded-full bg-[var(--accent)] opacity-70" style={{ animation: "ping-soft 1.4s infinite" }} />
              <span className="relative h-2 w-2 rounded-full bg-[var(--accent)]" />
            </span>
            24×7 Care
          </div>

        </div>
      </div>
    </div>
  );
}

export default function PatientLoginPage() {
  return (
    <Suspense fallback={null}>
      <PatientLoginInner />
    </Suspense>
  );
}
