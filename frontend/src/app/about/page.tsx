"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Stethoscope,
  ShieldCheck,
  Users,
  Building2,
  HeartPulse,
} from "lucide-react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { SectionHeading } from "@/components/public/SectionHeading";
import { GradientBlobs } from "@/components/public/GradientBlobs";
import { Tilt3D } from "@/components/public/Tilt3D";
import { hospitalInfo } from "@/lib/constants";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const values = [
  {
    Icon: HeartPulse,
    title: "Patient First",
    desc: "Every service is designed to make the patient journey simpler, faster, and more reliable.",
  },
  {
    Icon: Stethoscope,
    title: "Connected Care",
    desc: "Doctors, departments, diagnostics, pharmacy, and support services work through one ecosystem.",
  },
  {
    Icon: ShieldCheck,
    title: "Trust & Safety",
    desc: "We focus on transparent processes, secure patient data, and dependable healthcare support.",
  },
  {
    Icon: Users,
    title: "Accessible Service",
    desc: "Patients can book, track, consult, and access support through a clear digital workflow.",
  },
];

const highlights = [
  "Online appointment booking and doctor selection",
  "Department-wise specialist access",
  "Diagnostic, pharmacy, insurance, and emergency support",
  "Digital patient journey with better visibility",
];

export default function AboutPage() {
  return (
    <>
      <PublicNavbar />

      <section className="relative overflow-hidden py-14 sm:py-32">
        <div className="absolute inset-0 bg-foreground/5" />
        <GradientBlobs className="opacity-30" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.span
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-2 rounded-full glass px-5 py-2 text-base font-bold tracking-wide text-primary"
          >
            🏥 About Us
          </motion.span>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl"
          >
            About{" "}
            <span style={{ color: "oklch(0.12 0.07 248)" }}>
              {hospitalInfo.name}
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 text-lg leading-relaxed text-muted-foreground"
          >
            A professional digital healthcare ecosystem connecting patients,
            doctors, hospitals, diagnostic centres, pharmacies, and support
            services in Dhaka, Bangladesh.
          </motion.p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="grid items-center gap-14 lg:grid-cols-2"
        >
          <motion.div variants={fadeUp}>
            <Tilt3D intensity={8}>
              <div className="relative overflow-hidden rounded-3xl glass-card p-4">
                <Image
                  src="/director.jpg"
                  alt="Dr. Arif Mahmud"
                  width={900}
                  height={900}
                  className="h-[520px] w-full rounded-2xl object-cover object-center"
                  priority
                />

                <div
                  className="absolute bottom-6 left-1/2 w-[82%] -translate-x-1/2 rounded-2xl px-6 py-4 text-center"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(18px)",
                    WebkitBackdropFilter: "blur(18px)",
                    border: "1px solid rgba(255,255,255,0.45)",
                    boxShadow: "0 10px 30px rgba(0,0,0,.12)",
                  }}
                >
                  <h3 className="font-display text-xl font-bold text-foreground">
                    Dr. Arif Mahmud
                  </h3>

                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    Founder & Managing Director
                  </p>

                  <p className="mt-1 text-xs tracking-wide text-primary">
                    Medilink Health Care • Dhaka, Bangladesh
                  </p>
                </div> 
              </div>
            </Tilt3D>
          </motion.div>

          <motion.div variants={fadeUp}>
            <SectionHeading
              eyebrow="Our Purpose"
              title="Making healthcare easier to access and manage."
              align="left"
            />

            <p className="mt-5 leading-8 text-muted-foreground">
              Medilink Health Care was built to simplify the healthcare
              experience for patients. Instead of handling appointments,
              departments, reports, pharmacy needs, and support separately, the
              platform connects them into one clear and organized workflow.
            </p>

            <ul className="mt-6 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="shrink-0 text-mint" size={20} />
                  <span className="text-sm font-medium text-foreground">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/appointment"
                className="rounded-2xl px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "var(--shadow-glow)",
                }}
              >
                Book Appointment
              </Link>

              <Link
                href="/departments"
                className="glass rounded-2xl px-6 py-3 text-sm font-semibold text-foreground transition hover:shadow-soft"
              >
                View Departments
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="relative py-14">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="Our Values"
            title="Built on trust, clarity, and patient care"
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {values.map(({ Icon, title, desc }) => (
              <motion.div key={title} variants={fadeUp}>
                <Tilt3D className="h-full">
                  <div className="flex h-full flex-col rounded-3xl glass-card p-7 transition-all hover:-translate-y-1 hover:shadow-glow">
                    <div
                      className="mb-5 grid h-12 w-12 place-items-center rounded-xl text-primary-foreground"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      <Icon size={24} strokeWidth={1.8} />
                    </div>

                    <h3 className="font-display font-semibold text-foreground">
                      {title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {desc}
                    </p>
                  </div>
                </Tilt3D>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              Icon: Building2,
              title: "Healthcare Network",
              desc: "Hospitals, doctors, diagnostics, pharmacy, and support services connected.",
            },
            {
              Icon: Users,
              title: "Patient Support",
              desc: "Patients can book, track, and receive support through a simple digital flow.",
            },
            {
              Icon: ShieldCheck,
              title: "Reliable Platform",
              desc: "Professional system designed for secure, organized, and transparent healthcare.",
            },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-3xl glass-card p-7">
              <Icon className="text-primary" size={28} />
              <h3 className="mt-4 font-display text-lg font-bold text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl glass-card p-12 text-center">
          <GradientBlobs className="opacity-30" />

          <div className="relative">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Need healthcare support?
            </h2>

            <p className="mt-4 leading-7 text-muted-foreground">
              Book an appointment or contact our team for help with departments,
              doctors, pharmacy, diagnostics, and patient services.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/appointment"
                className="rounded-2xl px-8 py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                style={{
                  background: "var(--gradient-primary)",
                  boxShadow: "var(--shadow-glow)",
                }}
              >
                Book Appointment
              </Link>

              <Link
                href="/contact"
                className="glass rounded-2xl px-8 py-3.5 text-sm font-semibold text-foreground transition hover:shadow-soft"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}