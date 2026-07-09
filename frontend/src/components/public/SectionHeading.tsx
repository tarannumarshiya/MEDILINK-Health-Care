"use client";

import { motion } from "motion/react";
import { fadeUp, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {/* Eyebrow — solid white with dark background pill so it reads on any background */}
      <span
        className="inline-block rounded-full px-4 py-1 text-xs font-black uppercase tracking-[0.28em]"
        style={{
          background: "oklch(0.12 0.08 248 / 0.85)",
          color: "#ffffff",
          letterSpacing: "0.28em",
        }}
      >
        {eyebrow}
      </span>
      <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.05]"
        style={{ color: "oklch(0.10 0.08 248)" }}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed" style={{ color: "oklch(0.18 0.06 240)" }}>{description}</p>
      )}
    </motion.div>
  );
}
