"use client";

import { motion } from "motion/react";
import {
  Stethoscope,
  CalendarCheck,
  FileLock2,
  Ambulance,
  Handshake,
  ShieldCheck,
} from "lucide-react";
import { SectionHeading } from "@/components/public/SectionHeading";
import { Tilt3D } from "@/components/public/Tilt3D";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const reasons = [
  {
    Icon: Stethoscope,
    title: "Expert Medical Network",
    desc: "Access a vetted network of leading specialists and institutions.",
    gradient: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    glow: "rgba(14,165,233,0.35)",
  },
  {
    Icon: CalendarCheck,
    title: "Instant Appointments",
    desc: "Book and confirm visits in seconds, no waiting in queues.",
    gradient: "linear-gradient(135deg, #10b981, #0ea5e9)",
    glow: "rgba(16,185,129,0.35)",
  },
  {
    Icon: FileLock2,
    title: "Digital Health Records",
    desc: "Your complete medical history, securely available anytime.",
    gradient: "linear-gradient(135deg, #6366f1, #a855f7)",
    glow: "rgba(99,102,241,0.35)",
  },
  {
    Icon: Ambulance,
    title: "Emergency Support",
    desc: "24/7 emergency response and rapid ambulance coordination.",
    gradient: "linear-gradient(135deg, #ef4444, #f97316)",
    glow: "rgba(239,68,68,0.35)",
  },
  {
    Icon: Handshake,
    title: "Trusted Partners",
    desc: "Collaborating with the most reputable healthcare providers.",
    gradient: "linear-gradient(135deg, #f59e0b, #10b981)",
    glow: "rgba(245,158,11,0.35)",
  },
  {
    Icon: ShieldCheck,
    title: "Secure Platform",
    desc: "Bank-grade encryption keeps your health data protected.",
    gradient: "linear-gradient(135deg, #ec4899, #6366f1)",
    glow: "rgba(236,72,153,0.35)",
  },
];

export function WhyChooseUs() {
  return (
    <section className="relative overflow-hidden py-14">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Why Choose Us"
          title="The Medilink Advantage"
          description="Built for trust, speed and a genuinely better care experience."
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {reasons.map(({ Icon, title, desc, gradient, glow }) => (
            <motion.div key={title} variants={fadeUp}>
              <Tilt3D intensity={8} className="h-full">
                <div
                  className="group flex h-full flex-col rounded-3xl p-7 transition-all duration-300"
                  style={{
                    background: "var(--glass-bg)",
                    backdropFilter: "blur(22px) saturate(160%)",
                    WebkitBackdropFilter: "blur(22px) saturate(160%)",
                    border: "1px solid var(--glass-border)",
                    boxShadow: `0 4px 24px -8px ${glow}`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 48px -8px ${glow}`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px -8px ${glow}`;
                  }}
                >
                  <div
                    className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
                    style={{ background: gradient }}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <div
                    className="mt-5 h-0.5 w-8 rounded-full transition-all duration-300 group-hover:w-14"
                    style={{ background: gradient }}
                  />
                  <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </Tilt3D>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
