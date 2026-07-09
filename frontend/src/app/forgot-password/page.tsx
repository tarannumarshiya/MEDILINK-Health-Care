"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, Phone, Mail } from "lucide-react";

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
        <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[var(--muted)]">Staff Portal</p>
      </div>
    </Link>
  );
}

export default function StaffForgotPasswordPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="relative flex w-full flex-col justify-center px-8 py-12 lg:w-[48%] xl:px-16 bg-white">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full opacity-30 animate-blob blur-2xl"
          style={{ background:"radial-gradient(circle,var(--primary-soft),transparent 70%)" }} />
        <div className="pointer-events-none absolute -right-10 bottom-10 h-56 w-56 rounded-full opacity-25 animate-blob-2 blur-2xl"
          style={{ background:"radial-gradient(circle,var(--accent-soft),transparent 70%)" }} />

        <div className="relative mx-auto w-full max-w-md">
          <Logo />

          <Link href="/login"
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
            aria-label="Back to Staff Login">
            <ArrowLeft className="h-4 w-4" />
            Back to Staff Login
          </Link>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700 mb-4">
              🔒 Password Reset Policy
            </div>
            <h1 className="font-display text-3xl font-black text-[var(--ink)]">
              Staff Password Reset
            </h1>
            <p className="mt-2 text-sm text-[var(--ink-2)] leading-6">
              For security reasons, staff accounts cannot self-reset their passwords.
            </p>
          </div>

          {/* Policy notice card */}
          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-black text-amber-900 text-sm leading-snug">
                  Password reset requests must be approved by Admin
                </h2>
                <p className="mt-2 text-sm text-amber-800 leading-6">
                  Only your <strong>Hospital Admin</strong> or <strong>Super Admin</strong> can initiate or approve a staff password reset. Self-service password reset is disabled for all staff accounts to protect patient data.
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--canvas)] p-5 mb-6">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--muted)] mb-4">
              How to reset your password
            </p>
            <div className="space-y-3">
              {[
                { step:"1", text:"Contact your Hospital Admin or Super Admin" },
                { step:"2", text:"Request a password reset — provide your registered email" },
                { step:"3", text:"Admin will initiate the reset from the Super Admin dashboard" },
                { step:"4", text:"You will receive a secure reset link via email" },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                    style={{ background:"var(--grad-primary)" }}>
                    {s.step}
                  </span>
                  <p className="text-sm text-[var(--ink-2)] leading-6">{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact options */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <a href="mailto:admin@medilink.com"
              className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-bold text-[var(--ink-2)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
              <Mail className="h-4 w-4 shrink-0" />
              Email Admin
            </a>
            <a href="tel:+88001234567890"
              className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-bold text-[var(--ink-2)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
              <Phone className="h-4 w-4 shrink-0" />
              Call Support
            </a>
          </div>

          <Link href="/login"
            className="btn-primary block w-full rounded-full py-4 font-black text-white text-center">
            Return to Staff Login
          </Link>

          <p className="mt-6 text-center text-xs text-[var(--muted)] leading-5">
            Are you a patient?{" "}
            <Link href="/patient/forgot-password" className="font-black text-[var(--primary)] hover:underline">
              Patient password reset →
            </Link>
          </p>
        </div>
      </div>

      {/* Right visual panel */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-1 items-center justify-center"
        style={{ background:"linear-gradient(135deg,#0C1A27 0%,#1B5FA8 55%,#0D7550 100%)" }}>

        <div className="pointer-events-none absolute inset-0 opacity-[.04]"
          style={{ backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize:"48px 48px" }} />
        <div className="pointer-events-none absolute -left-16 top-20 h-64 w-64 rounded-full bg-white opacity-8 animate-blob"/>
        <div className="pointer-events-none absolute -right-10 bottom-20 h-48 w-48 rounded-full bg-white opacity-6 animate-blob-2"/>

        <div className="relative px-10 text-center max-w-md">
          <div className="glass rounded-3xl px-8 py-10 shadow-[0_28px_72px_rgba(0,0,0,.32)]">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-400/20">
              <ShieldAlert className="h-10 w-10 text-amber-300" />
            </div>
            <h2 className="font-display text-2xl font-black text-white mb-2">
              Security First
            </h2>
            <p className="text-sm text-white/60 leading-6 mb-6">
              Staff password resets are admin-controlled to protect patient records and comply with healthcare data regulations.
            </p>

            <div className="space-y-3 text-left">
              {[
                { icon:"🔐", text:"Admin-controlled reset workflow" },
                { icon:"📧", text:"Secure one-time reset links" },
                { icon:"📋", text:"Full audit trail maintained" },
                { icon:"🛡️", text:"HIPAA-compliant procedures" },
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