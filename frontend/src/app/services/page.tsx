"use client";

import Link from "next/link";
import {
  CalendarCheck,
  Stethoscope,
  Building2,
  Microscope,
  Pill,
  HeartPulse,
  Ambulance,
  ShieldCheck,
  Clock,
  FileText,
  Users,
} from "lucide-react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { SectionHeading } from "@/components/public/SectionHeading";

const services = [
  {
    Icon: Stethoscope,
    title: "Online Doctor Consultation",
    desc: "Consult certified doctors through a secure digital consultation flow.",
    benefits: ["Video consultation", "Doctor guidance", "Digital prescription"],
    bg: "/images/service-telemedicine.jpg",
  },
  {
    Icon: Building2,
    title: "Hospital Booking",
    desc: "Book hospital appointments and services through one connected system.",
    benefits: ["Easy appointment booking", "Department selection", "Doctor assignment"],
    bg: "/images/service-hospital-booking.jpg",
  },
  {
    Icon: Microscope,
    title: "Laboratory Testing",
    desc: "Schedule lab tests and access diagnostic support with better visibility.",
    benefits: ["Test booking", "Sample workflow", "Report support"],
    bg: "/images/service-laboratory.jpg",
  },
  {
    Icon: Pill,
    title: "Pharmacy Services",
    desc: "Access medicine availability and prescription-based pharmacy services.",
    benefits: ["Medicine catalogue", "Prescription upload", "Order support"],
    bg: "/images/service-pharmacy.jpg",
  },
  {
    Icon: HeartPulse,
    title: "Health Packages",
    desc: "Explore preventive health checkups and wellness plans.",
    benefits: ["Package details", "Pricing visibility", "Appointment CTA"],
    bg: "/images/service-health-packages.jpg",
  },
  {
    Icon: Ambulance,
    title: "Emergency Support",
    desc: "Get quick access to urgent healthcare and emergency service support.",
    benefits: ["Emergency access", "Quick response", "Patient support"],
    bg: "/images/service-emergency.jpg",
  },
];

const whyChoose = [
  {
    Icon: Users,
    title: "Qualified Specialists",
    desc: "Consult experienced healthcare professionals across multiple departments.",
  },
  {
    Icon: Clock,
    title: "Faster Appointments",
    desc: "Book healthcare services online without unnecessary waiting or confusion.",
  },
  {
    Icon: ShieldCheck,
    title: "Secure Care Flow",
    desc: "Patient information and service workflows are handled with better control.",
  },
  {
    Icon: FileText,
    title: "Complete Support",
    desc: "Consultation, diagnostics, pharmacy, emergency, and packages in one platform.",
  },
];

const workflow = [
  {
    step: "1",
    title: "Choose a Service",
    desc: "Select consultation, laboratory, pharmacy, emergency, or health package.",
  },
  {
    step: "2",
    title: "Book Appointment",
    desc: "Schedule your visit with the right department or healthcare service.",
  },
  {
    step: "3",
    title: "Receive Care",
    desc: "Connect with healthcare professionals and receive guided support.",
  },
  {
    step: "4",
    title: "Follow-up Support",
    desc: "Continue care with reports, pharmacy, prescriptions, and follow-ups.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <PublicNavbar />

      <main className="pt-28">
        <section className="relative overflow-hidden py-16">
          <div className="relative mx-auto max-w-7xl px-6 text-center">
            <span className="inline-flex rounded-full bg-primary/10 px-5 py-2 text-sm font-bold uppercase tracking-[0.25em] text-primary">
              Services
            </span>

            <h1 className="mx-auto mt-6 max-w-4xl font-display text-4xl font-extrabold leading-tight text-foreground sm:text-6xl">
              Complete Healthcare Services in One Platform
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              Medilink Health Care connects patients, doctors, hospitals,
              laboratories, pharmacies, emergency services, and health packages
              through one secure digital healthcare ecosystem.
            </p>
          </div>
        </section>

        <section className="relative overflow-hidden py-10">
          <div className="relative mx-auto max-w-7xl px-6">
            <SectionHeading
              eyebrow="Our Services"
              title="Comprehensive Care, One Platform"
              description="Explore all healthcare services with clear benefits and appointment access."
            />

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map(({ Icon, title, desc, benefits, bg }) => (
                <div
                  key={title}
                  className="group relative flex min-h-[370px] overflow-hidden rounded-3xl transition-all duration-300 hover:shadow-glow"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${bg})` }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/20" />

                  <div
                    className="absolute inset-0 opacity-70"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,84,140,.55), rgba(0,84,140,.12))",
                    }}
                  />

                  <div className="relative z-10 flex h-full w-full flex-col justify-end p-7 text-white">
                    <div
                      className="mb-5 grid h-14 w-14 place-items-center rounded-2xl"
                      style={{
                        background: "var(--gradient-primary)",
                        boxShadow: "var(--shadow-glow)",
                      }}
                    >
                      <Icon size={28} strokeWidth={1.8} />
                    </div>

                    <h3 className="font-display text-2xl font-bold">{title}</h3>

                    <p className="mt-3 text-sm leading-6 text-white/90">{desc}</p>

                    <ul className="mt-5 space-y-2">
                      {benefits.map((item) => (
                        <li key={item} className="text-sm font-medium text-white/90">
                          ✓ {item}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/appointment"
                      className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      <CalendarCheck size={17} />
                      Book Appointment
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6">
            <SectionHeading
              eyebrow="Why Choose Us"
              title="Healthcare Services You Can Trust"
              description="Every Medilink service is designed around quality care, accessibility, and patient convenience."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {whyChoose.map(({ Icon, title, desc }) => (
                <div key={title} className="glass-card rounded-3xl p-6">
                  <Icon className="text-primary" size={28} />
                  <h3 className="mt-5 font-display text-xl font-bold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <SectionHeading
              eyebrow="Service Workflow"
              title="How Medilink Works"
              description="Getting healthcare support is simple, organized, and convenient."
            />

            <div className="mt-14 grid gap-6 md:grid-cols-4">
              {workflow.map(({ step, title, desc }) => (
                <div key={step} className="glass-card rounded-3xl p-6">
                  <h2 className="font-display text-4xl font-extrabold text-primary">
                    {step}
                  </h2>
                  <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl rounded-3xl glass-card p-12 text-center">
            <h2 className="font-display text-4xl font-bold text-foreground">
              Ready to Get Started?
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Book your appointment today and access reliable healthcare support
              through Medilink Health Care.
            </p>

            <Link
              href="/appointment"
              className="mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-4 font-bold text-primary-foreground transition hover:opacity-90"
              style={{ background: "var(--gradient-primary)" }}
            >
              <CalendarCheck size={18} />
              Book Appointment
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}