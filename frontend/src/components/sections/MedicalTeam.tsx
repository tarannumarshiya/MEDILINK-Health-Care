"use client";

import { motion } from "motion/react";
import { Stethoscope, Building2, FlaskConical, Headphones } from "lucide-react";
import { AnimatedCounter } from "@/components/public/AnimatedCounter";
import { SectionHeading } from "@/components/public/SectionHeading";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const counters = [
  { Icon: Stethoscope,  value: 50, suffix: "+", label: "Specialist Doctors"  },
  { Icon: Building2,    value: 20, suffix: "",  label: "Partner Hospitals"   },
  { Icon: FlaskConical, value: 35, suffix: "",  label: "Diagnostic Centers"  },
  { Icon: Headphones,   value: 24, suffix: "/7",label: "Customer Care"       },
];

export function MedicalTeam() {
  return (
    <section className="relative overflow-hidden py-14">
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Our Network"
          title="Our Medical Network in Numbers"
          description="Trusted by thousands of patients across the country, every single day."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4"
        >
          {counters.map(({ Icon, value, suffix, label }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              className="glass-card rounded-3xl p-7 text-center transition-transform hover:-translate-y-1.5"
            >
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl text-primary-foreground"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
                <Icon size={26} strokeWidth={1.8} />
              </div>
              <div className="font-display text-4xl font-extrabold text-foreground sm:text-5xl">
                <AnimatedCounter value={value} suffix={suffix} />
              </div>
              <p className="mt-2 text-sm font-medium text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
