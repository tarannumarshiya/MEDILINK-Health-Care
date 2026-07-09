"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function ECGLine({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 48" fill="none" className={className} aria-hidden>
      <path d="M0 24 L50 24 L63 6 L76 42 L89 4 L102 42 L115 24 L165 24 L178 6 L191 42 L204 4 L217 42 L230 24 L320 24"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="animate-ecg-loop" strokeDasharray="700"/>
    </svg>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 mb-10">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white"
        style={{ background:"var(--grad-primary)", boxShadow:"var(--shadow-glow)" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
          <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
          <path d="M8 15a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-3"/>
          <circle cx="20" cy="10" r="2"/>
        </svg>
      </div>
      <div>
        <p className="text-[15px] font-black tracking-widest text-[var(--ink)] uppercase">Medilink</p>
        <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[var(--muted)]">Health Care</p>
      </div>
    </Link>
  );
}

function ResetPasswordInner() {
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  useEffect(() => {
    // Supabase automatically exchanges the token from the URL hash
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
      } else {
        // Wait briefly for hash-based token exchange
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: d2 }) => {
            if (d2.session) setSessionReady(true);
            else setSessionError(true);
          });
        }, 1200);
      }
    });
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must contain letters and at least one number."); return;
    }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message || "Failed to reset password. Please try again."); return; }
    setDone(true);
    setTimeout(() => { window.location.href = "/patient/login"; }, 3000);
  };

  if (sessionError) return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)] p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-[var(--shadow-lg)] border border-[var(--line)]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="font-display text-2xl font-black text-[var(--ink)]">Link Expired</h2>
        <p className="mt-3 text-sm text-[var(--ink-2)] leading-6">
          This reset link has expired or is invalid. Reset links are valid for 60 minutes.
        </p>
        <Link href="/patient/forgot-password"
          className="btn-primary mt-8 block rounded-full py-4 font-black text-white text-center">
          Request New Link
        </Link>
      </div>
    </div>
  );

  if (done) return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)] p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-[var(--shadow-lg)] border border-[var(--line)]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background:"var(--grad-primary)", boxShadow:"var(--shadow-glow)" }}>
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h2 className="font-display text-2xl font-black text-[var(--ink)]">Password Updated!</h2>
        <p className="mt-3 text-sm text-[var(--ink-2)] leading-6">
          Your password has been reset successfully. Redirecting you to login…
        </p>
        <Link href="/patient/login"
          className="btn-primary mt-8 block rounded-full py-4 font-black text-white text-center">
          Go to Login
        </Link>
      </div>
    </div>
  );

  if (!sessionReady) return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)]">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Left form */}
      <div className="relative flex w-full flex-col justify-center px-8 py-12 lg:w-[48%] xl:px-16 bg-white">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full opacity-35 animate-blob blur-2xl"
          style={{ background:"radial-gradient(circle,var(--primary-soft),transparent 70%)" }} />
        <div className="pointer-events-none absolute -right-10 bottom-10 h-56 w-56 rounded-full opacity-30 animate-blob-2 blur-2xl"
          style={{ background:"radial-gradient(circle,var(--accent-soft),transparent 70%)" }} />

        <div className="relative mx-auto w-full max-w-md">
          <Logo />

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--primary)] mb-4">
              🔑 New Password
            </div>
            <h1 className="font-display text-3xl font-black text-[var(--ink)]">Set new password</h1>
            <p className="mt-2 text-sm text-[var(--ink-2)]">
              Choose a strong password for your account.
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block mb-1.5 text-xs font-black uppercase tracking-widest text-[var(--ink-2)]">New Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  className={`input-field pr-11 ${error && !confirm ? "border-red-400" : ""}`}
                  value={password}
                  autoComplete="new-password"
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)] transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-[10px] text-[var(--muted)]">Must be 8+ characters with letters and at least one number.</p>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-black uppercase tracking-widest text-[var(--ink-2)]">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Enter your password again"
                  className={`input-field pr-11 ${error ? "border-red-400" : ""}`}
                  value={confirm}
                  autoComplete="new-password"
                  onChange={e => { setConfirm(e.target.value); setError(""); }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--canvas)] hover:text-[var(--ink)] transition-colors">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full rounded-full py-4 font-black text-white flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Password"}
            </button>
          </form>
        </div>
      </div>

      {/* Right panel */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-1 items-center justify-center"
        style={{ background:"linear-gradient(135deg,var(--primary-deep) 0%,var(--primary) 45%,var(--accent) 100%)" }}>
        <div className="pointer-events-none absolute inset-0 opacity-[.05]"
          style={{ backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize:"36px 36px" }} />
        <div className="relative px-10 text-center">
          <div className="glass rounded-3xl px-8 py-10 shadow-[0_28px_72px_rgba(0,0,0,.28)]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
              <span className="text-4xl">🛡️</span>
            </div>
            <h2 className="font-display text-2xl font-black text-white mb-2">Stay Secure</h2>
            <p className="text-sm text-white/60 leading-6 mb-6">Tips for a strong password</p>
            <div className="space-y-3 text-left">
              {[
                { icon:"✓", text:"At least 8 characters" },
                { icon:"✓", text:"Mix of letters and numbers" },
                { icon:"✓", text:"Avoid personal details" },
                { icon:"✓", text:"Don't reuse old passwords" },
              ].map(s => (
                <div key={s.text} className="flex items-center gap-3 glass-dark rounded-2xl px-4 py-2.5">
                  <span className="text-sm font-black text-[var(--accent)]">{s.icon}</span>
                  <p className="text-sm font-semibold text-white">{s.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 overflow-hidden rounded-xl bg-white/8 px-3 py-2">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">ECG — Rhythm Normal</p>
              <ECGLine className="h-8 w-full text-white/60"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
