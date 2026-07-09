"use client";

import Link from "next/link";
import { motion } from "motion/react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { SectionHeading } from "@/components/public/SectionHeading";
import { GradientBlobs } from "@/components/public/GradientBlobs";
import { Tilt3D } from "@/components/public/Tilt3D";
import { AnimatedCounter } from "@/components/public/AnimatedCounter";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

/*
 * Department card background images.
 * 7 departments use custom-uploaded images placed in /public/departments/.
 * Remaining 4 departments use Pexels (free licence) until custom images are provided.
 * Every image communicates its department within 1 second of viewing.
 */

const departments = [
  {
    name: "Emergency / Trauma",
    desc: "24/7 trauma, critical care & stabilisation unit.",
    color: "#ef4444",
    tags: ["Trauma", "Critical Care", "Resuscitation"],
    // Emergency team in scrubs working urgently in ER
    bg: "https://images.pexels.com/photos/6129507/pexels-photo-6129507.jpeg?auto=compress&w=600&h=400&fit=crop",
  },
  {
    name: "Cardiology",
    desc: "Heart disease, cardiac surgery & rehabilitation.",
    color: "#3b82f6",
    tags: ["Angioplasty", "Echocardiography", "Heart Failure"],
    // Heart anatomy / cardiovascular system — uploaded custom image
    bg: "/departments/cardiology.png",
  },
  {
    name: "Neurology",
    desc: "Brain, spine & nervous system disorders.",
    color: "#a855f7",
    tags: ["Stroke", "Epilepsy", "MRI Guided Therapy"],
    // Doctor pointing at brain MRI & spine CT scans on monitor — uploaded custom image
    bg: "/departments/neurology.png",
  },
  {
    name: "Orthopedics",
    desc: "Bone, joint replacement & sports medicine.",
    color: "#f59e0b",
    tags: ["Joint Replacement", "Fractures", "Sports Injuries"],
    // Knee joint X-ray showing prosthetic implant with inflammation highlighted — uploaded custom image
    bg: "/departments/orthopedics.png",
  },
  {
    name: "Pediatrics",
    desc: "Newborn to adolescent healthcare with specialist NICU.",
    color: "#10b981",
    tags: ["NICU", "Child Development", "Vaccinations"],
    // Pediatrician examining infant with mother — uploaded custom image
    bg: "/departments/pediatrics.png",
  },
  {
    name: "Oncology",
    desc: "Cancer diagnosis, chemotherapy & radiation oncology.",
    color: "#ec4899",
    tags: ["Chemotherapy", "Radiation", "Palliative Care"],
    // Patient receiving radiation therapy on linear accelerator — uploaded custom image
    bg: "/departments/oncology.png",
  },
  {
    name: "Radiology",
    desc: "Advanced imaging — MRI, CT, PET & ultrasound.",
    color: "#0ea5e9",
    tags: ["MRI", "CT Scan", "Ultrasound", "X-Ray"],
    // Doctor holding X-ray film up to light
    bg: "/departments/radiology.png",
  },
  {
    name: "Gynecology",
    desc: "Women's health, obstetrics & reproductive medicine.",
    color: "#f472b6",
    tags: ["Obstetrics", "Laparoscopy", "Prenatal Care"],
    // Gynecologist explaining uterus anatomy to patient with ultrasound scans on desk — uploaded custom image
    bg: "/departments/gynecology.png",
  },
  {
    name: "General Medicine",
    desc: "Primary care, preventive medicine & chronic disease management.",
    color: "#059669",
    tags: ["Diabetes", "Hypertension", "Preventive Health"],
    // Physician consulting patient across desk — uploaded custom image
    bg: "/departments/general-medicine.png",
  },
  {
    name: "Laboratory Services",
    desc: "Full diagnostics — blood, urine, cultures, biopsies & more.",
    color: "#6366f1",
    tags: ["Blood Tests", "Cultures", "Pathology"],
    // Lab technician with microscope and sample tubes
    bg: "/departments/laboratory.png",
  },
  {
    name: "Dermatology",
    desc: "Skin, hair, allergy & aesthetic care by specialist dermatologists.",
    color: "#f472b6",
    tags: ["Skin Care", "Hair Loss", "Allergy", "Aesthetics"],
    bg: "/departments/dermatology.png",
  },
  {
    name: "Pharmacy",
    desc: "On-site dispensary integrated with prescriptions & insurance.",
    color: "#14b8a6",
    tags: ["Dispensing", "Drug Counselling", "Insurance Claims"],
    // Pharmacist at dispensary counter with medicine shelves
    bg: "https://images.pexels.com/photos/3683091/pexels-photo-3683091.jpeg?auto=compress&w=600&h=400&fit=crop",
  },
];

const statsBar = [
  { label: "Departments",       value: departments.length, suffix: "" },
  { label: "Specialists",       value: 200,                suffix: "+" },
  { label: "Patients / Month",  value: 10000,              suffix: "+" },
];

export default function DepartmentsPage() {
  return (
    <>
      <PublicNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-14 sm:py-32">
        <div className="absolute inset-0 bg-foreground/5" />
        <GradientBlobs className="opacity-30" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.span variants={fadeUp} initial="hidden" animate="show"
            className="inline-flex items-center gap-2 rounded-full glass px-5 py-2 text-base font-bold tracking-wide text-primary"
          >
            🏥 Centers of Excellence
          </motion.span>
          <motion.h1 variants={fadeUp} initial="hidden" animate="show"
            className="mt-6 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl"
          >
            Our Medical <span style={{ color: "oklch(0.12 0.08 248)" }}>Departments</span>
          </motion.h1>
          <motion.p variants={fadeUp} initial="hidden" animate="show"
            className="mt-6 text-lg leading-relaxed" style={{ color: "oklch(0.20 0.05 240)" }}
          >
            Comprehensive care pathways — each department staffed by specialist consultants with full
            digital support.
          </motion.p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative border-y border-border/40">
        <div className="absolute inset-0 bg-foreground/8 pointer-events-none" />
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-12 px-6 py-8">
          {statsBar.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-extrabold text-gradient">
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </p>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
          <div className="text-center">
            <p className="font-display text-3xl font-extrabold text-gradient">&lt; 8 mins</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-1">Avg Wait Time</p>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <motion.div
          variants={staggerContainer} initial="hidden" whileInView="show" viewport={viewportOnce}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {departments.map(({ name, desc, color, tags, bg }) => (
            <motion.div key={name} variants={fadeUp}>
              <Tilt3D className="h-full">
                <Link
                  href={`/appointment?dept=${encodeURIComponent(name)}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl transition-all duration-300 hover:shadow-glow"
                  style={{ minHeight: "280px" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 56px -8px ${color}55`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "";
                  }}
                >
                  {/* Background photo */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${bg})` }}
                  />
                  {/* Dark gradient overlay — heavier at bottom for text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25" />
                  {/* Teal page-colour blend — merges image into the site palette */}
                  <div className="absolute inset-0 opacity-35 mix-blend-multiply" style={{ background: "oklch(0.55 0.10 210)" }} />
                  {/* Dept colour tint */}
                  <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300" style={{ background: color }} />
                  {/* Colour top strip */}
                  <div className="relative h-1.5 w-full" style={{ background: `linear-gradient(90deg,${color},${color}88)` }} />

                  {/* Content */}
                  <div className="relative z-10 flex flex-1 flex-col justify-end p-7">
                    <h3 className="font-display text-lg font-semibold text-white group-hover:text-white transition-colors">{name}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/75 flex-1">{desc}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <span key={tag} className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white" style={{ background: `${color}55`, border: `1px solid ${color}99` }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-end border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.2)" }}>
                      <span className="rounded-full px-4 py-1.5 text-xs font-bold text-white" style={{ background: `linear-gradient(135deg,${color},${color}cc)` }}>
                        Book Appointment
                      </span>
                    </div>
                  </div>
                </Link>
              </Tilt3D>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl glass-card p-12 text-center">
          <GradientBlobs className="opacity-30" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Ready to book your appointment?</h2>
            <p className="mt-4 text-muted-foreground leading-7">Find the right specialist and book in under 60 seconds.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/appointment" className="rounded-2xl px-8 py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
                Book Appointment
              </Link>
              <Link href="/contact" className="glass rounded-2xl px-8 py-3.5 text-sm font-semibold text-foreground transition hover:shadow-soft">
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
