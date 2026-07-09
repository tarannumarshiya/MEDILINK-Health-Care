"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
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

function ForgotPasswordInner() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.toLowerCase())) {
      setError("Please enter a valid email address."); return;
    }
    setLoading(true); setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/patient/reset-password`,
    });
    setLoading(false);
    // Always show success (security: don't reveal if email exists)
    if (err && err.message.toLowerCase().includes("rate")) {
      setError("Too many requests. Please wait a few minutes and try again.");
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)] p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-[var(--shadow-lg)] border border-[var(--line)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background:"var(--grad-primary)", boxShadow:"var(--shadow-glow)" }}>
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="font-display text-2xl font-black text-[var(--ink)]">Check your email</h2>
          <p className="mt-3 text-sm text-[var(--ink-2)] leading-6">
            If an account exists for <span className="font-black text-[var(--primary)]">{email}</span>, we've sent a password reset link. Check your inbox and spam folder.
          </p>
          <p className="mt-3 text-xs text-[var(--muted)]">The link expires in 60 minutes.</p>
          <Link href="/patient/login"
            className="btn-primary mt-8 block rounded-full py-4 font-black text-white text-center">
            Back to Login
          </Link>
          <button
            onClick={() => { setSent(false); }}
            className="mt-3 block w-full text-center text-sm text-[var(--muted)] hover:text-[var(--primary)]">
            Try a different email
          </button>
        </div>
      </div>
    );
  }

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

          <Link href="/patient/login"
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--primary)] mb-4">
              🔑 Password Reset
            </div>
            <h1 className="font-display text-3xl font-black text-[var(--ink)]">Forgot password?</h1>
            <p className="mt-2 text-sm text-[var(--ink-2)] leading-6">
              No worries! Enter your registered email address and we'll send you a secure reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="reset-email" className="block mb-1.5 text-xs font-black uppercase tracking-widest text-[var(--ink-2)]">
                Email Address
              </label>
              <input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                className={`input-field ${error ? "border-red-400" : ""}`}
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                autoFocus
                autoComplete="email"
                aria-describedby={error ? "reset-email-error" : undefined}
                aria-invalid={!!error}
              />
              <div aria-live="polite">
                {error && (
                  <p id="reset-email-error" className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-full py-4 font-black text-white flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--ink-2)]">
            Remember your password?{" "}
            <Link href="/patient/login" className="font-black text-[var(--primary)] hover:underline">Sign in</Link>
          </p>
          <p className="mt-2 text-center text-sm text-[var(--ink-2)]">
            New patient?{" "}
            <Link href="/patient/register" className="font-black text-[var(--primary)] hover:underline">Create an account</Link>
          </p>
        </div>
      </div>

      {/* Right visual panel */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-1 items-center justify-center"
        style={{ background:"linear-gradient(135deg,var(--primary-deep) 0%,var(--primary) 45%,var(--accent) 100%)" }}>

        <div className="pointer-events-none absolute inset-0 opacity-[.05]"
          style={{ backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize:"36px 36px" }} />
        <div className="pointer-events-none absolute -left-16 top-20 h-64 w-64 rounded-full bg-white opacity-10 animate-blob"/>
        <div className="pointer-events-none absolute -right-10 bottom-20 h-48 w-48 rounded-full bg-white opacity-8 animate-blob-2"/>

        <div className="relative px-10 text-center">
          <div className="glass rounded-3xl px-8 py-10 shadow-[0_28px_72px_rgba(0,0,0,.28)]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
              <span className="text-4xl">🔒</span>
            </div>
            <h2 className="font-display text-2xl font-black text-white mb-2">Secure Reset</h2>
            <p className="text-sm text-white/60 leading-6 mb-6">
              We'll send a one-time secure link to your registered email. The link expires in 60 minutes.
            </p>
            <div className="space-y-3 text-left">
              {[
                { icon:"📧", text:"Check your inbox" },
                { icon:"🔗", text:"Click the reset link" },
                { icon:"🔑", text:"Set a new password" },
                { icon:"✅", text:"Log in securely" },
              ].map(s => (
                <div key={s.text} className="flex items-center gap-3 glass-dark rounded-2xl px-4 py-2.5">
                  <span className="text-base">{s.icon}</span>
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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordInner />
    </Suspense>
  );
}
