"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  CalendarCheck,
  Stethoscope,
  Building2,
  Microscope,
  Pill,
  HeartPulse,
  Ambulance,
} from "lucide-react";
import { Tilt3D } from "@/components/public/Tilt3D";
import { SectionHeading } from "@/components/public/SectionHeading";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

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

export function Services() {
  return (
    <section id="services" className="relative overflow-hidden py-16">
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Our Services"
          title="Comprehensive Care, One Platform"
          description="Explore Medilink services with clear benefits and appointment access."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {services.map(({ Icon, title, desc, benefits, bg }) => (
            <motion.div key={title} variants={fadeUp}>
              <Tilt3D className="h-full">
                <Link href="/appointment" className="block h-full">
                  <div
                    className="group relative flex h-full overflow-hidden rounded-3xl transition-all duration-300 hover:shadow-glow"
                    style={{ minHeight: "360px" }}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url(${bg})` }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/20" />

                    <div
                      className="absolute inset-0 opacity-70 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(0,84,140,.55), rgba(0,84,140,.12))",
                      }}
                    />

                    <div className="relative z-10 flex h-full flex-col justify-end p-7 text-white">
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

                      <div
                        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-primary-foreground transition group-hover:opacity-90"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        <CalendarCheck size={17} />
                        Book Appointment
                      </div>
                    </div>
                  </div>
                </Link>
              </Tilt3D>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}