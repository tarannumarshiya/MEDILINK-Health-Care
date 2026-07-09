"use client";

import { motion } from "motion/react";
import { Stethoscope, Pill, Activity, Syringe, Microscope, Thermometer } from "lucide-react";

/**
 * Real clinical instruments only — no love hearts, no generic symbols.
 * Stethoscope, Syringe, Thermometer, Microscope, Pill, Activity (ECG)
 */
const icons = [
  { Icon: Stethoscope,  top: "12%", left: "8%",  delay: 0,   size: 28, color: "text-primary" },
  { Icon: Syringe,      top: "22%", left: "88%", delay: 0.6, size: 26, color: "text-cyan"    },
  { Icon: Pill,         top: "68%", left: "12%", delay: 1.2, size: 30, color: "text-mint"    },
  { Icon: Activity,     top: "78%", left: "82%", delay: 0.4, size: 34, color: "text-primary" },
  { Icon: Microscope,   top: "45%", left: "94%", delay: 0.9, size: 24, color: "text-cyan"    },
  { Icon: Thermometer,  top: "55%", left: "4%",  delay: 1.5, size: 26, color: "text-mint"    },
];

export function FloatingMedicalIcons() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {icons.map(({ Icon, top, left, delay, size, color }, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top, left }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.8, 0.65, 0.8],
            scale: 1,
            y: [0, -22, 0],
            rotate: [0, 8, -8, 0],
          }}
          transition={{
            opacity: { duration: 1, delay },
            scale:   { duration: 0.6, delay },
            y:       { duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay },
            rotate:  { duration: 8 + i, repeat: Infinity, ease: "easeInOut", delay },
          }}
        >
          <div className={`glass flex items-center justify-center rounded-2xl p-3 ${color}`}>
            <Icon size={size} strokeWidth={1.8} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
