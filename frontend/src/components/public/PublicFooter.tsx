"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  Send,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { hospitalInfo } from "@/lib/constants";
import BrandLogo from "@/components/BrandLogo";

const columns = [
  {
    title: "Quick Links",
    links: [
      ["About Us", "/about"],
      ["Services", "/services"],
      ["Departments", "/departments"],
      ["Doctors", "/doctors"],
      ["Contact", "/contact"],
    ],
  },
  {
    title: "Services",
    links: [
      ["Book Appointment", "/appointment"],
      ["Pharmacy", "/pharmacy"],
      ["Health Packages", "/packages"],
      ["Insurance", "/insurance"],
      ["Emergency", "/emergency"],
    ],
  },
  {
    title: "Support",
    links: [
      ["Patient Login", "/patient/login"],
      ["Register", "/patient/register"],
      ["Track Status", "/patient/track"],
      ["Privacy Policy", "/privacy-policy"],
      ["Terms & Conditions", "/terms"],
    ],
  },
];

function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function IconLinkedin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const socials = [
  { Icon: IconFacebook, label: "Facebook", href: "https://www.facebook.com/" },
  { Icon: IconInstagram, label: "Instagram", href: "https://www.instagram.com/" },
  { Icon: IconLinkedin, label: "LinkedIn", href: "https://www.linkedin.com/" },
];

export default function PublicFooter() {
  const [email, setEmail] = useState("");
  const [subbed, setSubbed] = useState(false);

  return (
    <footer className="relative overflow-hidden border-t border-border bg-secondary/40">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <BrandLogo />

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {hospitalInfo.tagline}. A trusted digital healthcare ecosystem
              connecting patients, doctors, diagnostics, pharmacy, insurance,
              and emergency support.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[10px] font-bold text-muted-foreground">
                <ShieldCheck size={13} /> Secure Healthcare
              </span>

              <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[10px] font-bold text-muted-foreground">
                <AlertTriangle size={13} /> Emergency 24×7
              </span>
            </div>

            <div className="mt-5 flex gap-2">
              {socials.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="glass grid h-10 w-10 place-items-center rounded-xl text-foreground/70 transition-all hover:-translate-y-1 hover:text-primary"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
                {col.title}
              </h4>

              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="inline-block text-sm text-muted-foreground transition-colors hover:translate-x-0.5 hover:text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-6 rounded-3xl glass-card p-6 sm:p-8 lg:grid-cols-[1fr_1fr_1.4fr]">
          <div className="space-y-3">
            <h4 className="mb-4 font-display text-sm font-semibold text-foreground">
              Contact Information
            </h4>

            <a
              href="https://www.google.com/maps?q=Dhanmondi%2027%20Dhaka%20Bangladesh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 text-sm text-muted-foreground hover:text-primary"
            >
              <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
              <span>{hospitalInfo.address}</span>
            </a>

            <a
              href={`tel:${hospitalInfo.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary"
            >
              <Phone size={18} className="shrink-0 text-primary" />
              <span>{hospitalInfo.phone}</span>
            </a>

            <a
              href={`tel:${hospitalInfo.emergency.replace(/\s/g, "")}`}
              className="flex items-center gap-3 text-sm text-muted-foreground hover:text-destructive"
            >
              <Phone size={18} className="shrink-0 text-destructive" />
              <span>
                Emergency:{" "}
                <span className="font-bold text-destructive">
                  {hospitalInfo.emergency}
                </span>
              </span>
            </a>

            <a
              href={`mailto:${hospitalInfo.email}`}
              className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary"
            >
              <Mail size={18} className="shrink-0 text-primary" />
              <span>{hospitalInfo.email}</span>
            </a>

            <a
              href={`mailto:${hospitalInfo.support}`}
              className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary"
            >
              <Mail size={18} className="shrink-0 text-mint" />
              <span>Support: {hospitalInfo.support}</span>
            </a>
          </div>

          <div>
            <h4 className="font-display text-sm font-semibold text-foreground">
              Subscribe to Updates
            </h4>

            <p className="mt-2 text-sm text-muted-foreground">
              Get hospital updates, health packages, pharmacy alerts, and service
              announcements.
            </p>

            {subbed ? (
              <p className="mt-3 text-sm font-semibold text-primary">
                ✓ Subscribed successfully.
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (
                    !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(
                      email.trim()
                    )
                  ) {
                    return;
                  }
                  setSubbed(true);
                  setEmail("");
                }}
                className="mt-4 flex gap-2"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="h-11 flex-1 rounded-xl border border-input bg-background/60 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />

                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary-foreground transition hover:opacity-90"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Send size={18} />
                </button>
              </form>
            )}
          </div>

          <div>
            <h4 className="mb-3 font-display text-sm font-semibold text-foreground">
              Google Maps Location
            </h4>

            <div className="overflow-hidden rounded-2xl border border-border">
              <iframe
                title="Medilink Health Care Location"
                src="https://www.google.com/maps?q=Dhanmondi%2027%20Dhaka%20Bangladesh&output=embed"
                width="100%"
                height="170"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground lg:flex-row">
          <p>
            © {new Date().getFullYear()} {hospitalInfo.company}. All rights
            reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/privacy-policy" className="hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms & Conditions
            </Link>
            <Link href="/refund-policy" className="hover:text-primary">
              Refund Policy
            </Link>
            <Link href="/disclaimer" className="hover:text-primary">
              Disclaimer
            </Link>
          </div>

          <p>{hospitalInfo.website}</p>
        </div>
      </div>
    </footer>
  );
}