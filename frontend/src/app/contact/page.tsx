"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Phone,
  Mail,
  Send,
  MapPin,
  Ambulance,
  MessageCircle,
  Clock,
  Building2,
} from "lucide-react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { SectionHeading } from "@/components/public/SectionHeading";
import { GradientBlobs } from "@/components/public/GradientBlobs";
import { Tilt3D } from "@/components/public/Tilt3D";
import { hospitalInfo } from "@/lib/constants";
import { validateContactForm } from "@/lib/validate";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const inputCls =
  "h-12 w-full rounded-xl border border-input bg-background/60 px-4 text-sm text-foreground placeholder:text-muted-foreground transition focus:outline-none focus:ring-2 focus:ring-ring";

const contacts = [
  {
    Icon: Building2,
    label: "Office Address",
    value: hospitalInfo.address,
    sub: hospitalInfo.location,
    href: "#map",
  },
  {
    Icon: Phone,
    label: "Phone Number",
    value: hospitalInfo.phone,
    sub: "Mon–Sat, 8am–8pm",
    href: `tel:${hospitalInfo.phone.replace(/\s/g, "")}`,
  },
  {
    Icon: Ambulance,
    label: "Emergency Contact",
    value: hospitalInfo.emergency,
    sub: "Available 24/7",
    href: `tel:${hospitalInfo.emergency.replace(/\s/g, "")}`,
    color: "text-destructive",
  },
  {
    Icon: Mail,
    label: "Email Address",
    value: hospitalInfo.email,
    sub: "Response within 24 hours",
    href: `mailto:${hospitalInfo.email}`,
  },
  {
    Icon: MessageCircle,
    label: "WhatsApp Contact",
    value: hospitalInfo.phone,
    sub: "Chat with support",
    href: `https://wa.me/${hospitalInfo.phone.replace(/\D/g, "")}`,
  },
  {
    Icon: Clock,
    label: "Working Hours",
    value: "Mon–Sat: 8:00 AM – 8:00 PM",
    sub: "Emergency services available 24/7",
    href: "#contact-form",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validateContactForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setNotice("");
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data: { error?: string } = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send message");
        return;
      }

      setNotice("Message sent successfully. Our team will respond within 24 hours.");
      setForm({
        full_name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch {
      setError("Unable to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PublicNavbar />

      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-foreground/5" />
        <GradientBlobs className="opacity-30" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.span
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm font-medium text-primary"
          >
            💬 Contact Medilink
          </motion.span>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-6xl"
          >
            We Are Here to <span className="text-gradient">Help You</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-muted-foreground"
          >
            Reach Medilink Health Care for appointments, emergency support,
            pharmacy help, insurance queries, and general inquiries.
          </motion.p>
        </div>
      </section>

      <section className="relative overflow-hidden py-14">
        <GradientBlobs className="opacity-30" />

        <div className="relative mx-auto max-w-7xl px-6">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="grid gap-12 lg:grid-cols-[1fr_430px]"
          >
            <motion.div id="contact-form" variants={fadeUp}>
              <SectionHeading
                eyebrow="Inquiry Form"
                title="Send Us a Message"
                description="Fill in your details and our support team will contact you as soon as possible."
                align="left"
              />

              <Tilt3D intensity={4} className="mt-8">
                <form onSubmit={submit} className="space-y-5 rounded-3xl glass-card p-8">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Full Name
                      </label>
                      <input
                        required
                        placeholder="Enter full name"
                        className={inputCls}
                        value={form.full_name}
                        onChange={(e) =>
                          setForm({ ...form, full_name: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Email Address
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="you@example.com"
                        className={inputCls}
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Phone Number
                      </label>
                      <input
                        placeholder="+880 17XX XXXXXX"
                        className={inputCls}
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Subject
                      </label>
                      <input
                        required
                        placeholder="How can we help?"
                        className={inputCls}
                        value={form.subject}
                        onChange={(e) =>
                          setForm({ ...form, subject: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Describe your inquiry in detail..."
                      className="w-full resize-none rounded-xl border border-input bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition focus:outline-none focus:ring-2 focus:ring-ring"
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                    />
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                      {error}
                    </div>
                  )}

                  {notice && (
                    <div className="rounded-2xl border border-mint/20 bg-mint/10 px-4 py-3 text-sm font-semibold text-mint">
                      ✓ {notice}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
                    style={{
                      background: "var(--gradient-primary)",
                      boxShadow: "var(--shadow-glow)",
                    }}
                  >
                    <Send size={18} />
                    {loading ? "Sending..." : "Send Message"}
                  </button>
                </form>
              </Tilt3D>
            </motion.div>

            <motion.div variants={fadeUp} className="space-y-4 pt-2">
              <SectionHeading
                eyebrow="Contact Details"
                title="Reach Us Directly"
                description="Use phone, email, WhatsApp, or visit our center."
                align="left"
              />

              <div className="mt-8 space-y-4">
                {contacts.map((c) => (
                  <Link
                    key={c.label}
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    className="flex items-start gap-4 rounded-2xl glass-card p-5 transition hover:-translate-y-1 hover:shadow-glow"
                  >
                    <div
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-primary-foreground"
                      style={{
                        background: "var(--gradient-primary)",
                        boxShadow: "var(--shadow-glow)",
                      }}
                    >
                      <c.Icon size={20} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {c.label}
                      </p>
                      <p
                        className={`mt-0.5 text-sm font-semibold ${
                          c.color ?? "text-foreground"
                        }`}
                      >
                        {c.value}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {c.sub}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="map" className="mx-auto max-w-7xl px-6 pb-20">
        <div className="overflow-hidden rounded-3xl glass-card">
          <div className="p-6">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Google Maps Location
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {hospitalInfo.address}
            </p>
          </div>

          <iframe
            title="Medilink Health Care Location"
            src="https://www.google.com/maps?q=Dhanmondi%2027%20Dhaka%20Bangladesh&output=embed"
            className="h-[380px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      <PublicFooter />
    </>
  );
}