"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarCheck,
  CheckCircle2,
  ArrowLeft,
  Clock,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";

import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";

const packageDetails = {
  "silver-health-package": {
    title: "Silver Health Package",
    price: "৳1,999",
    duration: "1 Year",
    availability: "Available",
    description:
      "The Silver Health Package is designed for individuals who want affordable preventive healthcare. It includes essential medical checkups and consultations to help maintain overall well-being.",
    includes: [
      "Annual Health Checkup",
      "2 Doctor Consultations",
      "Basic Laboratory Tests",
      "Digital Health Records",
    ],
    benefits: [
      "Early disease detection",
      "Affordable healthcare plan",
      "Digital medical records",
      "Professional doctor consultations",
    ],
  },

  "gold-health-package": {
    title: "Gold Health Package",
    price: "৳4,999",
    duration: "1 Year",
    availability: "Available",
    description:
      "Our premium healthcare package offering comprehensive diagnostics, unlimited consultations, and priority medical support.",
    includes: [
      "Unlimited Consultations",
      "Advanced Diagnostics",
      "Priority Appointment Booking",
      "Medicine Discounts",
      "Annual Health Screening",
    ],
    benefits: [
      "Priority healthcare access",
      "Comprehensive preventive care",
      "Reduced pharmacy expenses",
      "Complete health monitoring",
    ],
  },

  "family-care-package": {
    title: "Family Care Package",
    price: "৳8,499",
    duration: "1 Year",
    availability: "Available",
    description:
      "Healthcare coverage designed for families, ensuring preventive care for children, adults, and senior citizens.",
    includes: [
      "Coverage for Four Members",
      "Pediatric Care",
      "Senior Citizen Care",
      "Home Sample Collection",
    ],
    benefits: [
      "One package for the whole family",
      "Reduced healthcare expenses",
      "Convenient diagnostics",
      "Comprehensive medical support",
    ],
  },

  "corporate-wellness": {
    title: "Corporate Wellness",
    price: "Custom Pricing",
    duration: "Custom",
    availability: "Contact Sales",
    description:
      "Corporate healthcare solution designed for organizations to improve employee health and productivity.",
    includes: [
      "Employee Health Programs",
      "Health Camps",
      "Corporate Analytics",
      "Dedicated Relationship Manager",
    ],
    benefits: [
      "Healthier workforce",
      "Reduced absenteeism",
      "Corporate reporting",
      "Custom wellness plans",
    ],
  },
};

export default async function PackageDetails({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const pkg =
    packageDetails[slug as keyof typeof packageDetails];

  if (!pkg) {
    notFound();
  }

  return (
    <>
      <PublicNavbar />

      <main className="pt-28">

        <section className="py-16">

          <div className="mx-auto max-w-6xl px-6">

            <Link
              href="/packages"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            >
              <ArrowLeft size={18} />
              Back to Packages
            </Link>

            <div className="mt-8 rounded-3xl glass-card p-10">

              <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                {pkg.availability}
              </span>

              <h1 className="mt-6 font-display text-5xl font-bold">
                {pkg.title}
              </h1>

              <div className="mt-5 flex flex-wrap gap-8 text-muted-foreground">

                <div className="flex items-center gap-2">
                  <BadgeCheck size={20} />
                  {pkg.price}
                </div>

                <div className="flex items-center gap-2">
                  <Clock size={20} />
                  {pkg.duration}
                </div>

              </div>

              <p className="mt-8 text-lg leading-8 text-muted-foreground">
                {pkg.description}
              </p>

            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-2">

              <div className="glass-card rounded-3xl p-8">

                <h2 className="font-display text-3xl font-bold">
                  Whats Included
                </h2>

                <ul className="mt-6 space-y-4">
                  {pkg.includes.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle2
                        size={20}
                        className="text-primary"
                      />
                      {item}
                    </li>
                  ))}
                </ul>

              </div>

              <div className="glass-card rounded-3xl p-8">

                <h2 className="font-display text-3xl font-bold">
                  Key Benefits
                </h2>

                <ul className="mt-6 space-y-4">
                  {pkg.benefits.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3"
                    >
                      <ShieldCheck
                        size={20}
                        className="text-primary"
                      />
                      {item}
                    </li>
                  ))}
                </ul>

              </div>

            </div>

            <div className="mt-14 rounded-3xl glass-card p-10 text-center">

              <h2 className="font-display text-4xl font-bold">
                Ready to Book This Package?
              </h2>

              <p className="mt-4 text-muted-foreground">
                Schedule your appointment and our healthcare team will guide
                you through the selected package.
              </p>

              <Link
                href="/appointment"
                className="mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-4 font-bold text-primary-foreground"
                style={{
                  background: "var(--gradient-primary)",
                }}
              >
                <CalendarCheck size={18} />
                Book Appointment
              </Link>

            </div>

          </div>

        </section>

      </main>

      <PublicFooter />
    </>
  );
}