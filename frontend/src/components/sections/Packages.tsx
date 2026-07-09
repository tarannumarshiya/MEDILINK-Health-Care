"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check, Crown, ArrowRight } from "lucide-react";
import { Tilt3D } from "@/components/public/Tilt3D";
import { SectionHeading } from "@/components/public/SectionHeading";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

const packages = [
  {
    slug: "silver-health-package",
    name: "Silver Health Package",
    price: "৳1,999",
    period: "/year",
    status: "Available",
    features: ["Annual health checkup", "2 doctor consultations", "Basic lab tests", "Digital health records"],
    featured: false,
  },
  {
    slug: "gold-health-package",
    name: "Gold Health Package",
    price: "৳4,999",
    period: "/year",
    status: "Available",
    features: ["Full body checkup", "Unlimited consultations", "Advanced diagnostics", "Priority appointments", "Pharmacy discounts"],
    featured: true,
  },
  {
    slug: "family-care-package",
    name: "Family Care Package",
    price: "৳8,499",
    period: "/year",
    status: "Available",
    features: ["Coverage for 4 members", "Family health dashboard", "Pediatric & senior care", "Home sample collection"],
    featured: false,
  },
  {
    slug: "corporate-wellness",
    name: "Corporate Wellness",
    price: "Custom",
    period: "",
    status: "Upcoming",
    features: ["Employee health programs", "On-site checkup camps", "Wellness analytics", "Dedicated account manager"],
    featured: false,
  },
];

export function Packages() {
  return (
    <section id="packages" className="relative overflow-hidden py-14">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Health Packages"
          title="Plans Built Around You"
          description="View package details, pricing, availability, and appointment options before booking."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {packages.map((p) => (
            <motion.div key={p.name} variants={fadeUp}>
              <Tilt3D intensity={9} className="h-full">
                <div
                  className={cn(
                    "relative flex h-full flex-col rounded-3xl p-7 transition-all duration-300",
                    p.featured
                      ? "text-primary-foreground shadow-glow"
                      : "glass-card hover:shadow-glow"
                  )}
                  style={p.featured ? { background: "var(--gradient-hero)" } : undefined}
                >
                  {p.featured && (
                    <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                      <Crown size={13} /> Popular
                    </span>
                  )}

                  <span
                    className={cn(
                      "mb-4 w-fit rounded-full px-3 py-1 text-xs font-bold",
                      p.featured
                        ? "bg-white/20 text-white"
                        : p.status === "Available"
                          ? "bg-primary/10 text-primary"
                          : "bg-amber-100 text-amber-700"
                    )}
                  >
                    {p.status}
                  </span>

                  <h3 className="font-display text-lg font-semibold">{p.name}</h3>

                  <div className="mt-4 flex items-end gap-1">
                    <span className="font-display text-3xl font-extrabold">{p.price}</span>
                    <span
                      className={cn(
                        "pb-1 text-sm",
                        p.featured ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      {p.period}
                    </span>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check
                          size={17}
                          className={cn(
                            "mt-0.5 shrink-0",
                            p.featured ? "text-white" : "text-mint"
                          )}
                        />
                        <span className={p.featured ? "" : "text-foreground/90"}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/packages/${p.slug}`}
                    className={cn(
                      "mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-center text-sm font-bold transition",
                      p.featured
                        ? "glass text-foreground hover:bg-white/20"
                        : "text-primary-foreground hover:opacity-90"
                    )}
                    style={!p.featured ? { background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" } : undefined}
                  >
                    View Details
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </Tilt3D>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-8 text-center">
          <Link href="/packages" className="font-bold text-primary hover:underline">
            View All Packages →
          </Link>
        </div>
      </div>
    </section>
  );
}