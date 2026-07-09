"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { Phone, Ambulance, Clock, MapPin, AlertTriangle, HeartPulse, Bed } from "lucide-react";

const emergencyContacts = [
  { label: "Emergency Hotline",  number: "+880 1999 123456", icon: Phone,      color: "#ef4444", note: "24/7 — Call immediately for life-threatening situations" },
  { label: "Ambulance Dispatch", number: "+880 1712 889911", icon: Ambulance,  color: "#f97316", note: "GPS-tracked ambulances prioritized for fast response" },
  { label: "General Helpline",   number: "+880 1712 889900", icon: HeartPulse, color: "#0ea5e9", note: "Mon–Sat 8am–8pm for non-emergency enquiries" },
];

const steps = [
  { step: "1", title: "Call us immediately",      desc: "Dial our 24/7 emergency number. Our team picks up within shortest Possible Time." },
  { step: "2", title: "Share your location",       desc: "Tell us your exact address or drop a live location pin." },
  { step: "3", title: "We dispatch an ambulance", desc: "Nearest unit is dispatched in under 2 minutes with trained paramedics." },
  { step: "4", title: "Hospital is pre-notified", desc: "The ER team is alerted before you arrive so they're ready." },
];

type WardStatus = { total: number; available: number };

export default function EmergencyPage() {
  const [wardStatus, setWardStatus]     = useState<Record<string, WardStatus>>({});
  const [availableBeds, setAvailableBeds] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/emergency/public-status")
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setAvailableBeds(data.availableBeds);
          setWardStatus(data.wards ?? {});
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-32 pb-16">
          <div className="absolute inset-0 bg-foreground/5" />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <div
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl"
              style={{ background: "linear-gradient(135deg,#ef4444,#f97316)", boxShadow: "0 0 40px rgba(239,68,68,0.4)" }}
            >
              <AlertTriangle className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Emergency Services
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground leading-relaxed">
              24/7 Emergency Care · Trauma · Critical Care · Ambulance Dispatch
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="tel:+8801999123456"
                className="inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-lg font-black text-white transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#ef4444,#f97316)", boxShadow: "0 8px 32px rgba(239,68,68,0.4)" }}
              >
                <Phone className="h-6 w-6" /> Call Emergency Now
              </a>
              {availableBeds !== null && (
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3">
                  <Bed className="h-5 w-5 text-emerald-600" />
                  <span className="font-bold text-emerald-700">{availableBeds} beds available now</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Contact cards ── */}
        <section className="mx-auto max-w-5xl px-6 py-10">
          <div className="grid gap-6 sm:grid-cols-3">
            {emergencyContacts.map(({ label, number, icon: Icon, color, note }) => (
              <a
                key={label}
                href={`tel:${number.replace(/\s/g, "")}`}
                className="group flex flex-col gap-4 rounded-3xl glass-card p-7 transition hover:-translate-y-1 hover:shadow-glow"
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl text-white"
                  style={{ background: `linear-gradient(135deg,${color},${color}bb)` }}>
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="mt-1 font-display text-xl font-extrabold text-foreground group-hover:text-primary transition-colors">{number}</p>
                  <p className="mt-2 text-sm text-muted-foreground leading-5">{note}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ── Bed Availability ── */}
        {Object.keys(wardStatus).length > 0 && (
          <section className="mx-auto max-w-5xl px-6 py-6">
            <h2 className="text-center font-display text-2xl font-bold text-foreground mb-6">Live Bed Availability</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {Object.entries(wardStatus).map(([ward, status]) => (
                <div key={ward} className="rounded-2xl glass-card p-5 text-center">
                  <p className="font-bold text-foreground text-sm">{ward} Ward</p>
                  <p className="mt-2 font-display text-3xl font-black" style={{ color: status.available > 0 ? "#059669" : "#dc2626" }}>
                    {status.available}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">of {status.total} available</p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((status.available / status.total) * 100)}%`,
                        background: status.available > 0 ? "#059669" : "#dc2626",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── What happens when you call ── */}
        <section className="mx-auto max-w-4xl px-6 py-12">
          <h2 className="text-center font-display text-2xl font-bold text-foreground mb-10">What happens when you call</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {steps.map(({ step, title, desc }) => (
              <div key={step} className="flex gap-5 rounded-3xl glass-card p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-extrabold text-white"
                  style={{ background: "linear-gradient(135deg,#ef4444,#f97316)" }}>
                  {step}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Quick info ── */}
        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="grid gap-6 rounded-3xl glass-card p-8 sm:grid-cols-3">
            <div className="flex gap-4">
              <Clock className="h-6 w-6 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-bold text-foreground">24/7 Availability</p>
                <p className="mt-1 text-sm text-muted-foreground">Emergency services never close — holidays included.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Ambulance className="h-6 w-6 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-bold text-foreground">Priority Dispatch</p>
                <p className="mt-1 text-sm text-muted-foreground">GPS-dispatched ambulances across the city for fast response.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <MapPin className="h-6 w-6 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-bold text-foreground">Walk-In ER Open 24/7</p>
                <p className="mt-1 text-sm text-muted-foreground">Dhanmondi 27, Dhaka — no appointment needed.</p>
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/contact" className="text-sm font-semibold text-primary hover:underline">
              Non-emergency? Contact us here →
            </Link>
          </div>
        </section>

      </main>
      <PublicFooter />
    </>
  );
}
