"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDashboardRoute } from "@/lib/redirects";
import { Loader2, ShieldCheck, Stethoscope, FlaskConical, Pill, Zap, Users, CreditCard, Shield, ClipboardList, Video } from "lucide-react";

const roles = [
  { label:"Super Admin", icon:ShieldCheck, color:"text-purple-400" },
  { label:"Doctor",      icon:Stethoscope, color:"text-[#60b4ff]"  },
  { label:"Lab",         icon:FlaskConical,color:"text-blue-400"   },
  { label:"Pharmacist",  icon:Pill,        color:"text-orange-400" },
  { label:"Emergency",   icon:Zap,         color:"text-red-400"    },
  { label:"Admin",       icon:Users,       color:"text-cyan-400"   },
];

const portalLinks = [
  { label:"Doctor",      href:"/doctor/login",      icon:Stethoscope, color:"bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"         },
  { label:"Lab",         href:"/lab/login",         icon:FlaskConical,color:"bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100" },
  { label:"Pharmacy",    href:"/pharmacy/login",    icon:Pill,        color:"bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100" },
  { label:"Emergency",   href:"/emergency/login",   icon:Zap,         color:"bg-red-50 text-red-700 border-red-200 hover:bg-red-100"             },
  { label:"Billing",     href:"/billing/login",     icon:CreditCard,  color:"bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"},
  { label:"Insurance",   href:"/insurance/login",   icon:Shield,      color:"bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100" },
  { label:"Reception",   href:"/reception/login",   icon:ClipboardList,color:"bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100"        },
  { label:"Telemedicine",href:"/telemedicine/login",icon:Video,       color:"bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100"             },
  { label:"Admin",       href:"/admin/login",       icon:Users,       color:"bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"    },
];

export default function StaffLoginPage() {
  const [form, setForm]       = useState({ email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) return "Please enter a valid email address";
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return undefined;
  };

  const validateForm = (): boolean => {
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);
    setValidationErrors({ email: emailError, password: passwordError });
    return !emailError && !passwordError;
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); 
    setLoading(true); 
    setError("");
    
    // Validate form
    if (!validateForm()) {
      setTouched({ email: true, password: true });
      setLoading(false);
      return;
    }
    
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (signInError || !data.user) { setError("Invalid email or password."); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", data.user.id).single();
    if (!profile) { await supabase.auth.signOut(); setError("Staff profile not found. Contact Super Admin."); setLoading(false); return; }
    if (profile.role === "PATIENT") { await supabase.auth.signOut(); setError("This is the staff portal. Go to Patient Login."); setLoading(false); return; }
    if (!profile.is_active) { await supabase.auth.signOut(); setError("Your account is inactive. Contact Super Admin."); setLoading(false); return; }
    window.location.href = getDashboardRoute(profile.role);
  }

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email') {
      setValidationErrors(prev => ({ ...prev, email: validateEmail(form.email) }));
    } else {
      setValidationErrors(prev => ({ ...prev, password: validatePassword(form.password) }));
    }
  };

  return (
    <div className="flex min-h-screen">

      {/* Left dark panel */}
      <div className="relative hidden w-[52%] flex-col justify-between overflow-hidden p-12 lg:flex"
        style={{ background:"linear-gradient(135deg,#0C1A27 0%,#1B5FA8 60%,#0D7550 100%)" }}>
        <div className="pointer-events-none absolute inset-0 opacity-[.04]"
          style={{ backgroundImage:"linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)", backgroundSize:"48px 48px" }}/>
        <div className="pointer-events-none absolute inset-0 animate-aurora opacity-[.08]"
          style={{ background:"linear-gradient(270deg,#1B5FA8,#15A06B,#2A75C5,#1B5FA8)", backgroundSize:"400% 400%" }}/>

        {/* Logo */}
        <BrandLogo isLink={false} className="scale-125 origin-left" />

        {/* Centre */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white/80 mb-6">
            🔐 &nbsp;Secure Staff Portal
          </div>
          <h1 className="text-4xl font-black text-white leading-tight xl:text-5xl">
            Authorized access<br/>for medical staff
          </h1>
          <p className="mt-5 max-w-sm text-white/50 leading-7 text-sm">
            Each staff role is automatically routed to their dedicated dashboard after login.
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            {roles.map(({ label, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-bold text-white/70 backdrop-blur">
                <Icon className={`h-4 w-4 ${color}`} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/25">© 2026 Medilink Health Care Pvt Ltd. All rights reserved.</p>
      </div>

      {/* Right form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[var(--canvas)] px-6 py-12">
        {/* Mobile logo */}
        <BrandLogo isLink={false} className="mb-8 lg:hidden" />

        <div className="w-full max-w-md">
          <div className="mb-8 rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[var(--shadow)]">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--primary)] mb-4">
              🔐 Staff Login
            </div>
            <h2 className="font-display text-2xl font-black text-[var(--ink)]">Staff Login</h2>
            <p className="mt-1.5 text-sm text-[var(--ink-2)]">Sign in to access your dedicated portal</p>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[var(--shadow)]">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--ink-2)] mb-1.5">Staff Email</label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={set("email")}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@medilink.com" 
                  className={`input-field ${touched.email && validationErrors.email ? "border-red-400" : ""}`}
                />
                {touched.email && validationErrors.email && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">{validationErrors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-[var(--ink-2)] mb-1.5">Password</label>
                <input 
                  type="password" 
                  value={form.password} 
                  onChange={set("password")}
                  onBlur={() => handleBlur('password')}
                  placeholder="••••••••" 
                  className={`input-field ${touched.password && validationErrors.password ? "border-red-400" : ""}`}
                />
                {touched.password && validationErrors.password && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">{validationErrors.password}</p>
                )}
              </div>
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
              )}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-full py-4 font-black text-white transition disabled:opacity-60"
                style={{ background:"linear-gradient(135deg,#0C1A27,#1B5FA8)" }}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin"/> : "Login to Portal"}
              </button>
              <p className="text-center text-sm">
                <Link href="/forgot-password" className="font-semibold text-[var(--primary)] hover:underline">
                  Forgot password?
                </Link>
              </p>
            </form>
          </div>

          {/* Direct portal links */}
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow)]">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-3">Direct Portal Access</p>
            <div className="grid grid-cols-3 gap-2">
              {portalLinks.map(({ label, href, icon: Icon, color }) => (
                <Link key={href} href={href}
                  className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-black transition ${color}`}>
                  <Icon className="h-3.5 w-3.5 shrink-0"/>{label}
                </Link>
              ))}
            </div>
          </div>

          <p className="mt-5 text-center text-sm font-semibold text-[var(--ink-2)]">
            Are you a patient?{" "}
            <Link href="/patient/login" className="font-black text-[var(--primary)] hover:underline">Patient Portal →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
