"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X, Printer } from "lucide-react";

interface Props {
  open: boolean;
  invoiceCode?: string;
  amount?: number;
  patientName?: string;
  method?: string;
  onClose: () => void;
}

export default function PaymentSuccessModal({
  open,
  invoiceCode,
  amount,
  patientName,
  method = "Razorpay",
  onClose,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      // slight delay so CSS transition fires
      setTimeout(() => setAnimating(true), 10);
    } else {
      setAnimating(false);
      setTimeout(() => setVisible(false), 300);
    }
  }, [open]);

  if (!visible) return null;

  const time = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center px-4"
      style={{
        background: animating ? "rgba(2,6,23,0.65)" : "rgba(2,6,23,0)",
        backdropFilter: animating ? "blur(6px)" : "blur(0px)",
        transition: "background 0.3s, backdrop-filter 0.3s",
      }}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
        style={{
          transform: animating ? "scale(1) translateY(0)" : "scale(0.85) translateY(40px)",
          opacity: animating ? 1 : 0,
          transition: "transform 0.35s cubic-bezier(.34,1.56,.64,1), opacity 0.3s",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Hero gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 px-8 py-10 text-center">
          {/* Dot grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[.08]"
            style={{
              backgroundImage: "radial-gradient(circle,#fff 1.5px,transparent 1.5px)",
              backgroundSize: "22px 22px",
            }}
          />
          {/* Glow rings */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className="h-40 w-40 rounded-full border border-white/20"
              style={{ animation: "ping 2s ease-out infinite" }}
            />
          </div>
          <div className="relative flex flex-col items-center gap-3">
            {/* Animated check */}
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30"
              style={{
                animation: animating ? "bounceIn 0.5s 0.1s both" : "none",
              }}
            >
              <CheckCircle2 className="h-11 w-11 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-white/70">
                Payment Successful
              </p>
              <h2 className="mt-1 text-3xl font-black text-white">
                {amount != null ? `৳${amount.toLocaleString()}` : "Paid!"}
              </h2>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-5 space-y-3">
          {[
            { label: "Status",        value: "✅ Confirmed", highlight: true },
            invoiceCode ? { label: "Invoice",   value: invoiceCode } : null,
            patientName ? { label: "Patient",   value: patientName } : null,
            { label: "Method",        value: method },
            { label: "Time",          value: time },
          ]
            .filter(Boolean)
            .map((row) => (
              <div
                key={row!.label}
                className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${
                  row!.highlight
                    ? "bg-emerald-50 border border-emerald-100"
                    : "bg-slate-50"
                }`}
              >
                <span className="text-sm font-semibold text-slate-500">{row!.label}</span>
                <span
                  className={`text-sm font-black ${
                    row!.highlight ? "text-emerald-700" : "text-slate-800"
                  }`}
                >
                  {row!.value}
                </span>
              </div>
            ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-slate-100 px-6 pb-6 pt-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 text-sm font-black text-white shadow-sm hover:brightness-110 active:scale-[0.98] transition"
          >
            Done
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounceIn {
          0%   { transform: scale(0.3); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          80%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes ping {
          0%   { transform: translate(-50%,-50%) scale(0.5); opacity: 0.6; }
          100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
