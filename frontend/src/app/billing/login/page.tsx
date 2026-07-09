"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { useState } from "react";
import { Loader2, ArrowLeft, CreditCard, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validateLoginForm } from "@/lib/validate";
import { useRouter } from "next/navigation";

export default function BillingLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateLoginForm(form.email, form.password);
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (err || !data.user) { setError("Invalid credentials."); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", data.user.id).single();
    const allowed = ["BILLING", "HOSPITAL_ADMIN", "SUPER_ADMIN"];
    if (!profile || !allowed.includes(profile.role) || !profile.is_active) {
      await supabase.auth.signOut();
      setError(!allowed.includes(profile?.role ?? "") ? "Access denied. Billing staff only." : "Account inactive. Contact Super Admin.");
      setLoading(false);
      return;
    }
    router.push("/billing/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Link href="/login" className="mb-8 flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Staff Login
        </Link>
        <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-2xl">
          <div className="flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-center text-white">
            <BrandLogo isLink={false} className="mb-2 scale-110" />
            <h1 className="text-3xl font-black">Billing Portal</h1>
            <p className="text-emerald-100">Finance & Revenue Management</p>
          </div>
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-500">Email</label>
                <input id="email" autoComplete="email" type="email" required value={form.email} onChange={set("email")} placeholder="billing@medilink.com"
                  className="mt-2 w-full rounded-2xl border border-slate-300 p-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-colors" />
              </div>
              <div>
                <label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-500">Password</label>
                <div className="relative mt-2">
                  <input id="password" autoComplete="current-password" type={showPw ? "text" : "password"} required value={form.password} onChange={set("password")} placeholder="••••••••"
                    className="w-full rounded-2xl border border-slate-300 p-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-colors pr-11" />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">{error}</div>}
              
              <div className="flex justify-between items-center text-xs">
                <Link href="/forgot-password" className="font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <button type="submit" disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 p-4 font-black text-white transition hover:bg-slate-800 active:scale-[0.98] disabled:opacity-60">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In to Billing"}
              </button>
            
              <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                ?? Authorized personnel only
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
