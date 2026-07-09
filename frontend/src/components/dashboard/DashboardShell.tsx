"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Bell, LogOut, Menu, X, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";

/* ── idle-timeout helpers ── */
export const SESSION_TIMEOUT_KEY = "ml_session_timeout_min"; // localStorage key
export const DEFAULT_TIMEOUT_MIN = 1;                         // default: 1 minute

function getTimeoutMs(): number {
  try {
    const raw = localStorage.getItem(SESSION_TIMEOUT_KEY);
    const mins = raw ? parseFloat(raw) : DEFAULT_TIMEOUT_MIN;
    return Math.max(0.5, mins) * 60 * 1000;
  } catch { return DEFAULT_TIMEOUT_MIN * 60 * 1000; }
}

function getWarnBeforeMs(timeoutMs: number): number {
  // Warn 30 s before, but never more than half the timeout
  return Math.min(30_000, timeoutMs / 2);
}

export type TabItem = { label: string; value: string; icon: ReactNode; badge?: number; };
export type LiveSummaryItem = { label: string; value: string | number; };

function Logo() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="text-left"
      aria-label="Refresh current portal page"
    >
      <BrandLogo isLink={false} className="scale-75 origin-left" />
    </button>
  );
}

export function DashboardShell({
  portalName, portalSubtitle, tabs, activeTab, onTabChange, liveSummary, headerExtra, children, onBellClick,
}: {
  portalName: string; portalSubtitle: string; tabs: TabItem[]; activeTab: string;
  onTabChange: (tab: string) => void; liveSummary?: LiveSummaryItem[]; headerExtra?: ReactNode; children: ReactNode;
  onBellClick?: () => void;
}) {
  const [userName, setUserName]       = useState("...");
  const [userInitials, setUserInitials] = useState("--");
  const [userRole, setUserRole]       = useState("");
  const [mobileOpen, setMobileOpen]   = useState(false);

  /* ── idle-timeout state ── */
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [countdown, setCountdown]             = useState(30);
  const [warnSecs, setWarnSecs]               = useState(30); // dynamic warn window
  const idleTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase.from("profiles").select("full_name, role").eq("id", data.user.id).single()
        .then(({ data: profile }) => {
          if (profile?.full_name) {
            setUserName(profile.full_name);
            const parts = profile.full_name.trim().split(" ");
            setUserInitials(parts.length >= 2 ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase() : parts[0].slice(0,2).toUpperCase());
          } else {
            setUserName(data.user.email ?? "User");
            setUserInitials((data.user.email ?? "U").slice(0,2).toUpperCase());
          }
          if (profile?.role) setUserRole(profile.role.replace(/_/g," "));
        });
    });
  }, []);

  const getLoginPath = useCallback(() => {
    const path = window.location.pathname;
    if (path.startsWith("/patient"))           return "/patient/login";
    if (path.startsWith("/emergency"))          return "/emergency/login";
    if (path.startsWith("/doctor"))             return "/doctor/login";
    if (path.startsWith("/lab"))                return "/lab/login";
    if (path.startsWith("/pharmacy"))           return "/pharmacy/login";
    if (path.startsWith("/reception"))          return "/reception/login";
    if (path.startsWith("/billing"))            return "/billing/login";
    if (path.startsWith("/insurance"))          return "/insurance/login";
    if (path.startsWith("/telemedicine"))        return "/telemedicine/login";
    return "/login";
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(getLoginPath());
  }

  /* ── idle-timeout logic ── */
  const clearIdleTimers = useCallback(() => {
    if (idleTimerRef.current)   clearTimeout(idleTimerRef.current);
    if (warnTimerRef.current)   clearTimeout(warnTimerRef.current);
    if (countdownRef.current)   clearInterval(countdownRef.current);
  }, []);

  const doAutoLogout = useCallback(async () => {
    clearIdleTimers();
    setShowIdleWarning(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(getLoginPath());
  }, [clearIdleTimers, getLoginPath, router]);

  const resetIdleTimer = useCallback(() => {
    clearIdleTimers();
    setShowIdleWarning(false);

    const timeoutMs  = getTimeoutMs();
    const warnMs     = getWarnBeforeMs(timeoutMs);
    const warnSec    = Math.round(warnMs / 1000);
    setWarnSecs(warnSec);
    setCountdown(warnSec);

    /* warn before logout */
    warnTimerRef.current = setTimeout(() => {
      setShowIdleWarning(true);
      setCountdown(warnSec);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, timeoutMs - warnMs);

    /* auto-logout after full idle period */
    idleTimerRef.current = setTimeout(() => {
      doAutoLogout();
    }, timeoutMs);
  }, [clearIdleTimers, doAutoLogout]);

  /* attach / detach activity listeners */
  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;
    const handler = () => resetIdleTimer();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetIdleTimer(); // start the timer on mount
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      clearIdleTimers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
        <Logo />
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-[var(--muted)] hover:text-[var(--ink)]">
          <X className="h-5 w-5"/>
        </button>
      </div>

      {/* Portal badge */}
      <div className="px-5 py-3 border-b border-[var(--line)] bg-[var(--primary-soft)]">
        <p className="text-[9px] font-black uppercase tracking-[.18em] text-[var(--primary)]">{portalName}</p>
      </div>

      {/* Nav tabs */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {tabs.map(tab => {
          const isActive = activeTab === tab.value;
          return (
            <button key={tab.value} onClick={() => { onTabChange(tab.value); setMobileOpen(false); }}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold mb-0.5 transition-all duration-200 ${
                isActive
                  ? "bg-[var(--primary)] text-white shadow-[0_4px_14px_rgba(27,95,168,.35)]"
                  : "text-[var(--ink-2)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
              }`}>
              <span className={`flex h-5 w-5 items-center justify-center transition-colors ${
                isActive ? "text-white" : "text-[var(--muted)] group-hover:text-[var(--primary)]"
              }`}>{tab.icon}</span>
              <span className="flex-1 text-left">{tab.label}</span>
              {tab.badge != null && tab.badge > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                  isActive ? "bg-white/25 text-white" : "bg-[var(--primary)] text-white"
                }`}>{tab.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Live summary */}
      {liveSummary && liveSummary.length > 0 && (
        <div className="border-t border-[var(--line)] px-5 py-4">
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-[var(--muted)] mb-3">Live Summary</p>
          <div className="space-y-2">
            {liveSummary.map(item => (
              <div key={item.label} className="flex justify-between text-xs">
                <span className="text-[var(--ink-2)]">{item.label}</span>
                <span className="font-black text-[var(--ink)] tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="border-t border-[var(--line)] p-4">
        <button onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-black text-red-600 transition hover:bg-red-100">
          <LogOut className="h-3.5 w-3.5"/> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[var(--canvas)] font-sans text-[var(--ink)]">

      {/* ── Idle-timeout warning modal ── */}
      {showIdleWarning && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          {/* card */}
          <div className="relative mx-4 w-full max-w-sm rounded-3xl border border-orange-100 bg-white p-8 shadow-2xl text-center animate-fade-rise">
            {/* pulsing icon */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
              <Clock className="h-8 w-8 text-orange-500 animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">Session Timeout</h2>
            <p className="text-sm text-slate-500 mb-5">
              You've been inactive. You will be signed out in
            </p>
            {/* countdown ring */}
            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" stroke="#fed7aa" strokeWidth="6" fill="none" />
                <circle
                  cx="40" cy="40" r="34"
                  stroke="#f97316"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - countdown / warnSecs)}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <span className="text-2xl font-black text-orange-600 tabular-nums">{countdown}</span>
            </div>
            <p className="text-xs text-slate-400 mb-6">seconds remaining</p>
            <div className="flex gap-3">
              <button
                onClick={resetIdleTimer}
                className="flex-1 rounded-2xl bg-teal-600 py-3 text-sm font-black text-white hover:bg-teal-500 transition"
              >
                Stay Signed In
              </button>
              <button
                onClick={doAutoLogout}
                className="flex-1 rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-black text-red-600 hover:bg-red-100 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-[240px] shrink-0 border-r border-[var(--line)] bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}/>
          <aside className="absolute left-0 top-0 h-full w-[240px] bg-white border-r border-[var(--line)] flex flex-col overflow-hidden shadow-[var(--shadow-lg)]">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col">

        {/* Topbar */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[var(--line)] bg-white px-4 lg:px-6 shadow-[0_1px_0_var(--line)]">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--line)] text-[var(--ink-2)] lg:hidden">
              <Menu className="h-4 w-4"/>
            </button>
            <div>
              <h1 className="font-display text-base font-black text-[var(--ink)] leading-tight">{portalSubtitle}</h1>
              <p className="text-[10px] text-[var(--muted)] font-semibold">{portalName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBellClick}
              className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--line)] text-[var(--ink-2)] hover:bg-[var(--canvas)] transition">
              <Bell className="h-4 w-4"/>
            </button>
            <div className="h-5 w-px bg-[var(--line)] mx-1"/>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white"
                style={{ background:"var(--grad-primary)" }}>
                {userInitials}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-black text-[var(--ink)] leading-none">{userName}</p>
                <p className="text-[10px] text-[var(--muted)] mt-0.5">{userRole || portalName}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-6 animate-fade-rise">
          {headerExtra && <div className="mb-5">{headerExtra}</div>}
          {children}
        </div>
      </main>
    </div>
  );
}
