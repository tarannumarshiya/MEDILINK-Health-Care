"use client";

import { useState } from "react";
import Link from "next/link";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import StickyHelpBar from "@/components/public/StickyHelpBar";
import { Info } from "lucide-react";

type Patient = {
  id: string;
  patient_code: string;
  full_name: string;
  age: number;
  phone: string;
  email: string | null;
  description: string | null;
};

type Appointment = {
  id: string;
  appointment_code: string;
  patient_id: string | null;
  patient_name: string;
  patient_phone: string;
  patient_email: string | null;
  department: string;
  preferred_date: string;
  preferred_time: string | null;
  symptoms: string | null;
  status: string;
  prescription_text: string | null;
  lab_report_url: string | null;
  lab_required: boolean | null;
  created_at: string;
  updated_at: string;
};

const statusSteps = [
  "PENDING",
  "APPROVED",
  "IN_PROGRESS",
  "PRESCRIPTION_READY",
  "LAB_REQUESTED",
  "LAB_PROCESSING",
  "LAB_COMPLETED",
  "PHARMACY_PENDING",
  "PHARMACY_FULFILLED",
  "INVOICE_GENERATED",
  "COMPLETED",
];

function getStatusIndex(status: string) {
  return statusSteps.indexOf(status);
}

export default function PatientTrackPage() {
  const [search, setSearch] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isLimited, setIsLimited] = useState(false);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setPatient(null);
    setAppointments([]);
    setIsLimited(false);

    try {
      const res = await fetch("/api/appointments/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ search }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "No record found");
        return;
      }

      setPatient(data.patient || null);
      setAppointments(data.appointments || []);
      setIsLimited(!!data.isLimited);
    } catch {
      setMessage("Something went wrong while tracking.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <PublicNavbar />

      <section className="mx-auto max-w-7xl px-4 pt-32 pb-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-teal-700">
            Patient Tracking
          </p>

          <h1 className="mt-3 text-4xl font-black text-slate-950 sm:text-5xl">
            Track Your Appointment
          </h1>

          <p className="mt-4 max-w-3xl text-slate-600">
            Enter your Patient ID, Appointment ID, phone number, or email to
            view your appointment status. No login required.
          </p>
        </div>

        <form
          onSubmit={handleTrack}
          className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl sm:p-8"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <input
              id="track-search"
              aria-label="Search by Patient ID, Appointment ID, Phone, or Email"
              className="rounded-2xl border border-slate-300 p-4 outline-none focus:border-teal-500"
              placeholder="PAT-2026-123456 / APT-2026-123456 / Phone / Email"
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
          {message && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
              {message}
            </div>
          )}
          {isLimited && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
              <Info className="mt-0.5 shrink-0 text-blue-700" size={24} />
              <div>
                <p className="font-bold text-blue-900">
                  Showing limited status-only response for privacy protection.
                </p>
                <p className="mt-1 text-sm text-blue-800">
                  To view full details, including symptoms and medical records, please track using your specific <strong>Patient ID (PAT-...)</strong> or <strong>Appointment ID (APT-...)</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {patient && (
          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-700">
              Patient Details
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Patient ID
                </p>
                <p className="mt-1 font-black text-teal-700">
                  {patient.patient_code}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Name
                </p>
                <p className="mt-1 font-black text-slate-900">
                  {patient.full_name}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Age
                </p>
                <p className="mt-1 font-black text-slate-900">
                  {patient.age}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                  Phone
                </p>
                <p className="mt-1 font-black text-slate-900">
                  {patient.phone}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6">
          {appointments.map((appointment) => {
            const currentIndex = getStatusIndex(appointment.status);

            return (
              <div
                key={appointment.id}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl"
              >
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-start">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">
                      {appointment.patient_name}
                    </h2>

                    <p className="mt-1 font-bold text-slate-600">
                      Appointment ID:{" "}
                      <span className="text-teal-700">
                        {appointment.appointment_code}
                      </span>
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-500">
                      {appointment.department}
                    </p>
                  </div>

                  <span className="rounded-full bg-yellow-50 px-4 py-2 text-sm font-black text-yellow-700">
                    {appointment.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Date
                    </p>
                    <p className="mt-1 font-black text-slate-900">
                      {appointment.preferred_date}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Time
                    </p>
                    <p className="mt-1 font-black text-slate-900">
                      {appointment.preferred_time || "Any time"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Phone
                    </p>
                    <p className="mt-1 font-black text-slate-900">
                      {appointment.patient_phone}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Created
                    </p>
                    <p className="mt-1 font-black text-slate-900">
                      {new Date(appointment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl bg-slate-50 p-5">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Symptoms / Reason
                  </p>
                  <p className="mt-2 font-bold text-slate-700">
                    {appointment.symptoms || "Not provided"}
                  </p>
                </div>

                <div className="mt-6">
                  <p className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-teal-700">
                    Appointment Progress
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {statusSteps.map((step, index) => (
                      <div
                        key={step}
                        className={`rounded-2xl border p-4 text-sm font-black ${
                          index === currentIndex
                            ? "border-teal-200 bg-teal-50 text-teal-700"
                            : "border-slate-200 bg-white text-slate-400"
                        }`}
                      >
                        {step.replaceAll("_", " ")}
                      </div>
                    ))}
                  </div>
                </div>

                {appointment.prescription_text && (
                  <div className="mt-6 rounded-3xl bg-emerald-50 p-5">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
                      Prescription
                    </p>
                    <p className="mt-3 whitespace-pre-wrap font-bold text-slate-800">
                      {appointment.prescription_text}
                    </p>
                  </div>
                )}

                {appointment.lab_report_url && (
                  <a
                    href={appointment.lab_report_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-block rounded-2xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-600"
                  >
                    View Lab Report
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {appointments.length === 0 && !message && (
          <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow">
            <p className="font-bold text-slate-500">
              Enter your details above to track your appointment.
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