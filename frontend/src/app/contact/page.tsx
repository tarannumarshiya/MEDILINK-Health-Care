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
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!form.full_name.trim() || form.full_name.trim().length < 2) {
      newErrors.full_name = "Full name must be at least 2 characters.";
    } else if (!/^[A-Za-z\s.'-]+$/.test(form.full_name.trim())) {
      newErrors.full_name = "Full name must contain only letters.";
    }
    
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(form.email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    if (form.phone) {
      const raw = form.phone.replace(/[\s\-]/g, "");
      if (!/^(?:\+?880)?01[3-9]\d{8}$/.test(raw)) {
        newErrors.phone = "Enter a valid Bangladeshi phone number.";
      }
    }

    if (!form.subject.trim() || form.subject.trim().length < 3) {
      newErrors.subject = "Subject must be at least 3 characters.";
    }

    if (!form.message.trim() || form.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setError("Please fix the validation errors above.");
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
                        className={`${inputCls} ${errors.full_name ? "border-red-400 focus:ring-red-300" : ""}`}
                        value={form.full_name}
                        onChange={(e) => {
                          setForm({ ...form, full_name: e.target.value });
                          if (errors.full_name) setErrors(prev => ({ ...prev, full_name: "" }));
                        }}
                      />
                      {errors.full_name && <p className="mt-1 text-xs font-semibold text-red-500">{errors.full_name}</p>}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Email Address
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="you@example.com"
                        className={`${inputCls} ${errors.email ? "border-red-400 focus:ring-red-300" : ""}`}
                        value={form.email}
                        onChange={(e) => {
                          setForm({ ...form, email: e.target.value });
                          if (errors.email) setErrors(prev => ({ ...prev, email: "" }));
                        }}
                      />
                      {errors.email && <p className="mt-1 text-xs font-semibold text-red-500">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Phone Number
                      </label>
                      <input
                        placeholder="+880 17XX XXXXXX"
                        className={`${inputCls} ${errors.phone ? "border-red-400 focus:ring-red-300" : ""}`}
                        value={form.phone}
                        onChange={(e) => {
                          setForm({ ...form, phone: e.target.value });
                          if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }));
                        }}
                      />
                      {errors.phone && <p className="mt-1 text-xs font-semibold text-red-500">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Subject
                      </label>
                      <input
                        required
                        placeholder="How can we help?"
                        className={`${inputCls} ${errors.subject ? "border-red-400 focus:ring-red-300" : ""}`}
                        value={form.subject}
                        onChange={(e) => {
                          setForm({ ...form, subject: e.target.value });
                          if (errors.subject) setErrors(prev => ({ ...prev, subject: "" }));
                        }}
                      />
                      {errors.subject && <p className="mt-1 text-xs font-semibold text-red-500">{errors.subject}</p>}
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
                      className={`w-full resize-none rounded-xl border border-input bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition focus:outline-none focus:ring-2 focus:ring-ring ${errors.message ? "border-red-400 focus:ring-red-300" : ""}`}
                      value={form.message}
                      onChange={(e) => {
                        setForm({ ...form, message: e.target.value });
                        if (errors.message) setErrors(prev => ({ ...prev, message: "" }));
                      }}
                    />
                    {errors.message && <p className="mt-1 text-xs font-semibold text-red-500">{errors.message}</p>}
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