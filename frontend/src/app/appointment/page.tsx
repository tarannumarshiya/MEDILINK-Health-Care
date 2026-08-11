"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import StickyHelpBar from "@/components/public/StickyHelpBar";
import DatePicker from "@/components/public/DatePicker";
import TimeSelect from "@/components/public/TimeSelect";
import { createClient } from "@/lib/supabase/client";
import { Loader2, UserCheck } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { validateAppointmentForm, validateBDPhone } from "@/lib/validate";

type BookingSuccess = {
  patient_code: string;
  appointment_code: string;
  status: string;
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs font-semibold text-red-500">{msg}</p>;
}

function Label({ children, required, htmlFor }: { children: React.ReactNode; required?: boolean; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block mb-1.5 text-xs font-black uppercase tracking-widest text-slate-500">
      {children}{required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
}

export default function AppointmentPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked]   = useState(false);
  const [isLoggedIn,  setIsLoggedIn]    = useState(false);
  const [departments, setDepartments]   = useState<string[]>([]);
  const [form, setForm] = useState({
    full_name: "", age: "", phone: "", email: "",
    description: "", department: "",
    preferred_date: "", preferred_time: "", symptoms: "",
    // guest-only extras
    reason_for_visit: "", emergency_contact: "",
    is_video_consultation: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState<BookingSuccess | null>(null);

  const set = (k: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (fieldErrors[k]) setFieldErrors(prev => ({ ...prev, [k]: "" }));
  };

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: auth }) => {
      // --- unauthenticated guest ---
      if (!auth.user) {
        setIsLoggedIn(false);
        setAuthChecked(true);
        return;
      }

      // --- check patient role ---
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", auth.user.id).single();

      if (!profile || profile.role !== "PATIENT") {
        setIsLoggedIn(false);
        setAuthChecked(true);
        return;
      }

      // --- pre-fill from patient record ---
      const { data: patient } = await supabase
        .from("patients")
        .select("full_name, phone, age, email")
        .eq("profile_id", auth.user.id)
        .maybeSingle();

      if (patient) {
        setForm(f => ({
          ...f,
          full_name: patient.full_name ?? "",
          phone:     patient.phone     ?? "",
          age:       patient.age       ? String(patient.age) : "",
          email:     patient.email     ?? "",
        }));
      }

      setIsLoggedIn(true);
      setAuthChecked(true);
    });

    // Pre-fill department from ?department= URL param
    const params = new URLSearchParams(window.location.search);
    const deptParam = params.get("department");
    if (deptParam) setForm(f => ({ ...f, department: deptParam }));

    // Load departments
    apiFetch("/api/admin/departments")
      .then(r => r.json())
      .then(data => {
        const uniqueMap = new Map();
        (data.departments ?? [])
          .filter((d: { is_active: boolean }) => d.is_active)
          .forEach((d: { name: string }) => {
            const clean = d.name.trim();
            const key = clean.toLowerCase();
            if (!uniqueMap.has(key)) uniqueMap.set(key, clean);
          });
        const active = Array.from(uniqueMap.values());
        if (active.length > 0) setDepartments(active);
      })
      .catch((err) => {
        console.error("Failed to fetch departments:", err);
        setError("Failed to connect to the backend server. Please ensure the backend is running.");
      });
  }, []);

  // Unified client-side validation
  function validateForm() {
    const errs: Record<string, string> = {};
    
    const name = form.full_name.trim();
    if (!name || name.length < 2) errs.full_name = "Full name must be at least 2 characters.";
    else if (!/^[A-Za-z\s.'-]+$/.test(name)) errs.full_name = "Full name must contain only letters.";

    if (!form.age) errs.age = "Age is required.";
    else { const a = Number(form.age); if (isNaN(a) || a < 1 || a > 120) errs.age = "Enter a valid age (1–120)."; }

    if (!form.phone.trim()) errs.phone = "Phone number is required.";
    else if (!validateBDPhone(form.phone)) errs.phone = "Enter a valid Bangladeshi number (e.g. 01XXXXXXXXX).";

    if (!isLoggedIn) {
      if (!form.email.trim()) errs.email = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(form.email)) errs.email = "Enter a valid email.";
    }

    if (!form.department) errs.department = "Please select a department.";
    
    if (!form.preferred_date) errs.preferred_date = "Please choose a date.";
    else {
      const selected = new Date(form.preferred_date);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (selected < today) errs.preferred_date = "Date cannot be in the past.";
    }

    if (!form.preferred_time) errs.preferred_time = "Please choose a time.";
    
    if (!isLoggedIn && !form.reason_for_visit.trim()) {
      errs.reason_for_visit = "Reason for visit is required.";
    }

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs = validateForm();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setError("");
    setSuccess(null);

    try {
      const payload = isLoggedIn
        ? form
        : { ...form, symptoms: form.symptoms || form.reason_for_visit, guest: true };

      const res  = await apiFetch("/api/appointments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Booking failed"); return; }
      setSuccess({
        patient_code:     data.patient.patient_code,
        appointment_code: data.appointment.appointment_code,
        status:           data.appointment.status,
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!authChecked) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
    </div>
  );

  return (
    <main className="min-h-screen">
      <PublicNavbar />

      <section className="mx-auto max-w-7xl px-4 pt-24 pb-10 sm:px-6">

        {/* ── Page header ── */}
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-teal-700">
            Book Appointment
          </p>
          <h1 className="mt-3 text-4xl font-black text-slate-950 sm:text-5xl">
            Request an Appointment
          </h1>
          <p className="mt-4 max-w-3xl text-slate-600">
            {isLoggedIn
              ? "Your details are pre-filled from your profile. Just pick a department, date and time."
              : "You're booking as a guest. Fill in all required details and we'll get back to you shortly."}
          </p>
        </div>

        {/* ── Auth status banner (logged-in only) ── */}
        {isLoggedIn && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-3.5">
            <UserCheck className="h-5 w-5 shrink-0 text-teal-600" />
            <p className="text-sm font-bold text-teal-800">
              Signed in — your profile details are pre-filled below. You can still edit them if needed.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ══════════════════════════════════════
              SECTION 1 — Patient Details
          ══════════════════════════════════════ */}
          <div className="rounded-3xl glass-card p-5 sm:p-8">
            <h2 className="text-2xl font-black text-slate-950">Patient Details</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              {isLoggedIn
                ? "Pre-filled from your profile — edit if needed."
                : "Please fill in all required fields marked with *"}
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <Label required htmlFor="full_name">Full Name</Label>
                <input
                  id="full_name"
                  className={`w-full rounded-2xl border p-4 outline-none focus:border-teal-500 ${fieldErrors.full_name ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                  placeholder="Full Name"
                  value={form.full_name}
                  onChange={set("full_name")}
                  readOnly={isLoggedIn}
                  aria-describedby={fieldErrors.full_name ? "err-full_name" : undefined}
                />
                {fieldErrors.full_name && <div id="err-full_name" aria-live="polite"><FieldError msg={fieldErrors.full_name} /></div>}
              </div>

              <div>
                <Label required htmlFor="age">Age</Label>
                <input
                  id="age"
                  className={`w-full rounded-2xl border p-4 outline-none focus:border-teal-500 ${fieldErrors.age ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                  placeholder="Eg: 25"
                  type="number"
                  min="1"
                  value={form.age}
                  onChange={set("age")}
                  readOnly={isLoggedIn}
                  aria-describedby={fieldErrors.age ? "err-age" : undefined}
                />
                {fieldErrors.age && <div id="err-age" aria-live="polite"><FieldError msg={fieldErrors.age} /></div>}
              </div>

              <div>
                <Label required htmlFor="phone">Phone Number</Label>
                <input
                  id="phone"
                  className={`w-full rounded-2xl border p-4 outline-none focus:border-teal-500 ${fieldErrors.phone ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                  placeholder="01XXXXXXXXX"
                  value={form.phone}
                  onChange={set("phone")}
                  readOnly={isLoggedIn}
                  aria-describedby={fieldErrors.phone ? "err-phone" : undefined}
                />
                {fieldErrors.phone && <div id="err-phone" aria-live="polite"><FieldError msg={fieldErrors.phone} /></div>}
              </div>

              <div>
                <Label required={!isLoggedIn} htmlFor="email">Email</Label>
                <input
                  id="email"
                  className={`w-full rounded-2xl border p-4 outline-none focus:border-teal-500 ${fieldErrors.email ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                  placeholder="you@example.com"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  readOnly={isLoggedIn}
                  aria-describedby={fieldErrors.email ? "err-email" : undefined}
                />
                {fieldErrors.email && <div id="err-email" aria-live="polite"><FieldError msg={fieldErrors.email} /></div>}
              </div>
            </div>

            {/* Guest-only: emergency contact */}
            {!isLoggedIn && (
              <div className="mt-5">
                <Label htmlFor="emergency_contact">Emergency Contact (Optional)</Label>
                <input
                  id="emergency_contact"
                  className="w-full rounded-2xl border border-slate-300 p-4 outline-none focus:border-teal-500"
                  placeholder="Name & phone of emergency contact"
                  value={form.emergency_contact}
                  onChange={set("emergency_contact")}
                />
              </div>
            )}

            <div className="mt-5">
              <Label htmlFor="description">Brief Description / Patient Concern</Label>
              <textarea
                id="description"
                className="min-h-24 w-full rounded-2xl border border-slate-300 p-4 outline-none focus:border-teal-500 resize-none"
                placeholder="Describe the concern briefly (optional for registered patients)"
                value={form.description}
                onChange={set("description")}
              />
            </div>
          </div>

          {/* ══════════════════════════════════════
              SECTION 2 — Appointment Details
          ══════════════════════════════════════ */}
          <div className="rounded-3xl glass-card p-5 sm:p-8">
            <h2 className="text-2xl font-black text-slate-950">Appointment Details</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              Choose your preferred department, date, and time.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="consultation_type"
                  checked={!form.is_video_consultation}
                  onChange={() => setForm(f => ({ ...f, is_video_consultation: false }))}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                />
                <span className="font-bold text-slate-700">In-Person Visit</span>
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="consultation_type"
                  checked={form.is_video_consultation}
                  onChange={() => setForm(f => ({ ...f, is_video_consultation: true }))}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                />
                <span className="font-bold text-slate-700">Video Consultation</span>
              </label>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <Label required htmlFor="department">Department</Label>
                <select
                  id="department"
                  className={`w-full rounded-2xl border p-4 outline-none focus:border-teal-500 ${fieldErrors.department ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                  value={form.department}
                  onChange={set("department")}
                  aria-describedby={fieldErrors.department ? "err-department" : undefined}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {fieldErrors.department && <div id="err-department" aria-live="polite"><FieldError msg={fieldErrors.department} /></div>}
              </div>

              <div>
                <Label required>Preferred Date</Label>
                <DatePicker
                  required
                  value={form.preferred_date}
                  onChange={v => {
                    setForm(f => ({ ...f, preferred_date: v, preferred_time: "" }));
                    if (fieldErrors.preferred_date) setFieldErrors(p => ({ ...p, preferred_date: "" }));
                  }}
                  placeholder="Select appointment date"
                />
                <FieldError msg={fieldErrors.preferred_date} />
              </div>

              <div>
                <Label required>Preferred Time</Label>
                <TimeSelect
                  value={form.preferred_time}
                  onChange={v => {
                    setForm(f => ({ ...f, preferred_time: v }));
                    if (fieldErrors.preferred_time) setFieldErrors(p => ({ ...p, preferred_time: "" }));
                  }}
                  selectedDate={form.preferred_date}
                />
                <FieldError msg={fieldErrors.preferred_time} />
              </div>

              <div>
                <Label>Doctor</Label>
                <input
                  disabled
                  className="w-full rounded-2xl border border-slate-200 bg-slate-100 p-4 text-slate-400 outline-none"
                  placeholder="Doctor will be assigned by admin"
                />
              </div>
            </div>

            {/* Guest-only: reason for visit (required) */}
            {!isLoggedIn ? (
              <div className="mt-5">
                <Label required htmlFor="reason_for_visit">Reason for Visit</Label>
                <textarea
                  id="reason_for_visit"
                  className={`min-h-28 w-full rounded-2xl border p-4 outline-none focus:border-teal-500 resize-none ${fieldErrors.reason_for_visit ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                  placeholder="Describe your symptoms or reason for the appointment"
                  value={form.reason_for_visit}
                  onChange={set("reason_for_visit")}
                  aria-describedby={fieldErrors.reason_for_visit ? "err-reason_for_visit" : undefined}
                />
                {fieldErrors.reason_for_visit && <div id="err-reason_for_visit" aria-live="polite"><FieldError msg={fieldErrors.reason_for_visit} /></div>}
              </div>
            ) : (
              <div className="mt-5">
                <Label htmlFor="symptoms">Symptoms / Additional Notes</Label>
                <textarea
                  id="symptoms"
                  className="min-h-28 w-full rounded-2xl border border-slate-300 p-4 outline-none focus:border-teal-500 resize-none"
                  placeholder="Symptoms / Reason for appointment (optional)"
                  value={form.symptoms}
                  onChange={set("symptoms")}
                />
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════
              Guest notice + CTA
          ══════════════════════════════════════ */}
          {!isLoggedIn && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
              <p className="font-bold text-slate-700 mb-1">📌 Guest Booking Notice</p>
              <p>
                After submission, our team will contact you at the phone/email provided to confirm your appointment.
                For faster service and to track your appointments online,{" "}
                <Link href="/patient/register" className="font-bold text-teal-700 hover:underline">
                  create a free account
                </Link>.
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</p>
          )}

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-teal-700 p-4 font-black text-white shadow-lg shadow-teal-700/20 hover:bg-teal-600 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting...</> : "Submit Appointment Request →"}
          </button>
        </form>
      </section>

      {/* ══════════════════════════════════════
          Success modal
      ══════════════════════════════════════ */}
      {success && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4">
          <div className="w-full max-w-lg rounded-3xl glass-card p-6 sm:p-8">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl font-black text-emerald-700">
              ✓
            </div>
            <h2 className="text-center text-3xl font-black text-slate-950">Appointment Submitted</h2>
            <p className="mt-3 text-center font-bold text-slate-600">
              {isLoggedIn
                ? "Your request has been sent to the admin for approval."
                : "Our team will contact you shortly to confirm your appointment."}
            </p>
            <div className="mt-6 space-y-3 rounded-3xl glass p-5">
              <p className="font-bold text-slate-700">
                Patient ID: <span className="font-black text-teal-700">{success.patient_code}</span>
              </p>
              <p className="font-bold text-slate-700">
                Appointment ID: <span className="font-black text-teal-700">{success.appointment_code}</span>
              </p>
              <p className="font-bold text-slate-700">
                Status: <span className="font-black text-yellow-700">{success.status}</span>
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {isLoggedIn ? (
                <>
                  <Link href={`/patient/journey?appt=${success.appointment_code}`}
                    className="rounded-2xl bg-teal-700 p-4 text-center font-black text-white hover:bg-teal-600">
                    View Journey
                  </Link>
                  <Link href="/patient/dashboard"
                    className="rounded-2xl border border-teal-300 p-4 text-center font-black text-teal-700 hover:bg-teal-50">
                    My Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/patient/register"
                    className="rounded-2xl bg-teal-700 p-4 text-center font-black text-white hover:bg-teal-600">
                    Create Account
                  </Link>
                  <Link href="/patient/track"
                    className="rounded-2xl border border-teal-300 p-4 text-center font-black text-teal-700 hover:bg-teal-50">
                    Track Appointment
                  </Link>
                </>
              )}
              <Link href="/"
                className="rounded-2xl border border-slate-300 p-4 text-center font-black text-slate-700 hover:border-teal-500 hover:text-teal-700">
                Back Home
              </Link>
            </div>
            <button onClick={() => setSuccess(null)}
              className="mt-4 w-full rounded-2xl bg-slate-100 p-3 font-black text-slate-700 hover:bg-slate-200">
              Close
            </button>
          </div>
        </div>
      )}

      <PublicFooter />
      <StickyHelpBar />
    </main>
  );
}
