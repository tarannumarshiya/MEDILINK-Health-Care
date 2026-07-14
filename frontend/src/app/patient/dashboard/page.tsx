"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/apiFetch";
import { DashboardShell, type TabItem } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import PayButton from "@/components/payment/PayButton";
import RazorpayQR from "@/components/payment/RazorpayQR";
import HospitalBill from "@/components/payment/HospitalBill";
import PaymentSuccessModal from "@/components/payment/PaymentSuccessModal";
import DatePicker from "@/components/public/DatePicker";
import TimeSelect from "@/components/public/TimeSelect";
import {
  BarChart3, User, FileText, Calendar, Pill,
  Beaker, Shield, CreditCard, Video, Bell, Loader2,
  TrendingUp, Heart, Clock, CheckCircle, Activity,
} from "lucide-react";

type PatientRow = { full_name: string; email: string; phone: string; age: number; patient_code: string; id: string };
type Appointment = { id: string; appointment_code: string; department: string; preferred_date: string; preferred_time: string | null; symptoms: string | null; status: string; created_at: string; lab_required: boolean | null; prescription_text: string | null; };
type PrescriptionItem = { id: string; medicine_name: string; dosage: string | null; quantity: number; instructions: string | null };
type Prescription = { id: string; appointment_id: string | null; prescription_notes: string | null; status: string; created_at: string; doctor_id: string | null; items?: PrescriptionItem[] };
type LabReport = { id: string; lab_test_id: string | null; result_summary: string | null; file_url: string | null; verified_by: string | null; verified_at: string | null; test_type: string | null; created_at: string };
type Invoice = { id: string; invoice_code: string; consultation_charge: number; lab_charge: number; medicine_charge: number; insurance_deduction: number; total: number; status: string; created_at: string };
type InsuranceClaim = { id: string; amount: number; status: string; decision_reason: string | null; settled_amount: number | null; created_at: string; policy_id: string | null };
type Notification = { id: string; title: string; body: string; is_read: boolean; created_at: string };
type TeleSession = { id: string; scheduled_at: string; status: string; room_url?: string | null; recording_url: string | null; doctor_id: string | null };
type Tab = "overview" | "profile" | "appointments" | "prescriptions" | "lab" | "insurance" | "billing" | "video" | "notifications" | "history";

function StatCard({ label, value, icon, color, bg }: { label: string; value: string | number; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[var(--line)] ${bg} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>{icon}</div>
      </div>
      <p className="font-display text-3xl font-black text-[var(--ink)]">{value}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-soft)] text-2xl">📭</div>
      <p className="font-black text-[var(--ink-2)] text-sm">{text}</p>
    </div>
  );
}

function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)]">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--line)]">
        <div>
          <h3 className="font-display font-black text-[var(--ink)] text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--canvas)] px-4 py-3">
      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}

const VALID_TABS: Tab[] = ["overview", "profile", "appointments", "prescriptions", "lab", "insurance", "billing", "video", "notifications", "history"];

function getTabFromURL(): Tab {
  if (typeof window === "undefined") return "overview";
  const p = new URLSearchParams(window.location.search).get("tab") as Tab | null;
  return p && VALID_TABS.includes(p) ? p : "overview";
}

export default function PatientDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>(getTabFromURL);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [saveMsg, setSaveMsg] = useState("");
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "", age: "" });
  const [originalProfile, setOriginalProfile] = useState({ full_name: "", phone: "", age: "" });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sessions, setSessions] = useState<TeleSession[]>([]);
  const [claimForm, setClaimForm] = useState({ amount: "", description: "" });
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [billPopup, setBillPopup] = useState<Invoice | null>(null);
  const [viewBill, setViewBill] = useState<Invoice | null>(null);
  const [paySuccessPopup, setPaySuccessPopup] = useState<{ amount: number; invoiceCode: string; method: string } | null>(null);
  const [teleForm, setTeleForm] = useState({ preferred_date: "", preferred_time: "", reason: "" });
  const [teleSubmitting, setTeleSubmitting] = useState(false);
  const [teleMsg, setTeleMsg] = useState("");

  // Sync tab → URL (pushState so back button works)
  const navigateTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    const url = `/patient/dashboard?tab=${tab}`;
    window.history.pushState({ tab }, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Listen to browser back/forward
  useEffect(() => {
    function onPop(e: PopStateEvent) {
      const tab = (e.state?.tab as Tab) ?? getTabFromURL();
      setActiveTab(VALID_TABS.includes(tab) ? tab : "overview");
    }
    window.addEventListener("popstate", onPop);
    // Seed initial history entry so first back goes to login
    window.history.replaceState({ tab: getTabFromURL() }, "", window.location.href);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: auth }) => {
      if (!auth.user) { router.replace("/patient/login"); return; }
      setUserId(auth.user.id);
      let { data: pat } = await supabase.from("patients").select("id,full_name,email,phone,age,patient_code").eq("profile_id", auth.user.id).maybeSingle();
      if (!pat && auth.user.email) {
        const { data: byEmail } = await supabase.from("patients").select("id,full_name,email,phone,age,patient_code").eq("email", auth.user.email).is("profile_id", null).maybeSingle();
        if (byEmail) { await supabase.from("patients").update({ profile_id: auth.user.id }).eq("id", byEmail.id); pat = byEmail; }
      }
      if (!pat) { router.replace("/patient/login"); return; }
      setPatient(pat); setProfileForm({ full_name: pat.full_name, phone: pat.phone, age: String(pat.age) }); setOriginalProfile({ full_name: pat.full_name, phone: pat.phone, age: String(pat.age) });
      const pid = pat.id;
      const [apptRes, labRes, invRes, claimRes, notifRes, teleRes] = await Promise.all([
        supabase.from("appointments").select("id,appointment_code,department,preferred_date,preferred_time,symptoms,status,created_at,lab_required,prescription_text").eq("patient_id", pid).order("created_at", { ascending: false }),
        supabase.from("lab_reports").select("id,lab_test_id,result_summary,file_url,verified_by,verified_at,test_type,created_at").eq("patient_id", pid).order("created_at", { ascending: false }),
        supabase.from("invoices").select("id,invoice_code,consultation_charge,lab_charge,medicine_charge,insurance_deduction,total,status,created_at").eq("patient_id", pid).order("created_at", { ascending: false }),
        supabase.from("insurance_claims").select("id,amount,status,decision_reason,settled_amount,created_at,policy_id").eq("patient_id", pid).order("created_at", { ascending: false }),
        supabase.from("notifications").select("id,title,body,is_read,created_at").eq("user_id", auth.user.id).order("created_at", { ascending: false }),
        supabase.from("telemedicine_sessions").select("id,scheduled_at,status,recording_url,doctor_id").eq("patient_id", pid).order("scheduled_at", { ascending: false }),
      ]);
      const appts = apptRes.data ?? [];
      setAppointments(appts); setLabReports(labRes.data ?? []); setInvoices(invRes.data ?? []);
      setClaims(claimRes.data ?? []); setNotifications(notifRes.data ?? []);

      let mappedTele = teleRes.data ?? [];
      const now = Date.now();
      mappedTele = mappedTele.map((s: TeleSession) => {
        let status = String(s.status || "SCHEDULED").toUpperCase();
        if (status === "SCHEDULED") {
          const sched = new Date(s.scheduled_at).getTime();
          if (now > sched + 60 * 60 * 1000) {
            status = "MISSED";
            supabase.from("telemedicine_sessions").update({ status: "MISSED" }).eq("id", s.id).then();
          }
        }
        return { ...s, status };
      });
      setSessions(mappedTele);

      // Show bill popup for the most recent UNPAID invoice (once per session)
      const unpaidInvs = (invRes.data ?? []).filter((i: Invoice) => i.status === "UNPAID" || i.status === "unpaid");
      if (unpaidInvs.length > 0) {
        const key = `bill_popup_shown_${unpaidInvs[0].id}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          setBillPopup(unpaidInvs[0]);
        }
      }
      if (appts.length > 0) {
        const { data: rxRows } = await supabase.from("prescriptions").select("id,appointment_id,prescription_notes,status,created_at,doctor_id").in("appointment_id", appts.map(a => a.id)).order("created_at", { ascending: false });
        if (rxRows && rxRows.length > 0) {
          const { data: items } = await supabase.from("prescription_items").select("*").in("prescription_id", rxRows.map(r => r.id));
          setPrescriptions(rxRows.map(rx => ({ ...rx, items: (items ?? []).filter(i => i.prescription_id === rx.id) })));
        }
      }
      setLoading(false);
    });
  }, []);

  async function saveProfile() {
    const supabase = createClient();
    if (!userId || !patient) return;
    const name = profileForm.full_name.trim();
    if (!name || name.length < 2) { setSaveMsg("❌ Full name must be at least 2 characters."); return; }
    if (name.length > 50) { setSaveMsg("❌ Full name must not exceed 50 characters."); return; }
    // Validate BD phone: accepts 01XXXXXXXXX, +8801XXXXXXXXX, 8801XXXXXXXXX
    let rawPhone = profileForm.phone.trim().replace(/[\s\-()]/g, "");
    if (rawPhone.startsWith("+880")) { const a = rawPhone.slice(4); rawPhone = a.startsWith("0") ? a : "0" + a; }
    else if (rawPhone.startsWith("880") && rawPhone.length > 11) { const a = rawPhone.slice(3); rawPhone = a.startsWith("0") ? a : "0" + a; }
    const phoneDigits = rawPhone.replace(/\D/g, "");
    if (phoneDigits.length !== 11 || !/^01[3-9]\d{8}$/.test(phoneDigits)) { setSaveMsg("❌ Enter a valid Bangladeshi phone number (e.g. 01XXXXXXXXX)."); return; }
    const age = Number(profileForm.age);
    if (!profileForm.age || isNaN(age) || age < 1 || age > 120) { setSaveMsg("❌ Enter a valid age (1–120)."); return; }
    await Promise.all([
      supabase.from("patients").update({ full_name: profileForm.full_name, phone: profileForm.phone, age: Number(profileForm.age) }).eq("profile_id", userId),
      supabase.from("profiles").update({ full_name: profileForm.full_name }).eq("id", userId),
    ]);
    setPatient(prev => prev ? { ...prev, full_name: profileForm.full_name, phone: profileForm.phone, age: Number(profileForm.age) } : prev);
    setSaveMsg("Profile updated successfully."); setTimeout(() => setSaveMsg(""), 3000); setOriginalProfile({ full_name: profileForm.full_name, phone: profileForm.phone, age: profileForm.age });
  }

  function formatTime(t: string | null) {
    if (!t) return "Any time";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  }

  async function requestVideoConsult(e: React.FormEvent) {
    e.preventDefault();
    if (!patient) return;
    setTeleSubmitting(true);
    setTeleMsg("");
    const supabase = createClient();
    const [year, month, day] = teleForm.preferred_date.split("-").map(Number);
    const [hour, minute] = (teleForm.preferred_time || "09:00").split(":").map(Number);
    const localDate = new Date(year, month - 1, day, hour, minute);

    const { error } = await supabase.from("telemedicine_sessions").insert({
      patient_id: patient.id,
      scheduled_at: localDate.toISOString(),
      status: "SCHEDULED",
    });
    if (error) {
      console.error("Telemedicine Request Error:", error);
      setTeleMsg("Failed to submit request. Please try again.");
    } else {
      setTeleMsg("✓ Submitted Requested");
      setTeleForm({ preferred_date: "", preferred_time: "", reason: "" });
      // refresh sessions
      const { data: updated } = await supabase
        .from("telemedicine_sessions")
        .select("id,scheduled_at,status,recording_url,doctor_id")
        .eq("patient_id", patient.id)
        .order("scheduled_at", { ascending: false });
      setSessions(updated ?? []);
    }
    setTeleSubmitting(false);
  }

  async function handleConsent(appointmentId: string, accept: boolean) {
    if (!confirm(`Are you sure you want to ${accept ? "accept" : "reject"} the prescribed lab tests and medicines?`)) return;
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to submit consent");
        return;
      }
      // Re-fetch appointments to update state
      const supabase = createClient();
      const { data: appts } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patient?.id)
        .order("created_at", { ascending: false });
      setAppointments(appts ?? []);
    } catch {
      alert("Something went wrong");
    }
  }

  async function markNotificationRead(id: string) {
    await apiFetch("/api/notifications/read", {
      method: "PATCH",
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  async function cancelAppointment(id: string) {
    setCancellingId(id);
    const supabase = createClient();
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a));
    setCancellingId(null);
  }

  async function payInvoice(id: string, method = "Razorpay") {
    // /api/payment/verify already wrote to the payments table and marked the invoice PAID.
    const inv = invoices.find(i => i.id === id);
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: "PAID" } : i));
    setBillPopup(null);
    setPayingId(null);
    // Show success popup
    if (inv) {
      setPaySuccessPopup({
        amount: inv.total,
        invoiceCode: inv.invoice_code,
        method,
      });
    }
  }

  async function markAllRead() {
    await apiFetch("/api/notifications/read", {
      method: "PATCH",
      body: JSON.stringify({ all: true }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  function printPrescription(rx: Prescription) {
    // Find the appointment for this prescription to get department/doctor info
    const appt = appointments.find(a => a.id === rx.appointment_id);
    // Create a temporary div to render the HospitalBill and print it
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    const items = rx.items ?? [];
    const rows = items.map(i => `<tr style="border-bottom:1px solid #d1fae5">
      <td style="padding:9px 14px;font-weight:700;color:#065f46">${i.medicine_name}</td>
      <td style="padding:9px 14px;text-align:center">${i.dosage ?? "—"}</td>
      <td style="padding:9px 14px;text-align:center;font-weight:700">${i.quantity}</td>
      <td style="padding:9px 14px;font-size:12px;color:#6b7280">${i.instructions ?? "As directed"}</td>
    </tr>`).join("");
    win.document.write(`<!DOCTYPE html><html><head><title>Prescription — Medilink Healthcare</title><meta charset="UTF-8"/>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a202c;background:#fff;padding:0}@media print{@page{margin:15mm;size:A4}}</style>
    </head><body>
    <div style="max-width:700px;margin:0 auto;background:#fff">
      <div style="background:linear-gradient(135deg,#0C1A27 0%,#1B5FA8 55%,#0D7550 100%);padding:28px 32px;color:#fff">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
          <div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
              <div style="width:40px;height:40px;background:rgba(255,255,255,.15);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px">🏥</div>
              <div><div style="font-size:20px;font-weight:900">Medilink Healthcare</div><div style="font-size:11px;opacity:.6">Multi-Specialty Hospital &amp; Diagnostics</div></div>
            </div>
            <div style="font-size:11px;opacity:.55;margin-top:8px;line-height:1.7">123 Healthcare Avenue, Medical District<br/>Dhaka-1215, Bangladesh<br/>📞 +880-2-9876543 | 📧 info@medilink.health</div>
          </div>
          <div style="text-align:right">
            <div style="background:rgba(255,255,255,.12);border-radius:10px;padding:14px 18px">
              <div style="font-size:10px;opacity:.6;letter-spacing:1px;text-transform:uppercase">Prescription</div>
              <div style="font-size:16px;font-weight:900;font-family:monospace;margin-top:2px">RX-${new Date(rx.created_at).getFullYear()}-${rx.id.slice(0, 6).toUpperCase()}</div>
              <div style="font-size:11px;opacity:.7;margin-top:4px">${new Date(rx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
            </div>
          </div>
        </div>
      </div>
      <div style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:16px 32px">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
          ${[
        ["Patient Name", patient?.full_name ?? "—"],
        ["Patient ID", patient?.patient_code ?? "—"],
        ["Age", patient?.age ? `${patient.age} yrs` : "—"],
        ["Department", appt?.department ?? "—"],
        ["Date", new Date(rx.created_at).toLocaleDateString()],
        ["Status", rx.status],
      ].map(([l, v]) => `<div style="background:#fff;border-radius:8px;padding:10px 14px;border:1px solid #e2e8f0"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:3px">${l}</div><div style="font-size:13px;font-weight:700;color:#1e293b">${v}</div></div>`).join("")}
        </div>
      </div>
      <div style="padding:24px 32px">
        ${rx.prescription_notes ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#78350f">📋 Doctor's Notes: ${rx.prescription_notes}</div>` : ""}
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:10px">Medicines Prescribed</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#065f46;color:#fff">
            <th style="padding:9px 14px;text-align:left;font-size:11px">Medicine</th>
            <th style="padding:9px 14px;text-align:center;font-size:11px">Dosage</th>
            <th style="padding:9px 14px;text-align:center;font-size:11px">Qty</th>
            <th style="padding:9px 14px;text-align:left;font-size:11px">Instructions</th>
          </tr></thead>
          <tbody>${rows.length ? rows : "<tr><td colspan='4' style='padding:14px;text-align:center;color:#94a3b8'>No medicines listed</td></tr>"}</tbody>
        </table>
        <div style="border-top:2px dashed #e2e8f0;margin-top:24px;padding-top:16px;display:flex;justify-content:space-between;align-items:flex-end">
          <div style="font-size:11px;color:#94a3b8;line-height:1.8">• This is a computer-generated prescription<br/>• Valid for 30 days from date of issue<br/>• Medilink Healthcare | BMDC Approved</div>
          <div style="text-align:center"><div style="border-top:1.5px solid #334155;padding-top:8px;width:160px;font-size:11px;color:#475569;font-weight:600">Doctor's Signature<br/><span style="font-size:10px;color:#94a3b8">Medilink Healthcare</span></div></div>
        </div>
        <div style="text-align:center;margin-top:16px;font-size:11px;color:#94a3b8">Thank you for choosing Medilink Healthcare. Wishing you good health! 💙</div>
      </div>
    </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  }

  async function submitClaim(e: React.FormEvent) {
    e.preventDefault(); if (!patient) return;
    const supabase = createClient();
    const { data } = await supabase.from("insurance_claims").insert({ patient_id: patient.id, amount: Number(claimForm.amount), status: "PENDING", description: claimForm.description }).select().single();
    if (data) setClaims(prev => [data, ...prev]);
    setClaimForm({ amount: "", description: "" });
  }

  const unread = notifications.filter(n => !n.is_read).length;
  const pending = appointments.filter(a => a.status === "PENDING" || a.status === "pending").length;
  const unpaid = invoices.filter(i => i.status === "UNPAID" || i.status === "unpaid").length;

  const tabs: TabItem[] = [
    { label: "Overview", value: "overview", icon: <BarChart3 className="h-4 w-4" /> },
    { label: "Profile", value: "profile", icon: <User className="h-4 w-4" /> },
    { label: "Appointments", value: "appointments", icon: <Calendar className="h-4 w-4" />, badge: pending },
    { label: "Prescriptions", value: "prescriptions", icon: <Pill className="h-4 w-4" /> },
    { label: "Lab Reports", value: "lab", icon: <Beaker className="h-4 w-4" /> },
    { label: "Insurance", value: "insurance", icon: <Shield className="h-4 w-4" /> },
    { label: "Billing", value: "billing", icon: <CreditCard className="h-4 w-4" />, badge: unpaid },
    { label: "Video Consult", value: "video", icon: <Video className="h-4 w-4" /> },
    { label: "My History", value: "history", icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Notifications", value: "notifications", icon: <Bell className="h-4 w-4" />, badge: unread },
  ];

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)]">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "var(--grad-primary)", boxShadow: "var(--shadow-glow)" }}>
          <Loader2 className="h-7 w-7 animate-spin text-white" />
        </div>
        <p className="text-sm font-black text-[var(--ink-2)]">Loading your health portal...</p>
      </div>
    </div>
  );

  return (
    <>
      <DashboardShell
        portalName="Patient Portal"
        portalSubtitle={`Welcome, ${patient?.full_name?.split(" ")[0] ?? "Patient"}`}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={t => navigateTab(t as Tab)}
        onBellClick={() => navigateTab("notifications")}
        liveSummary={[
          { label: "Patient Code", value: patient?.patient_code ?? "—" },
          { label: "Appointments", value: appointments.length },
          { label: "Unread Alerts", value: unread },
          { label: "Unpaid Bills", value: unpaid },
        ]}>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Welcome banner */}
            <div className="relative overflow-hidden rounded-2xl p-6"
              style={{ background: "linear-gradient(135deg,#0C1A27 0%,#1B5FA8 55%,#0D7550 100%)" }}>
              <div className="pointer-events-none absolute inset-0 animate-aurora opacity-[.10]"
                style={{ background: "linear-gradient(270deg,#1B5FA8,#15A06B,#2A75C5,#1B5FA8)", backgroundSize: "400% 400%", borderRadius: "inherit" }} />
              <div className="pointer-events-none absolute inset-0 opacity-[.04]"
                style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
              <div className="relative flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Patient Portal</p>
                  <h2 className="font-display text-2xl font-black text-white">
                    Good day, {patient?.full_name?.split(" ")[0] ?? "Patient"} 👋
                  </h2>
                  <p className="text-white/60 text-sm mt-1">Here&apos;s your health summary for today.</p>
                  <p className="text-white/40 text-xs mt-1 font-mono">{patient?.patient_code}</p>
                </div>
                <Link href="/appointment"
                  className="rounded-full bg-white px-6 py-3 font-black text-[var(--primary-deep)] text-sm hover:bg-white/90 transition shrink-0">
                  + Book Appointment
                </Link>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Appointments" value={appointments.length}
                icon={<Calendar className="h-4 w-4 text-[var(--primary)]" />} color="bg-[var(--primary-soft)]" bg="bg-white" />
              <StatCard label="Pending" value={pending}
                icon={<Clock className="h-4 w-4 text-amber-600" />} color="bg-amber-50" bg="bg-white" />
              <StatCard label="Prescriptions" value={prescriptions.length}
                icon={<Pill className="h-4 w-4 text-[var(--accent)]" />} color="bg-[var(--accent-soft)]" bg="bg-white" />
              <StatCard label="Lab Reports" value={labReports.length}
                icon={<Beaker className="h-4 w-4 text-violet-600" />} color="bg-violet-50" bg="bg-white" />
            </div>

            {/* Recent appointments + Quick actions */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Recent Appointments" subtitle="Latest activity"
                action={<Link href="#" onClick={e => { e.preventDefault(); navigateTab("appointments"); }} className="text-xs font-black text-[var(--primary)] hover:underline">View all</Link>}>
                <div className="space-y-2.5">
                  {appointments.slice(0, 4).map(a => (
                    <div key={a.id} className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-4 py-3">
                      <div>
                        <p className="font-black text-[var(--ink)] text-sm">{a.department}</p>
                        <p className="text-xs text-[var(--muted)]">{a.preferred_date}{a.preferred_time ? ` • ${a.preferred_time}` : ""}</p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                  {appointments.length === 0 && <Empty text="No appointments yet" />}
                </div>
              </Panel>

              <Panel title="Quick Actions" subtitle="Common tasks">
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Book Appointment", href: "/appointment", icon: "📋", color: "var(--primary)" },
                    { label: "Track Journey", href: "/patient/journey", icon: "🗺️", color: "var(--accent)" },
                    { label: "Find a Doctor", href: "/doctors", icon: "👨‍⚕️", color: "#7c3aed" },
                    { label: "Contact Support", href: "/contact", icon: "💬", color: "#d97706" },
                  ].map(a => (
                    <a key={a.label} href={a.href}
                      className="card-lift flex flex-col gap-2 rounded-xl border border-[var(--line)] bg-white p-4 text-left transition">
                      <span className="text-xl">{a.icon}</span>
                      <p className="font-black text-[var(--ink)] text-xs">{a.label}</p>
                    </a>
                  ))}
                </div>
              </Panel>
            </div>

            {/* Notifications preview */}
            <Panel title="Recent Notifications" subtitle={`${unread} unread`}
              action={unread > 0 ? <button onClick={markAllRead} className="text-xs font-black text-[var(--primary)] hover:underline">Mark all read</button> : undefined}>
              <div className="space-y-2.5">
                {notifications.slice(0, 4).map(n => (
                  <div key={n.id} onClick={() => markNotificationRead(n.id)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition hover:-translate-y-0.5 ${n.is_read ? "border-[var(--line)] bg-[var(--canvas)]" : "border-[var(--primary)]/20 bg-[var(--primary-soft)]"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-[var(--ink)] text-sm">{n.title}</p>
                        <p className="text-xs text-[var(--muted)] mt-0.5">{n.body}</p>
                      </div>
                      {!n.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />}
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && <Empty text="No notifications yet" />}
              </div>
            </Panel>
          </div>
        )}

        {/* ── PROFILE ── */}
        {activeTab === "profile" && (
          <Panel title="My Profile" subtitle="Update your personal details">
            <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
              {[
                { label: "Full Name", key: "full_name", type: "text" },
                { label: "Phone", key: "phone", type: "text" },
                { label: "Age", key: "age", type: "number" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--ink-2)] mb-1.5">{label}</label>
                  <input type={type} className="input-field"
                    value={profileForm[key as keyof typeof profileForm]}
                    onChange={e => setProfileForm({ ...profileForm, [key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--ink-2)] mb-1.5">Email</label>
                <input disabled className="input-field opacity-50 cursor-not-allowed" value={patient?.email ?? ""} />
              </div>
            </div>
            {saveMsg && (
              <div className={`mt-4 rounded-xl border px-4 py-2.5 text-sm font-bold ${saveMsg.startsWith("❌")
                  ? "border-red-100 bg-red-50 text-red-700"
                  : "border-green-100 bg-green-50 text-green-700"
                }`}>{saveMsg}</div>
            )}
            <button onClick={saveProfile}
              disabled={
                profileForm.full_name === originalProfile.full_name &&
                profileForm.phone === originalProfile.phone &&
                profileForm.age === originalProfile.age
              }
              className="btn-primary mt-5 rounded-full px-7 py-3 font-black text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed">
              Save Changes
            </button>
          </Panel>
        )}

        {/* ── APPOINTMENTS ── */}
        {activeTab === "appointments" && (
          <Panel title="My Appointments" subtitle={`${appointments.length} total`}
            action={<Link href="/appointment" className="btn-primary rounded-full px-4 py-2 text-xs font-black text-white">+ Book New</Link>}>
            <div className="space-y-4">
              {appointments.map(a => (
                <div key={a.id} className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)]">
                  <div className="flex flex-col justify-between gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="font-black text-[var(--ink)]">{a.department}</h3>
                      <p className="text-xs text-[var(--muted)] mt-0.5 font-mono">{a.appointment_code}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Info label="Date" value={a.preferred_date} />
                    <Info label="Time" value={formatTime(a.preferred_time)} />
                    <Info label="Symptoms" value={a.symptoms ?? "Not provided"} />
                  </div>
                  {(a.status === "pending" || a.status === "approved" || a.status === "PENDING" || a.status === "APPROVED") && (
                    <button onClick={() => cancelAppointment(a.id)} disabled={cancellingId === a.id}
                      className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-600 hover:bg-red-100 transition disabled:opacity-50">
                      {cancellingId === a.id ? "Cancelling…" : "Cancel Appointment"}
                    </button>
                  )}
                </div>
              ))}
              {appointments.length === 0 && <Empty text="No appointments found. Book one to get started." />}
            </div>
          </Panel>
        )}

        {/* ── PRESCRIPTIONS ── */}
        {activeTab === "prescriptions" && (
          <Panel title="My Prescriptions" subtitle={`${prescriptions.length} total`}>
            <div className="space-y-4">
              {prescriptions.map(rx => (
                <div key={rx.id} className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)]">
                  <div className="flex flex-col justify-between gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-black text-[var(--ink)]">Prescription — {new Date(rx.created_at).toLocaleDateString()}</p>
                      {rx.prescription_notes && <p className="mt-1 text-xs text-[var(--muted)]">{rx.prescription_notes}</p>}
                    </div>
                    <StatusBadge status={rx.status} />
                  </div>
                  {rx.items && rx.items.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)] mb-2.5">Medicines</p>
                      <div className="space-y-2">
                        {rx.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-4 py-3">
                            <div>
                              <p className="font-black text-[var(--ink)] text-sm">{item.medicine_name}</p>
                              <p className="text-xs text-[var(--muted)]">{item.instructions ?? "—"}</p>
                            </div>
                            <p className="font-black text-[var(--accent)] text-sm">{item.dosage} × {item.quantity}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={() => printPrescription(rx)}
                    className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-4 py-2 text-xs font-bold text-[var(--ink-2)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] transition">
                    🖨️ Print / Download
                  </button>
                </div>
              ))}
              {prescriptions.length === 0 && <Empty text="No prescriptions yet. They appear after your doctor consultation." />}
            </div>
          </Panel>
        )}

        {/* ── LAB REPORTS ── */}
        {activeTab === "lab" && (
          <Panel title="Lab Reports" subtitle={`${labReports.length} reports`}>
            <div className="space-y-4">
              {labReports.map(r => (
                <div key={r.id} className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)]">
                  <div className="flex flex-col justify-between gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-black text-[var(--ink)]">{r.test_type ?? "Lab Test"}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{r.verified_by ? `Verified by ${r.verified_by}` : "Pending verification"}</p>
                    </div>
                    <StatusBadge status={r.verified_at ? "VERIFIED" : "PENDING"} />
                  </div>
                  {r.result_summary && <p className="mt-4 rounded-xl bg-[var(--canvas)] p-4 text-sm leading-6 text-[var(--ink-2)]">{r.result_summary}</p>}
                  {r.file_url && (
                    <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                      className="btn-primary mt-3 inline-block rounded-full px-5 py-2.5 text-xs font-black text-white">
                      📥 Download Report
                    </a>
                  )}
                </div>
              ))}
              {labReports.length === 0 && <Empty text="No lab reports yet. Reports appear after tests are verified." />}
            </div>
          </Panel>
        )}

        {/* ── INSURANCE ── */}
        {activeTab === "insurance" && (
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <Panel title="My Insurance Claims" subtitle={`${claims.length} claims`}>
              <div className="space-y-3">
                {claims.map(c => (
                  <div key={c.id} className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-[var(--ink)]">৳{c.amount.toLocaleString()}</p>
                        <p className="text-xs text-[var(--muted)]">{new Date(c.created_at).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    {c.decision_reason && <p className="mt-2.5 rounded-xl bg-[var(--canvas)] p-3 text-xs text-[var(--ink-2)]">{c.decision_reason}</p>}
                    {c.settled_amount != null && <p className="mt-2 text-sm font-black text-[var(--accent)]">✓ Settled: ৳{c.settled_amount.toLocaleString()}</p>}
                  </div>
                ))}
                {claims.length === 0 && <Empty text="No insurance claims yet." />}
              </div>
            </Panel>
            <Panel title="Submit Claim" subtitle="File a new insurance claim">
              <form onSubmit={submitClaim} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--ink-2)] mb-1.5">Amount (৳)</label>
                  <input required type="number" min="1" placeholder="e.g. 5000" className="input-field"
                    value={claimForm.amount} onChange={e => {
                      const val = e.target.value;
                      if (val === "" || Number(val) > 0) setClaimForm({ ...claimForm, amount: val });
                    }} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--ink-2)] mb-1.5">Description</label>
                  <textarea className="input-field resize-none min-h-24" placeholder="Reason for claim"
                    value={claimForm.description} onChange={e => setClaimForm({ ...claimForm, description: e.target.value })} />
                </div>
                <button className="btn-primary w-full rounded-full py-3 font-black text-white text-sm">Submit Claim</button>
              </form>
            </Panel>
          </div>
        )}

        {/* ── BILLING ── */}
        {activeTab === "billing" && (
          <Panel title="Billing & Payments" subtitle={`${invoices.length} invoices`}>
            <div className="space-y-4">
              {invoices.map(inv => (
                <div key={inv.id} className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)]">
                  <div className="flex flex-col justify-between gap-3 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-black text-[var(--ink)] font-mono">{inv.invoice_code}</p>
                      <p className="text-xs text-[var(--muted)]">{new Date(inv.created_at).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-5">
                    <Info label="Consultation" value={`৳${inv.consultation_charge}`} />
                    <Info label="Lab" value={`৳${inv.lab_charge}`} />
                    <Info label="Medicine" value={`৳${inv.medicine_charge}`} />
                    <Info label="Insurance" value={`-৳${inv.insurance_deduction}`} />
                    <Info label="Total Due" value={`৳${inv.total}`} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button onClick={() => setViewBill(inv)}
                      className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-4 py-2 text-xs font-black text-[var(--ink-2)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] transition">
                      🧾 View Full Bill
                    </button>
                    {(inv.status === "UNPAID" || inv.status === "unpaid") && (
                      <>
                        <PayButton
                          amount={inv.total}
                          invoiceCode={inv.invoice_code}
                          description={`Invoice ${inv.invoice_code}`}
                          prefill={{ name: patient?.full_name, email: patient?.email }}
                          onSuccess={() => payInvoice(inv.id, "Razorpay")}
                        />
                        <RazorpayQR
                          amount={inv.total}
                          invoiceCode={inv.invoice_code}
                          prefill={{ name: patient?.full_name, email: patient?.email }}
                          onSuccess={() => payInvoice(inv.id, "UPI QR")}
                        />
                      </>
                    )}
                  </div>
                </div>
              ))}
              {invoices.length === 0 && <Empty text="No invoices yet. Bills appear after consultations." />}
            </div>
          </Panel>
        )}

        {/* ── VIDEO CONSULT ── */}
        {activeTab === "video" && (
          <div className="space-y-5">
            {/* Request form */}
            <Panel title="Request a Video Consultation" subtitle="Pick a date & time — a doctor will confirm">
              <form onSubmit={requestVideoConsult} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--ink-2)] mb-1.5">Preferred Date</label>
                  <DatePicker
                    required
                    value={teleForm.preferred_date}
                    onChange={v => setTeleForm({ ...teleForm, preferred_date: v, preferred_time: "" })}
                    placeholder="Select date"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--ink-2)] mb-1.5">Preferred Time</label>
                  <TimeSelect
                    required
                    value={teleForm.preferred_time}
                    onChange={v => setTeleForm({ ...teleForm, preferred_time: v })}
                    selectedDate={teleForm.preferred_date}
                    className="w-full"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-[var(--ink-2)] mb-1.5">Reason / Symptoms</label>
                  <textarea className="input-field w-full resize-none min-h-20" placeholder="Briefly describe your concern…"
                    value={teleForm.reason}
                    onChange={e => setTeleForm({ ...teleForm, reason: e.target.value })} />
                </div>
                {teleMsg && (
                  <p className={`sm:col-span-2 rounded-xl px-4 py-2.5 text-sm font-bold ${teleMsg.startsWith("✓") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}>{teleMsg}</p>
                )}
                <div className="sm:col-span-2">
                  <button disabled={teleSubmitting}
                    className="btn-primary rounded-full px-7 py-3 font-black text-white text-sm disabled:opacity-50">
                    {teleSubmitting ? "Submitting…" : "📹 Request Video Consultation"}
                  </button>
                </div>
              </form>
            </Panel>

            {/* Sessions list */}
            <Panel title="My Sessions" subtitle={`${sessions.length} total`}>
              <div className="space-y-4">
                {sessions.map(s => (
                  <div key={s.id} className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)]">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <p className="font-black text-[var(--ink)]">Teleconsultation</p>
                        <p className="text-sm text-[var(--muted)]">{new Date(s.scheduled_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                    {(() => {
                      if (!["SCHEDULED", "scheduled", "ONGOING", "ongoing"].includes(s.status)) return null;
                      const scheduledTime = new Date(s.scheduled_at).getTime();
                      const now = Date.now();
                      const isTime = now >= scheduledTime && now <= scheduledTime + 60 * 60 * 1000;

                      if (!isTime) {
                        return (
                          <button disabled className="btn-primary mt-4 inline-block rounded-full px-6 py-2.5 font-black text-white text-sm opacity-50 cursor-not-allowed">
                            ⏳ Opens at {new Date(s.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </button>
                        );
                      }
                      return (
                        <a href={s.room_url || `https://meet.jit.si/medlink-session-${s.id}`} target="_blank" rel="noopener noreferrer"
                          className="btn-primary mt-4 inline-block rounded-full px-6 py-2.5 font-black text-white text-sm">
                          📹 Join Session
                        </a>
                      );
                    })()}
                    {(s.status === "COMPLETED" || s.status === "completed") && s.recording_url && (
                      <a href={s.recording_url} target="_blank" rel="noopener noreferrer"
                        className="mt-4 inline-block rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-4 py-2 text-xs font-bold text-[var(--ink-2)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] transition">
                        ▶ View Recording
                      </a>
                    )}
                  </div>
                ))}
                {sessions.length === 0 && <Empty text="No sessions yet. Request one above." />}
              </div>
            </Panel>
          </div>
        )}

        {/* ── MY HISTORY ── */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {/* Doctor visit history */}
            <Panel title="Doctor Visit History" subtitle={`${appointments.length} total visits`}>
              <div className="space-y-3">
                {appointments.length === 0 && <Empty text="No doctor visits recorded yet." />}
                {appointments.map(a => {
                  const rx = prescriptions.find(p => p.appointment_id === a.id);
                  return (
                    <div key={a.id} className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)]">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div>
                          <p className="font-black text-[var(--ink)]">{a.department}</p>
                          <p className="text-xs text-[var(--muted)] font-mono mt-0.5">{a.appointment_code}</p>
                          <p className="text-xs text-[var(--muted)] mt-0.5">
                            {a.preferred_date}{a.preferred_time ? ` • ${formatTime(a.preferred_time)}` : ""}
                          </p>
                        </div>
                        <StatusBadge status={a.status} />
                      </div>
                      {a.symptoms && (
                        <p className="mt-2 rounded-xl bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--ink-2)]">
                          📃 {a.symptoms}
                        </p>
                      )}
                      {rx && (
                        <div className="mt-3 border-t border-[var(--line)] pt-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)] mb-2">Medicines Prescribed</p>
                          <div className="flex flex-wrap gap-2">
                            {(rx.items ?? []).map(item => (
                              <span key={item.id} className="rounded-full border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent)]">
                                💊 {item.medicine_name} ×{item.quantity}
                              </span>
                            ))}
                            {(rx.items ?? []).length === 0 && (
                              <span className="text-xs text-[var(--muted)]">No medicines listed</span>
                            )}
                          </div>
                          {rx.prescription_notes && (
                            <p className="mt-2 text-xs italic text-[var(--muted)]">📋 {rx.prescription_notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Panel>

            {/* Medicine purchase history from prescriptions */}
            <Panel title="Medicine Purchase History" subtitle={`All dispensed medicines across visits`}>
              {prescriptions.length === 0 && <Empty text="No prescription history yet." />}
              <div className="space-y-3">
                {prescriptions.filter(rx => (rx.items ?? []).length > 0).map(rx => {
                  const appt = appointments.find(a => a.id === rx.appointment_id);
                  return (
                    <div key={rx.id} className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)]">
                      <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
                        <div>
                          <p className="font-black text-[var(--ink)] text-sm">
                            {appt?.department ?? "Consultation"} — {new Date(rx.created_at).toLocaleDateString()}
                          </p>
                          {rx.prescription_notes && (
                            <p className="text-xs text-[var(--muted)] mt-0.5">{rx.prescription_notes}</p>
                          )}
                        </div>
                        <StatusBadge status={rx.status} />
                      </div>
                      <div className="mt-3 grid gap-2">
                        {(rx.items ?? []).map(item => (
                          <div key={item.id} className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-4 py-2.5">
                            <div>
                              <p className="font-black text-[var(--ink)] text-sm">{item.medicine_name}</p>
                              <p className="text-xs text-[var(--muted)]">{item.instructions ?? "As directed"}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-[var(--accent)] text-sm">{item.dosage}</p>
                              <p className="text-xs text-[var(--muted)]">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {prescriptions.filter(rx => (rx.items ?? []).length > 0).length === 0 && prescriptions.length > 0 && (
                  <p className="rounded-2xl bg-[var(--canvas)] p-6 text-center text-sm text-[var(--muted)]">Prescriptions found but no medicines listed yet.</p>
                )}
              </div>
            </Panel>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === "notifications" && (
          <Panel title="Notifications" subtitle={`${unread} unread`}
            action={unread > 0 ? (
              <button onClick={markAllRead}
                className="rounded-xl border border-[var(--line)] bg-[var(--canvas)] px-3 py-1.5 text-xs font-bold text-[var(--ink-2)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] transition">
                Mark all read
              </button>
            ) : undefined}>
            <div className="space-y-2.5">
              {notifications.map(n => (
                <div key={n.id} onClick={() => markNotificationRead(n.id)}
                  className={`cursor-pointer rounded-2xl border p-4 transition hover:-translate-y-0.5 ${n.is_read ? "border-[var(--line)] bg-[var(--canvas)]" : "border-[var(--primary)]/20 bg-[var(--primary-soft)]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-[var(--ink)] text-sm">{n.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">{n.body}</p>
                      <p className="mt-1.5 text-[10px] text-[var(--muted)]">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {!n.is_read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--primary)]" />}
                  </div>
                </div>
              ))}
              {notifications.length === 0 && <Empty text="No notifications yet." />}
            </div>
          </Panel>
        )}

        {/* ── CONSENT MODAL ── */}
        {appointments.some(a => a.status === "PENDING_PATIENT_APPROVAL") && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-[2rem] bg-white p-8 shadow-2xl">
              <div className="mb-6 flex items-center gap-3 text-amber-600">
                <Activity size={32} />
                <h2 className="text-2xl font-black">Doctor's Recommendations</h2>
              </div>
              {appointments.filter(a => a.status === "PENDING_PATIENT_APPROVAL").map(appt => (
                <div key={appt.id} className="mb-6">
                  <p className="text-lg font-bold text-slate-800">
                    Appointment: {appt.department}
                  </p>
                  <p className="mt-2 text-slate-600">
                    The doctor has prescribed {appt.lab_required ? "lab tests" : ""}
                    {appt.lab_required && appt.prescription_text ? " and " : ""}
                    {appt.prescription_text ? "medicines" : ""}.
                    Would you like to proceed with our hospital's facilities for these services?
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => handleConsent(appt.id, true)}
                      className="flex-1 rounded-2xl bg-amber-600 py-3 font-black text-white hover:bg-amber-700"
                    >
                      Accept & Proceed
                    </button>
                    <button
                      onClick={() => handleConsent(appt.id, false)}
                      className="flex-1 rounded-2xl border-2 border-slate-200 py-3 font-black text-slate-600 hover:bg-slate-50"
                    >
                      Reject Services
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BILL POPUP MODAL (quick alert style) ── */}
        {billPopup && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
              <div className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 px-6 py-5 text-center">
                <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "20px 20px" }} />
                <div className="relative">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl">🏥</div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/60">Medilink Healthcare</p>
                  <h2 className="mt-1 text-xl font-black text-white">Your Bill is Ready</h2>
                  <p className="mt-1 text-xs text-white/50 font-mono">{billPopup.invoice_code}</p>
                </div>
              </div>
              <div className="px-6 py-5">
                <div className="space-y-2.5">
                  {[
                    { label: "Consultation Fee", amount: billPopup.consultation_charge },
                    { label: "Laboratory Charges", amount: billPopup.lab_charge },
                    { label: "Medicine Charges", amount: billPopup.medicine_charge },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                      <span className="text-sm font-semibold text-slate-600">{row.label}</span>
                      <span className="text-sm font-black text-slate-800">৳{row.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {billPopup.insurance_deduction > 0 && (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2.5">
                      <span className="text-sm font-semibold text-emerald-700">Insurance Deduction</span>
                      <span className="text-sm font-black text-emerald-700">− ৳{billPopup.insurance_deduction.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3.5 mt-1">
                    <span className="text-sm font-black text-white">Total Amount Due</span>
                    <span className="text-xl font-black text-white">৳{billPopup.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 px-6 pb-6 pt-4 space-y-3">
                <div className="flex gap-2">
                  <PayButton
                    amount={billPopup.total}
                    invoiceCode={billPopup.invoice_code}
                    description={`Invoice ${billPopup.invoice_code}`}
                    prefill={{ name: patient?.full_name, email: patient?.email }}
                    className="flex-1 justify-center"
                    onSuccess={() => payInvoice(billPopup.id, "Razorpay")}
                  />
                  <RazorpayQR
                    amount={billPopup.total}
                    invoiceCode={billPopup.invoice_code}
                    prefill={{ name: patient?.full_name, email: patient?.email }}
                    onSuccess={() => payInvoice(billPopup.id, "UPI QR")}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setBillPopup(null); setViewBill(billPopup); }}
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-black text-slate-700 hover:bg-slate-100 transition">
                    🧾 View Full Bill
                  </button>
                  <button onClick={() => setBillPopup(null)}
                    className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition">
                    Pay Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FULL HOSPITAL BILL MODAL ── */}
        {viewBill && (() => {
          const inv = viewBill;
          // Find related appointment
          const relatedAppt = appointments.find(a => {
            const rx = prescriptions.find(p => p.appointment_id === a.id);
            return rx !== undefined;
          }) ?? appointments[0];
          // Gather all prescriptions for this patient
          const allItems = prescriptions.flatMap(p => p.items ?? []);
          const allPrescNotes = prescriptions.map(p => p.prescription_notes).filter(Boolean).join(" | ");
          // Gather lab reports formatted for bill
          const labBillTests = labReports.map(r => ({ test_type: r.test_type ?? "Lab Test", result_summary: r.result_summary }));
          return (
            <HospitalBill
              invoiceCode={inv.invoice_code}
              invoiceDate={inv.created_at}
              patientName={patient?.full_name ?? ""}
              patientCode={patient?.patient_code}
              patientAge={patient?.age}
              patientPhone={patient?.phone}
              department={relatedAppt?.department}
              consultationCharge={inv.consultation_charge}
              labCharge={inv.lab_charge}
              medicineCharge={inv.medicine_charge}
              insuranceDeduction={inv.insurance_deduction}
              total={inv.total}
              status={inv.status}
              labTests={labBillTests}
              prescriptionItems={allItems}
              prescriptionNotes={allPrescNotes || null}
              onClose={() => setViewBill(null)}
            />
          );
        })()}

      </DashboardShell>

      <PaymentSuccessModal
        open={!!paySuccessPopup}
        amount={paySuccessPopup?.amount}
        invoiceCode={paySuccessPopup?.invoiceCode}
        patientName={patient?.full_name}
        method={paySuccessPopup?.method}
        onClose={() => setPaySuccessPopup(null)}
      />
    </>
  );
}
