"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Tilt3D } from "@/components/public/Tilt3D";
import { SectionHeading } from "@/components/public/SectionHeading";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const departments = [
  {
    name: "Cardiology",
    slug: "cardiology",
    desc: "Heart and cardiovascular care.",
    color: "#3b82f6",
    tags: ["ECG", "Heart Care", "Monitoring"],
    bg: "/departments/cardiology.png",
  },
  {
    name: "Orthopedics",
    slug: "orthopedics",
    desc: "Bone, joint, spine, and mobility care.",
    color: "#f59e0b",
    tags: ["Joints", "Fractures", "Spine"],
    bg: "/departments/orthopedics.png",
  },
  {
    name: "Neurology",
    slug: "neurology",
    desc: "Brain, nerves, and nervous system care.",
    color: "#a855f7",
    tags: ["Brain", "Nerves", "Stroke"],
    bg: "/departments/neurology.png",
  },
  {
    name: "Pediatrics",
    slug: "pediatrics",
    desc: "Compassionate child and infant healthcare.",
    color: "#10b981",
    tags: ["Children", "Growth", "Vaccines"],
    bg: "/departments/pediatrics.png",
  },
  {
    name: "Dermatology",
    slug: "dermatology",
    desc: "Skin, hair, allergy, and aesthetic care.",
    color: "#f472b6",
    tags: ["Skin", "Hair", "Allergy"],
    bg: "/departments/dermatology.png",
  },
  {
    name: "General Medicine",
    slug: "general-medicine",
    desc: "Everyday primary care and general health support.",
    color: "#059669",
    tags: ["Fever", "Checkup", "Chronic Care"],
    bg: "/departments/general-medicine.png",
  },
];

export function Departments() {
  return (
    <section id="departments" className="relative overflow-hidden py-14">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Departments"
          title="Specialized Medical Departments"
          description="Explore department details, key services, and appointment options."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {departments.map(({ name, slug, desc, color, tags, bg }) => (
            <motion.div key={name} variants={fadeUp}>
              <Tilt3D className="h-full">
                <div
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl transition-all duration-300 hover:shadow-glow"
                  style={{ minHeight: "330px" }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${bg})` }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/20" />

                  <div
                    className="absolute inset-0 opacity-35 mix-blend-multiply"
                    style={{ background: "oklch(0.55 0.10 210)" }}
                  />

                  <div
                    className="absolute inset-0 opacity-20 transition-opacity duration-300 group-hover:opacity-30"
                    style={{ background: color }}
                  />

                  <div
                    className="absolute left-0 top-0 h-1.5 w-full"
                    style={{
                      background: `linear-gradient(90deg, ${color}, ${color}88)`,
                    }}
                  />

                  <div className="relative z-10 flex h-full flex-col justify-end p-7 text-white">
                    <h3 className="font-display text-2xl font-bold">{name}</h3>

                    <p className="mt-3 text-sm leading-6 text-white/85">
                      {desc}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                          style={{
                            background: `${color}55`,
                            border: `1px solid ${color}99`,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-7">
                      <Link
                        href={`/appointment?department=${slug}`}
                        className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                        style={{
                          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                        }}
                      >
                        Book Appointment
                      </Link>
                    </div>
                  </div>
                </div>
              </Tilt3D>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-8 text-center">
          <Link href="/departments" className="font-bold text-primary hover:underline">
            View All Departments →
          </Link>
        </div>
      </div>
    </section>
  );
}