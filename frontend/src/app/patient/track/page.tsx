"use client";

import { useState } from "react";
import Link from "next/link";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import StickyHelpBar from "@/components/public/StickyHelpBar";
import { Info, ShieldAlert } from "lucide-react";

type TrackResult = {
  success: boolean;
  data?: {
    appointment_reference: string;
    status: string;
    appointment_date: string;
    department: string;
    demo_data: boolean;
  };
  error?: string;
};

export default function PatientTrackPage() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<TrackResult["data"] | null>(null);
  const [notFound, setNotFound] = useState(false);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setResult(null);
    setNotFound(false);

    try {
      const res = await fetch("/api/appointments/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ search }),
      });

      const data: TrackResult = await res.json();

      if (!res.ok) {
        setNotFound(true);
        setMessage(data.error || "No record found");
        return;
      }

      setResult(data.data || null);
    } catch {
      setMessage("Something went wrong while tracking.");
    } finally {
      setLoading(false);
    }
  }

  const demo = result?.demo_data;

  return (
    <main className="min-h-screen bg-slate-100">
      <PublicNavbar />

      <section className="mx-auto max-w-7xl px-4 pt-32 pb-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-teal-700">
            Appointment Tracking
          </p>

          <h1 className="mt-3 text-4xl font-black text-slate-950 sm:text-5xl">
            Track Your Appointment
          </h1>

          <p className="mt-4 max-w-3xl text-slate-600">
            Enter your appointment reference to check its current status. To protect
            your privacy, only limited status information is shown here.
          </p>
        </div>

        <form
          onSubmit={handleTrack}
          className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl sm:p-8"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <input
              id="track-search"
              aria-label="Appointment reference"
              className="rounded-2xl border border-slate-300 p-4 outline-none focus:border-teal-500"
              placeholder="APT-2026-123456"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              required
            />

            <button
              disabled={loading}
              className="rounded-2xl bg-teal-700 px-8 py-4 font-black text-white hover:bg-teal-600 disabled:opacity-60"
            >
              {loading ? "Searching..." : "Track Status"}
            </button>
          </div>
        </form>

        <div aria-live="polite">
          {message && notFound && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
              {message}
            </div>
          )}

          {demo && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5">
              <ShieldAlert className="mt-0.5 shrink-0 text-amber-700" size={24} />
              <div>
                <p className="font-bold text-amber-900">
                  Demo data — privacy-limited status
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  For your privacy this public tracker returns only the appointment
                  reference, department, preferred date and status. This is trial
                  (demo) data; your records were saved to your authenticated
                  dashboard. Production tracking will require OTP or a verified login.
                </p>
              </div>
            </div>
          )}
        </div>

        {result && (
          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-700">
              Appointment Status
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Reference
                </p>
                <p className="mt-1 font-black text-teal-700">
                  {result.appointment_reference}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Department
                </p>
                <p className="mt-1 font-black text-slate-900">{result.department}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Preferred Date
                </p>
                <p className="mt-1 font-black text-slate-900">
                  {result.appointment_date}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Status
                </p>
                <p className="mt-1 inline-block rounded-full bg-yellow-50 px-4 py-1 font-black text-yellow-700">
                  {result.status}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-2 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              <Info className="mt-0.5 shrink-0" size={18} />
              <p>
                Full details, including your prescriptions and medical records, are only
                available to you after signing in to your patient dashboard.
              </p>
            </div>
          </div>
        )}

        {!result && !message && (
          <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow">
            <p className="font-bold text-slate-500">
              Enter your appointment reference above to track its status.
            </p>
            <Link
              href="/appointment"
              className="mt-5 inline-block rounded-2xl bg-teal-700 px-6 py-4 font-black text-white"
            >
              Book New Appointment
            </Link>
          </div>
        )}
      </section>

      <PublicFooter />
      <StickyHelpBar />
    </main>
  );
}