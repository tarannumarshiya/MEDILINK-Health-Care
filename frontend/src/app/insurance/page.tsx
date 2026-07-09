"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Shield, FileText, CheckCircle2, Clock } from "lucide-react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { SectionHeading } from "@/components/public/SectionHeading";
import { GradientBlobs } from "@/components/public/GradientBlobs";
import { Tilt3D } from "@/components/public/Tilt3D";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const partners = [
  "Guardian Life", "MetLife Bangladesh", "Delta Life", "National Life",
  "Pragati Life", "Green Delta", "Pioneer Insurance", "Reliance Insurance",
];

const steps = [
  { icon: FileText,     title: "Pre-Authorization",   desc: "Submit your policy details before admission or treatment." },
  { icon: CheckCircle2, title: "Verification",         desc: "Our team verifies your coverage limits with the provider." },
  { icon: Shield,       title: "Cashless Treatment",   desc: "Receive care without upfront payments for covered services." },
  { icon: Clock,        title: "Final Settlement",     desc: "We handle the final paperwork and claim settlement directly." },
];

export default function InsurancePage() {
  return (
    <>
      <PublicNavbar />

      {/* Hero — uses site theme variables, not hardcoded dark */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-foreground/5" />
        <div className="absolute inset-0 bg-foreground/8" />
        <GradientBlobs className="opacity-30" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.span
            variants={fadeUp} initial="hidden" animate="show"
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm font-semibold text-foreground"
          >
            🛡️ Insurance & Cashless
          </motion.span>
          <motion.h1
            variants={fadeUp} initial="hidden" animate="show"
            className="mt-6 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl"
          >
            Insurance &{" "}
            <span style={{ color: "oklch(0.12 0.08 248)" }}>Cashless Facilities</span>
          </motion.h1>
          <motion.p
            variants={fadeUp} initial="hidden" animate="show"
            className="mt-6 text-lg leading-relaxed" style={{ color: "oklch(0.20 0.05 240)" }}
          >
            We partner with major health insurance providers to ensure a seamless, hassle-free
            healthcare experience for you and your family.
          </motion.p>
        </div>
      </section>

      {/* Partners */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeading
          eyebrow="Our Partners"
          title="Accepted Insurance Providers"
          description="We accept policies from the following trusted providers."
        />
        <motion.div
          variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewportOnce}
          className="mt-14 grid grid-cols-2 gap-5 md:grid-cols-4"
        >
          {partners.map((partner) => (
            <motion.div key={partner} variants={fadeUp}>
              <Tilt3D>
                <div className="flex h-28 items-center justify-center rounded-3xl glass-card px-6 text-center transition-all hover:shadow-glow">
                  <span className="font-display text-base font-bold text-foreground">{partner}</span>
                </div>
              </Tilt3D>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-foreground/5" />
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div
              variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewportOnce}
            >
              <SectionHeading
                eyebrow="Process"
                title="Hassle-free Claim Process"
                description="Our dedicated insurance desk processes your claims so you can focus on recovery."
              />
              <div className="mt-10 space-y-7">
                {steps.map(({ icon: Icon, title, desc }, i) => (
                  <motion.div key={title} variants={fadeUp} className="flex gap-5">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-primary-foreground"
                      style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{i + 1}. {title}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Contact card — themed */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
              <Tilt3D intensity={6}>
                <div className="rounded-3xl glass-card p-10 text-center">
                  <div
                    className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl text-primary-foreground"
                    style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
                  >
                    <Shield size={36} />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-foreground">Need Assistance?</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Contact our Insurance Help Desk for coverage inquiries and claim assistance.
                  </p>

                  <div className="mt-8 space-y-4">
                    <div className="rounded-2xl glass p-5">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">Help Desk Helpline</p>
                      <p className="mt-2 font-display text-2xl font-extrabold text-foreground">+880 1999 000000</p>
                    </div>
                    <div className="rounded-2xl glass p-5">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">Email Support</p>
                      <p className="mt-2 font-display text-lg font-bold text-foreground">insurance@medilink.com</p>
                    </div>
                  </div>

                  <Link
                    href="/appointment"
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                    style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
                  >
                    Book with Insurance
                  </Link>
                </div>
              </Tilt3D>
            </motion.div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
