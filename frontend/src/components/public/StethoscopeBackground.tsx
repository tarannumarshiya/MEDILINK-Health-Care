"use client";

import { motion, useScroll, useTransform } from "motion/react";

/**
 * Global background — fixed, shows through all transparent sections.
 * ECG line is now large, spans the full viewport height visually,
 * and animates as a continuous scrolling pulse.
 */

function ECGStrip({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
    >
      <polyline
        points="
          0,110
          60,110 80,100 95,110 120,110
          135,52 152,168 170,8 188,172 204,56 218,110
          260,110 280,100 298,110 340,110
          355,52 372,168 390,8 408,172 424,56 438,110
          480,110 500,100 518,110 560,110
          575,52 592,168 610,8 628,172 644,56 658,110
          700,110 720,100 738,110 780,110
          795,52 812,168 830,8 848,172 864,56 878,110
          920,110 940,100 958,110 1000,110
          1015,52 1032,168 1050,8 1068,172 1084,56 1098,110
          1140,110 1160,100 1178,110 1200,110
        "
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function StethoscopeBackground() {
  const { scrollYProgress } = useScroll();
  const yBlob1 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const yBlob2 = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
      style={{ background: "var(--gradient-soft)" }}
    >
      {/* Ambient blobs */}
      <motion.div
        style={{ y: yBlob1 }}
        className="absolute -left-40 top-1/4 h-[600px] w-[600px] rounded-full bg-primary/14 blur-[130px]"
      />
      <motion.div
        style={{ y: yBlob2 }}
        className="absolute -right-32 top-1/3 h-[500px] w-[500px] rounded-full bg-cyan/10 blur-[110px]"
      />
      <div className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-mint/10 blur-[100px]" />

      {/* ── PRIMARY ECG — large, animates left, bottom 15% ── */}
      <div className="absolute bottom-[10%] left-0 right-0 overflow-hidden text-foreground opacity-[0.13]">
        <motion.div
          className="flex"
          style={{ width: "200%" }}
          animate={{ x: [0, "-50%"] }}
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
        >
          <ECGStrip className="h-[120px] w-1/2 shrink-0" />
          <ECGStrip className="h-[120px] w-1/2 shrink-0" />
        </motion.div>
      </div>

      {/* ── SECONDARY ECG — slightly smaller, mid-page, moves right ── */}
      <div className="absolute top-[35%] left-0 right-0 overflow-hidden text-primary opacity-[0.18]">
        <motion.div
          className="flex"
          style={{ width: "200%" }}
          animate={{ x: ["-50%", 0] }}
          transition={{ duration: 45, ease: "linear", repeat: Infinity }}
        >
          <ECGStrip className="h-[90px] w-1/2 shrink-0 scale-y-[-1]" />
          <ECGStrip className="h-[90px] w-1/2 shrink-0 scale-y-[-1]" />
        </motion.div>
      </div>

      {/* Dot grid texture */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.032]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="medicaldots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="currentColor" className="text-foreground" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#medicaldots)" />
      </svg>
    </div>
  );
}