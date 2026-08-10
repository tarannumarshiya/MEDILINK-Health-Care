"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validateRegisterForm, validateBDPhone } from "@/lib/validate";
import BrandLogo from "@/components/BrandLogo";

function ECGLine({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 48" fill="none" className={className} aria-hidden>
      <path d="M0 24 L50 24 L63 6 L76 42 L89 4 L102 42 L115 24 L165 24 L178 6 L191 42 L204 4 L217 42 L230 24 L320 24"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="animate-ecg-loop" strokeDasharray="700"/>
    </svg>
  );
}



function PatientRegisterInner() {
  const params = useSearchParams();
  const fromBooking = !!(params.get("name") || params.get("phone"));

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone]         = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [form, setForm] = useState({
    full_name: params.get("name")  ?? "",
    email:     params.get("email") ?? "",
    phone:     params.get("phone") ?? "",
    age: "", password: "",
    gender: "", address: "",
    insurance_provider: "", insurance_policy_number: "", medical_history: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    // Clear field error when user starts correcting
    if (fieldErrors[k]) setFieldErrors(prev => ({ ...prev, [k]: "" }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    // Per-field validation
    const errs: Record<string, string> = {};
    if (!form.full_name.trim() || form.full_name.trim().length < 2) errs.full_name = "Full name must be at least 2 characters.";
    else if (!/^[A-Za-z\s.\'\-]+$/.test(form.full_name.trim())) errs.full_name = "Name must contain only letters.";
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(form.email.toLowerCase())) errs.email = "Enter a valid email (e.g. you@example.com).";
    if (!form.phone.trim()) errs.phone = "Phone number is required.";
    else if (!validateBDPhone(form.phone)) errs.phone = "Enter a valid Bangladeshi number (e.g. 01XXXXXXXXX).";
    if (!form.age) errs.age = "Age is required.";
    else { const age = Number(form.age); if (isNaN(age) || age < 1 || age > 120) errs.age = "Enter a valid age (1–120)."; }
    if (!form.gender) errs.gender = "Please select a gender.";
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 8) errs.password = "Password must be at least 8 characters.";
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) errs.password = "Password must contain letters and at least one number.";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true); setError("");
    const supabase = createClient();
    const { full_name, email, phone, age, password, gender, address, insurance_provider, insurance_policy_number, medical_history } = form;
    const { data, error: err } = await supabase.auth.signUp({ email, password, options:{ data:{ full_name, phone, role:"PATIENT" } } });
    if (err || !data.user) { setError(err?.message || "Sign-up failed."); setLoading(false); return; }
    const userId = data.user.id;
    await supabase.from("profiles").insert({ id:userId, full_name, email, role:"PATIENT", is_active:true });
    const { data: existing } = await supabase.from("patients").select("id").or(`phone.eq.${phone},email.eq.${email}`).is("profile_id",null).maybeSingle();
    const extra = { gender:gender||null, address:address||null, insurance_provider:insurance_provider||null, insurance_policy_number:insurance_policy_number||null, medical_history:medical_history||null };
    if (existing) {
      await supabase.from("patients").update({ profile_id:userId, full_name, age:Number(age), email, ...extra }).eq("id", existing.id);
    } else {
      const secureNum = typeof window !== 'undefined' && window.crypto ? (100000 + (window.crypto.getRandomValues(new Uint32Array(1))[0] % 900000)) : (100000 + (Date.now() % 900000));
      await supabase.from("patients").insert({ profile_id:userId, patient_code:"PAT-"+new Date().getFullYear()+"-"+secureNum, full_name, age:Number(age), phone, email, ...extra });
    }
    setDone(true);
  };

  if (done) return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)] p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-[var(--shadow-lg)] border border-[var(--line)]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-2xl"
          style={{ background:"var(--grad-primary)", boxShadow:"var(--shadow-glow)" }}>✓</div>
        <h2 className="font-display text-2xl font-black text-[var(--ink)]">Account Created!</h2>
        <p className="mt-3 text-[var(--ink-2)] leading-6">
          Welcome to Medilink! A confirmation email has been sent to{" "}
          <span className="font-black text-[var(--primary)]">{form.email}</span>.
          Please check your inbox (and spam folder) to verify your account.
        </p>
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-left">
          <p className="text-xs font-black text-blue-800 mb-1">📧 Check your email</p>
          <p className="text-xs text-blue-600 leading-5">
            Click the link in the email to confirm your address, then sign in to access your health dashboard.
          </p>
        </div>
        <Link href="/patient/login" className="btn-primary mt-7 block rounded-full py-4 font-black text-white">Go to Login</Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">

      {/* Left form */}
      <div className="relative flex w-full flex-col justify-center px-8 py-12 lg:w-[48%] xl:px-16 bg-white overflow-y-auto">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full opacity-30 animate-blob blur-2xl"
          style={{ background:"radial-gradient(circle,var(--accent-soft),transparent 70%)" }}/>
        <div className="pointer-events-none absolute -right-10 bottom-10 h-56 w-56 rounded-full opacity-25 animate-blob-2 blur-2xl"
          style={{ background:"radial-gradient(circle,var(--primary-soft),transparent 70%)" }}/>

        <div className="relative mx-auto w-full max-w-md">
          <BrandLogo className="mb-8" />

          <div className="mb-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--accent)] mb-4">
              ✚ New Patient
            </div>
            <h1 className="font-display text-3xl font-black text-[var(--ink)]">Create your account</h1>
            <p className="mt-2 text-sm text-[var(--ink-2)]">Join 50,000+ patients managing their health with Medilink.</p>
            {fromBooking && (
              <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700">
                🔗 Your appointment details are pre-filled. Just add a password — your booking links automatically.
              </div>
            )}
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block mb-1.5 text-xs font-black uppercase tracking-widest text-[var(--ink-2)]">Full Name <span className="text-red-500">*</span></label>
              <input id="full_name" type="text" placeholder="Dr. / Mr. / Ms. Full Name" autoComplete="name" className={`input-field ${fieldErrors.full_name ? "border-red-400" : ""}`} value={form.full_name} onChange={set("full_name")}/>
              <div aria-live="polite">
                {fieldErrors.full_name && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.full_name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block mb-1.5 text-xs font-black uppercase tracking-widest text-[var(--ink-2)]">Phone <span className="text-red-500">*</span></label>
                <input id="phone" type="text" placeholder="01XXXXXXXXX or +8801XXXXXXXXX" autoComplete="tel" className={`input-field ${fieldErrors.phone ? "border-red-400" : ""}`} value={form.phone} onChange={set("phone")}/>
                <div aria-live="polite">
                  {fieldErrors.phone ? <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.phone}</p> : <p className="mt-1 text-[10px] text-[var(--ink-2)] opacity-70">Prefix: 013–019 (GP, Robi, BL, Teletalk)</p>}
                </div>
              </div>
              <div>
                <label htmlFor="age" className="block mb-1.5 text-xs font-black uppercase tracking-widest text-[var(--ink-2)]">Age <span className="text-red-500">*</span></label>
                <input id="age" type="number" min={1} placeholder="Eg: 25" className={`input-field ${fieldErrors.age ? "border-red-400" : ""}`} value={form.age} onChange={set("age")}/>
                <div aria-live="polite">{fieldErrors.age && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.age}</p>}</div>
              </div>
            </div>
            <div>
              <label htmlFor="gender" className="block mb-1.5 text-xs font-black uppercase tracking-widest text-[var(--ink-2)]">Gender <span className="text-red-500">*</span></label>
              <select id="gender" className={`input-field ${fieldErrors.gender ? "border-red-400" : ""}`} value={form.gender} onChange={set("gender")}>
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other / Prefer not to say</option>
              </select>
              <div aria-live="polite">{fieldErrors.gender && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.gender}</p>}</div>
            </div>
            <div>
              <label htmlFor="email" className="block mb-1.5 text-xs font-black uppercase tracking-widest text-[var(--ink-2)]">Email Address <span className="text-red-500">*</span></label>
              <input id="email" type="email" placeholder="you@example.com" autoComplete="email" className={`input-field ${fieldErrors.email ? "border-red-400" : ""}`} value={form.email} onChange={set("email")}/>
              <div aria-live="polite">{fieldErrors.email && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.email}</p>}</div>
            </div>
            <div>
              <label htmlFor="address" className="block mb-1.5 text-xs font-black uppercase tracking-widest text-[var(--ink-2)]">Address</label>
              <input id="address" type="text" placeholder="House No, Street, City" autoComplete="street-address" className="input-field" value={form.address} onChange={set("address")}/>
            </div>
            <div>
              <label htmlFor="password" className="block mb-1.5 text-xs font-black uppercase tracking-widest text-[var(--ink-2)]">Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input id="password" type={showPw ? "text" : "password"} autoComplete="new-password" placeholder="Min. 8 characters" className={`input-field pr-11 ${fieldErrors.password ? "border-red-400" : ""}`} value={form.password} onChange={set("password")}/>
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div aria-live="polite">{fieldErrors.password && <p className="mt-1 text-xs font-semibold text-red-500">{fieldErrors.password}</p>}</div>
            </div>

            <div className="border-t border-[var(--line)] pt-4">
              <p className="text-xs font-black uppercase tracking-widest text-[var(--muted)] mb-3">Insurance Details (Optional)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="insurance_provider" className="block mb-1.5 text-xs font-black uppercase tracking-widest text-[var(--ink-2)]">Provider</label>
                  <input id="insurance_provider" type="text" placeholder="e.g. Star Health" className="input-field" value={form.insurance_provider} onChange={set("insurance_provider")}/>
                </div>
                <div>
                  <label htmlFor="insurance_policy_number" className="block mb-1.5 text-xs font-black uppercase tracking-widest text-[var(--ink-2)]">Policy No.</label>
                  <input id="insurance_policy_number" type="text" placeholder="POL-123456" className="input-field" value={form.insurance_policy_number} onChange={set("insurance_policy_number")}/>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="medical_history" className="block mb-1.5 text-xs font-black uppercase tracking-widest text-[var(--ink-2)]">Medical History (Optional)</label>
              <textarea id="medical_history" placeholder="e.g. Diabetes, Hypertension, past surgeries..." rows={3}
                className="input-field resize-none" value={form.medical_history} onChange={set("medical_history")}/>
            </div>

            <div aria-live="polite">
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 mb-4">{error}</div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full rounded-full py-4 font-black text-white flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="h-5 w-5 animate-spin"/> : "Create Account →"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-[var(--ink-2)]">
            Already have an account?{" "}
            <Link href="/patient/login" className="font-black text-[var(--primary)] hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-1 items-center justify-center"
        style={{ background:"linear-gradient(135deg,var(--accent-deep) 0%,var(--accent) 45%,var(--primary) 100%)" }}>
        <div className="pointer-events-none absolute inset-0 opacity-[.05]"
          style={{ backgroundImage:"linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize:"36px 36px" }}/>
        <div className="pointer-events-none absolute -right-16 top-20 h-64 w-64 rounded-full bg-white opacity-10 animate-blob"/>
        <div className="pointer-events-none absolute -left-10 bottom-16 h-48 w-48 rounded-full bg-white opacity-8 animate-blob-2"/>

        <div className="relative px-10 text-center">
          <div className="glass rounded-3xl px-8 py-8 shadow-[0_28px_72px_rgba(0,0,0,.28)] mb-6">
            <p className="text-3xl mb-4 animate-heartbeat inline-block">❤️</p>
            <h2 className="font-display text-2xl font-black text-white mb-2">Your Health,<br/>Connected.</h2>
            <p className="text-sm text-white/60 mb-6 leading-6">Everything you need to manage your health in one place.</p>

            <div className="space-y-3 text-left">
              {[
                { icon:"📋", label:"Easy appointment booking"     },
                { icon:"💊", label:"Digital prescriptions"        },
                { icon:"🧪", label:"Lab results online"           },
                { icon:"🛡️", label:"Insurance claim management"  },
                { icon:"📹", label:"Secure video consultations"   },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3 glass-dark rounded-2xl px-4 py-2.5">
                  <span className="text-base">{f.icon}</span>
                  <p className="text-sm font-semibold text-white">{f.label}</p>
                  <span className="ml-auto text-[var(--accent)] text-xs font-black">✓</span>
                </div>
              ))}
            </div>

            <div className="mt-5 overflow-hidden rounded-xl bg-white/8 px-3 py-2">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">ECG — Rhythm Normal</p>
              <ECGLine className="h-8 w-full text-white/55"/>
            </div>
          </div>

          <div className="flex justify-center flex-wrap gap-2">
            {["Free Account","Instant Access","Secure Data"].map(h => (
              <div key={h} className="glass rounded-full px-3.5 py-1.5 text-[11px] font-bold text-white">{h}</div>
            ))}
          </div>

          <div className="glass absolute -left-5 top-8 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-xl">
            <span className="relative flex h-2 w-2">
              <span className="absolute h-full w-full rounded-full bg-white opacity-60" style={{ animation:"ping-soft 1.4s infinite" }}/>
              <span className="relative h-2 w-2 rounded-full bg-white"/>
            </span>
            24×7 Care
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default function PatientRegisterPage() {
  return (
    <Suspense fallback={null}>
      <PatientRegisterInner />
    </Suspense>
  );
}
