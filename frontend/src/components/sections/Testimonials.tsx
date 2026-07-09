"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { SectionHeading } from "@/components/public/SectionHeading";

const testimonials = [
  {
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=112&h=112&fit=crop&crop=face&q=80",
    name: "Nusrat Jahan",
    role: "Patient, Dhaka",
    quote: "Booking a specialist took seconds and my reports were on my phone the same day. Medilink completely changed how I manage my family's health.",
  },
  {
    img: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=112&h=112&fit=crop&crop=face&q=80",
    name: "Rakib Hasan",
    role: "Patient, Chattogram",
    quote: "The emergency support team responded within minutes during a crisis. Professional, fast and genuinely caring — I can't recommend them enough.",
  },
  {
    img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=112&h=112&fit=crop&crop=face&q=80",
    name: "Shamima Akter",
    role: "Patient, Sylhet",
    quote: "As a senior, the digital health records and home sample collection make everything so easy. It feels like having a hospital in my pocket.",
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = testimonials[index];

  const go = useCallback((dir: number) =>
    setIndex((i) => (i + dir + testimonials.length) % testimonials.length),
    []
  );

  // Auto-scroll every 2.2 seconds
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => go(1), 2200);
    return () => clearInterval(timer);
  }, [go, paused]);

  return (
    <section
      className="relative overflow-hidden py-14"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-4xl px-6">
        <SectionHeading eyebrow="Testimonials" title="Loved by Patients" />
        <div className="relative mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl glass-card p-8 text-center sm:p-12"
            >
              <Quote className="mx-auto text-primary/40" size={44} />
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-foreground/90">
                &ldquo;{active.quote}&rdquo;
              </p>
              <div className="mt-6 flex justify-center gap-1 text-mint">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>
              <div className="mt-6 flex items-center justify-center gap-3">
                <img
                  src={active.img}
                  alt={active.name}
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/30"
                />
                <div className="text-left">
                  <p className="font-display font-semibold">{active.name}</p>
                  <p className="text-sm text-muted-foreground">{active.role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="mt-6 h-0.5 w-full overflow-hidden rounded-full bg-primary/15">
            <motion.div
              key={`progress-${index}`}
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: paused ? undefined : "100%" }}
              transition={{ duration: 2.2, ease: "linear" }}
            />
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => { setPaused(true); go(-1); }}
              aria-label="Previous"
              className="glass flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:text-primary"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setPaused(true); setIndex(i); }}
                  aria-label={`Testimonial ${i + 1}`}
                  className={`h-2.5 rounded-full transition-all ${i === index ? "w-7 bg-primary" : "w-2.5 bg-primary/30"}`}
                />
              ))}
            </div>
            <button
              onClick={() => { setPaused(true); go(1); }}
              aria-label="Next"
              className="glass flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:text-primary"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
