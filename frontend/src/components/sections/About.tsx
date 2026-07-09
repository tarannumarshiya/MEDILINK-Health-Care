"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { CheckCircle2, Quote, ShieldCheck, Users, Building2 } from "lucide-react";
import { Tilt3D } from "@/components/public/Tilt3D";
import { SectionHeading } from "@/components/public/SectionHeading";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const highlights = [
  "Patient-first digital healthcare experience",
  "Doctors, hospitals, diagnostics, and pharmacy connected",
  "Transparent booking, consultation, and care support",
];

const trustCards = [
  { Icon: ShieldCheck, label: "Trust-focused care" },
  { Icon: Users, label: "Patient-oriented workflow" },
  { Icon: Building2, label: "Dhaka-based healthcare network" },
];

export function About() {
  return (
    <section id="about" className="relative overflow-hidden py-16">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="About Us"
          title="Medilink Health Care"
          description="A connected digital healthcare platform built to make patient care simpler, faster, and more reliable."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-12 grid items-center gap-10 lg:grid-cols-2"
        >
          <motion.div variants={fadeUp}>
            <Tilt3D intensity={8}>
              <div className="relative rounded-3xl glass-card p-3">
                <Image
                  src="/director.jpg"
                  alt="Dr. Arif Mahmud, Founder and Managing Director of Medilink Health Care"
                  width={900}
                  height={900}
                  className="h-[420px] w-full rounded-2xl object-cover object-top"
                  priority
                />

                <div
                  className="absolute bottom-6 left-6 right-6 flex items-center gap-3 rounded-2xl px-5 py-4"
                  style={{
                    background: "oklch(0.98 0.012 215 / 0.96)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid var(--glass-border)",
                    boxShadow: "var(--shadow-soft)",
                  }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Users size={20} />
                  </div>

                  <div>
                    <p className="font-display text-sm font-extrabold leading-tight text-foreground">
                      Dr. Arif Mahmud
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      Founder & Managing Director
                    </p>
                  </div>
                </div>
              </div>
            </Tilt3D>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col justify-center">
            <Quote className="text-primary/40" size={40} />

            <p className="mt-4 text-lg leading-relaxed text-foreground/90">
              Medilink Health Care connects patients with doctors, hospitals,
              diagnostic centres, and pharmacies through one professional
              healthcare ecosystem. Our goal is to reduce confusion, improve
              access, and support patients at every step of their care journey.
            </p>

            <ul className="mt-8 space-y-3">
              {highlights.map((h) => (
                <li key={h} className="flex items-center gap-3">
                  <CheckCircle2 className="shrink-0 text-mint" size={22} />
                  <span className="font-medium text-foreground">{h}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {trustCards.map(({ Icon, label }) => (
                <div key={label} className="rounded-2xl glass-card p-4">
                  <Icon className="text-primary" size={22} />
                  <p className="mt-2 text-sm font-bold text-foreground">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/about"
                className="rounded-2xl px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "var(--shadow-glow)",
                }}
              >
                Learn More
              </Link>

              <Link
                href="/appointment"
                className="glass rounded-2xl px-6 py-3 text-sm font-semibold text-foreground transition hover:shadow-soft"
              >
                Book Appointment
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}