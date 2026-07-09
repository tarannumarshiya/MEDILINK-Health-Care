"use client";

import Link from "next/link";
import {
  Check,
  Crown,
  ArrowRight,
  CalendarCheck,
} from "lucide-react";

import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { SectionHeading } from "@/components/public/SectionHeading";

const packages = [
  {
    slug: "silver-health-package",
    name: "Silver Health Package",
    price: "৳1,999",
    period: "/Year",
    featured: false,
    description:
      "Essential preventive healthcare package designed for individuals.",
    features: [
      "Annual Health Checkup",
      "2 Doctor Consultations",
      "Basic Laboratory Tests",
      "Digital Health Records",
    ],
  },
  {
    slug: "gold-health-package",
    name: "Gold Health Package",
    price: "৳4,999",
    period: "/Year",
    featured: true,
    description:
      "Complete healthcare package with priority medical services.",
    features: [
      "Unlimited Consultations",
      "Advanced Diagnostics",
      "Priority Appointments",
      "Medicine Discounts",
      "Annual Screening",
    ],
  },
  {
    slug: "family-care-package",
    name: "Family Care Package",
    price: "৳8,499",
    period: "/Year",
    featured: false,
    description:
      "Healthcare plan specially designed for families.",
    features: [
      "4 Family Members",
      "Pediatric Care",
      "Senior Care",
      "Home Sample Collection",
    ],
  },
  {
    slug: "corporate-wellness",
    name: "Corporate Wellness",
    price: "Custom",
    period: "",
    featured: false,
    description:
      "Healthcare solutions for organizations and employees.",
    features: [
      "Employee Health Programs",
      "Health Camps",
      "Corporate Reports",
      "Dedicated Account Manager",
    ],
  },
];

export default function PackagesPage() {
  return (
    <>
      <PublicNavbar />

      <main className="pt-28">

        <section className="py-16">
          <div className="mx-auto max-w-7xl px-6">

            <SectionHeading
              eyebrow="Health Packages"
              title="Choose the Right Healthcare Package"
              description="Explore our preventive healthcare plans designed for individuals, families, and organizations."
            />

            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">

              {packages.map((pkg) => (

                <div
                  key={pkg.slug}
                  className={`rounded-3xl p-7 shadow-soft transition hover:-translate-y-2 ${
                    pkg.featured
                      ? "bg-primary text-white"
                      : "glass-card"
                  }`}
                >

                  {pkg.featured && (
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                      <Crown size={14} />
                      Most Popular
                    </div>
                  )}

                  <h2 className="font-display text-2xl font-bold">
                    {pkg.name}
                  </h2>

                  <p className="mt-4 text-4xl font-extrabold">
                    {pkg.price}
                    <span className="text-base font-normal">
                      {pkg.period}
                    </span>
                  </p>

                  <p className="mt-5 text-sm opacity-90">
                    {pkg.description}
                  </p>

                  <ul className="mt-6 space-y-3">
                    {pkg.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check size={16} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/packages/${pkg.slug}`}
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border py-3 font-semibold transition hover:bg-primary/10"
                  >
                    View Details
                    <ArrowRight size={16} />
                  </Link>

                </div>

              ))}

            </div>

          </div>
        </section>

      </main>

      <PublicFooter />
    </>
  );
}