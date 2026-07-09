"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Phone, AlertCircle, Mail, Headphones, Send } from "lucide-react";
import { SectionHeading } from "@/components/public/SectionHeading";
import { Tilt3D } from "@/components/public/Tilt3D";
import { GradientBlobs } from "@/components/public/GradientBlobs";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";

const details = [
  { Icon: Phone,       label: "Phone",     value: "+880 1712 889900"           },
  { Icon: AlertCircle, label: "Emergency", value: "+880 1999 123456"           },
  { Icon: Mail,        label: "Email",     value: "info@medilinkhealth.com"    },
  { Icon: Headphones,  label: "Support",   value: "care@medilinkhealth.com"    },
];

const inputCls = "h-12 w-full rounded-xl border border-input bg-background/60 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition";
const errorCls = "mt-1 text-xs font-semibold text-red-500";

function validateName(v: string) {
  if (!v.trim()) return "Full name is required.";
  if (!/^[A-Za-z\s.'-]+$/.test(v.trim())) return "Name must contain only letters.";
  if (v.trim().length < 2) return "Name must be at least 2 characters.";
  return "";
}

function validateEmail(v: string) {
  if (!v.trim()) return "Email is required.";
  // Must have @, a dot after @, and end with a proper TLD
  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v.toLowerCase())) return "Enter a valid email (e.g. you@example.com).";
  return "";
}

function validateMessage(v: string) {
  if (!v.trim()) return "Message is required.";
  if (v.trim().length < 10) return "Message must be at least 10 characters.";
  return "";
}

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({ name: "", email: "", message: "" });
  const [touched, setTouched] = useState({ name: false, email: false, message: false });
  const [sent, setSent] = useState(false);

  function handleBlur(field: keyof typeof form) {
    setTouched(t => ({ ...t, [field]: true }));
    validate(field, form[field]);
  }

  function validate(field: keyof typeof form, value: string) {
    let err = "";
    if (field === "name")    err = validateName(value);
    if (field === "email")   err = validateEmail(value);
    if (field === "message") err = validateMessage(value);
    setErrors(e => ({ ...e, [field]: err }));
    return err;
  }

  function handleChange(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (touched[field]) validate(field, value);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Validate all fields on submit
    const nameErr    = validateName(form.name);
    const emailErr   = validateEmail(form.email);
    const messageErr = validateMessage(form.message);
    setErrors({ name: nameErr, email: emailErr, message: messageErr });
    setTouched({ name: true, email: true, message: true });
    if (nameErr || emailErr || messageErr) return;
    setSent(true);
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <section id="contact" className="relative overflow-hidden py-14">
      <GradientBlobs className="opacity-50" />
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Contact"
          title="Let's Talk About Your Health"
          description="Reach our team for appointments, support or partnership enquiries."
        />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-10 grid gap-8 lg:grid-cols-2"
        >
          {/* Contact details */}
          <motion.div variants={fadeUp} className="space-y-4">
            {details.map(({ Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4 rounded-2xl glass-card p-5">
                <div
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-primary-foreground"
                  style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-0.5 font-medium">{value}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Form */}
          <motion.div variants={fadeUp}>
            <Tilt3D intensity={6}>
              {sent ? (
                <div className="flex h-full items-center justify-center rounded-3xl glass-card p-10 text-center">
                  <div>
                    <p className="text-4xl mb-3">✅</p>
                    <p className="font-display text-lg font-bold text-foreground">Message Sent!</p>
                    <p className="mt-2 text-sm text-muted-foreground">Our team will reach out shortly.</p>
                    <button
                      onClick={() => { setSent(false); setTouched({ name: false, email: false, message: false }); setErrors({ name: "", email: "", message: "" }); }}
                      className="mt-5 text-sm font-semibold text-primary hover:underline"
                    >
                      Send another →
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl glass-card p-7" noValidate>
                  <div>
                    <input
                      placeholder="Full name"
                      value={form.name}
                      onChange={e => handleChange("name", e.target.value)}
                      onBlur={() => handleBlur("name")}
                      className={`${inputCls} ${touched.name && errors.name ? "border-red-400 focus:ring-red-300" : ""}`}
                    />
                    {touched.name && errors.name && <p className={errorCls}>{errors.name}</p>}
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={form.email}
                      onChange={e => handleChange("email", e.target.value)}
                      onBlur={() => handleBlur("email")}
                      className={`${inputCls} ${touched.email && errors.email ? "border-red-400 focus:ring-red-300" : ""}`}
                    />
                    {touched.email && errors.email && <p className={errorCls}>{errors.email}</p>}
                  </div>
                  <div>
                    <textarea
                      rows={5}
                      placeholder="How can we help you?"
                      value={form.message}
                      onChange={e => handleChange("message", e.target.value)}
                      onBlur={() => handleBlur("message")}
                      className={`w-full rounded-xl border border-input bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition resize-none ${touched.message && errors.message ? "border-red-400 focus:ring-red-300" : ""}`}
                    />
                    {touched.message && errors.message && <p className={errorCls}>{errors.message}</p>}
                  </div>
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
                    style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
                  >
                    <Send size={18} /> Send Message
                  </button>
                </form>
              )}
            </Tilt3D>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
