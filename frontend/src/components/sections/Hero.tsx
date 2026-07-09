"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, CalendarCheck, Headphones, Sparkles } from "lucide-react";
import { FloatingMedicalIcons } from "@/components/public/FloatingMedicalIcons";
import { AnimatedCounter } from "@/components/public/AnimatedCounter";
import { fadeUp, staggerContainer } from "@/lib/motion";

const stats = [
  { value: 50, suffix: "+", label: "Specialist Doctors" },
  { value: 20, suffix: "+", label: "Partner Hospitals" },
  { value: 35, suffix: "+", label: "Diagnostic Centers" },
  { value: 24, suffix: "/7", label: "Patient Support" },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 50]);

  return (
    <section
      id="home"
      ref={ref}
      className="relative flex min-h-screen items-center overflow-hidden pt-28 pb-16"
    >
      <FloatingMedicalIcons />

      <motion.div
        style={{ y: imgY }}
        className="pointer-events-none absolute right-0 top-0 hidden h-full w-[58%] lg:block"
        aria-hidden="true"
      >
        <div
          className="relative h-full w-full"
          style={{
            WebkitMaskImage: [
              "linear-gradient(to right, transparent 0%, black 32%)",
              "linear-gradient(to bottom, transparent 0%, black 10%, black 85%, transparent 100%)",
            ].join(", "),
            maskImage: [
              "linear-gradient(to right, transparent 0%, black 32%)",
              "linear-gradient(to bottom, transparent 0%, black 10%, black 85%, transparent 100%)",
            ].join(", "),
            WebkitMaskComposite: "intersect",
            maskComposite: "intersect",
          }}
        >
          <Image
            src="/images/hero-doctor-consultation.jpg"
            alt="Doctor consulting a patient and family in a modern healthcare environment"
            fill
            className="object-cover object-center"
            priority
            sizes="58vw"
          />

          <div
            className="absolute inset-0 mix-blend-multiply"
            style={{ background: "oklch(0.62 0.09 210 / 0.32)" }}
          />
        </div>
      </motion.div>

      <motion.div
        style={{ y: contentY }}
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto w-full max-w-7xl px-6"
      >
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm font-medium text-primary"
        >
          <Sparkles size={15} />
          Trusted Digital Healthcare Ecosystem
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
        >
          Seamless Healthcare Support for{" "}
          <span style={{ color: "oklch(0.12 0.08 248)" }}>
            Every Patient
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
          style={{ color: "oklch(0.20 0.05 240)" }}
        >
          Connecting patients, doctors, hospitals, diagnostic centres, and
          pharmacies through a seamless healthcare ecosystem.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/appointment"
            className="group inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
            style={{
              background: "var(--gradient-primary)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <CalendarCheck size={18} />
            Book Appointment
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>

          <Link
            href="/#services"
            className="glass inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-foreground transition hover:shadow-soft"
          >
            Explore Services
          </Link>

          <Link
            href="/contact"
            className="glass inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-foreground transition hover:shadow-soft"
          >
            <Headphones size={18} />
            Contact Support
          </Link>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-4 text-center transition-transform hover:-translate-y-1"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "blur(22px) saturate(160%)",
                WebkitBackdropFilter: "blur(22px) saturate(160%)",
                border: "1px solid var(--glass-border)",
                boxShadow:
                  "0 8px 32px -6px oklch(0.4 0.12 230 / 0.28), 0 2px 8px -2px oklch(0.4 0.12 230 / 0.18)",
              }}
            >
              <div className="font-display text-3xl font-bold text-foreground">
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </div>

              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}