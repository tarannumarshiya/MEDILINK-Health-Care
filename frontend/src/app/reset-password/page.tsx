"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Check if we have the necessary tokens from the URL
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");
  const hasValidToken = !!(accessToken && refreshToken);

  const validatePassword = (pwd: string): string | null => {
    if (!pwd) return "Password is required";
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number";
    if (!/[^A-Za-z0-9]/.test(pwd)) return "Password must contain at least one special character";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message || "Failed to update password. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (!hasValidToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)] p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-[var(--shadow-lg)] border border-[var(--line)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="font-display text-2xl font-black text-[var(--ink)]">Invalid Link</h2>
          <p className="mt-3 text-sm text-[var(--ink-2)] leading-6">
            {error}
          </p>
          <Link href="/forgot-password"
            className="btn-primary mt-8 block rounded-full py-4 font-black text-white text-center">
            Request New Link
          </Link>
          <Link href="/login"
            className="mt-3 block w-full text-center text-sm text-[var(--muted)] hover:text-[var(--primary)]">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!accessToken && !refreshToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)] p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-[var(--shadow-lg)] border border-[var(--line)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background:"var(--grad-primary)", boxShadow:"var(--shadow-glow)" }}>
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="font-display text-2xl font-black text-[var(--ink)]">Password Updated!</h2>
          <p className="mt-3 text-sm text-[var(--ink-2)] leading-6">
            Your password has been successfully updated. Redirecting to login...
          </p>
          <Link href="/login"
            className="btn-primary mt-8 block rounded-full py-4 font-black text-white text-center">
            Go to Login
          </Link>
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
              <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[var(--muted)]">Staff Portal</p>
            </div>
          </Link>

          <Link href="/login"
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--primary)] mb-4">
              🔐 Reset Password
            </div>
            <h1 className="font-display text-3xl font-black text-[var(--ink)]">Create new password</h1>
            <p className="mt-2 text-sm text-[var(--ink-2)] leading-6">
              Your new password must be different from previous passwords.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="block mb-1.5 text-xs font-black uppercase tracking-widest text-[var(--ink-2)]">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className={`input-field pr-10 ${error && error.includes("password") ? "border-red-400" : ""}`}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  autoFocus
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">Password requirements:</p>
                  <ul className="space-y-0.5">
                    {[
                      { test: password.length >= 8, text: "At least 8 characters" },
                      { test: /[A-Z]/.test(password), text: "One uppercase letter" },
                      { test: /[a-z]/.test(password), text: "One lowercase letter" },
                      { test: /[0-9]/.test(password), text: "One number" },
                      { test: /[^A-Za-z0-9]/.test(password), text: "One special character" },
                    ].map(({ test, text }) => (
                      <li key={text} className={`text-[10px] font-semibold flex items-center gap-1.5 ${test ? "text-green-600" : "text-[var(--muted)]"}`}>
                        <span>{test ? "✓" : "○"}</span>
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-black uppercase tracking-widest text-[var(--ink-2)]">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  className={`input-field pr-10 ${error && error.includes("match") ? "border-red-400" : ""}`}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-full py-4 font-black text-white flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Password"}
            </button>
          </form>
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
              <span className="text-4xl">🔑</span>
            </div>
            <h2 className="font-display text-2xl font-black text-white mb-2">Strong Password</h2>
            <p className="text-sm text-white/60 leading-6 mb-6">
              Create a strong password to keep your account secure.
            </p>
            <div className="space-y-3 text-left">
              {[
                { icon:"🔒", text:"Minimum 8 characters" },
                { icon:"🔤", text:"Mix of letters & numbers" },
                { icon:"✨", text:"Special characters" },
                { icon:"🛡️", text:"Unique to this account" },
              ].map(s => (
                <div key={s.text} className="flex items-center gap-3 glass-dark rounded-2xl px-4 py-2.5">
                  <span className="text-base">{s.icon}</span>
                  <p className="text-sm font-semibold text-white">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    }>
      <ResetPasswordInner />
    </Suspense>
  );
}