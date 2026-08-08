"use client";
import React from "react";
import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { QrCode, CheckCircle2, RefreshCw, X, Clock } from "lucide-react";

interface Props {
  invoiceCode: string;
  amount: number;
  purpose?: "invoice" | "pharmacy_order";
  referenceId?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (paymentId: string) => void;
  onClose?: () => void;
  className?: string;
}

type QrState = "idle" | "loading" | "ready" | "polling" | "paid" | "error";

const POLL_INTERVAL_MS = 1500;  // check every 1.5 seconds
const QR_EXPIRY_SECS   = 900;   // 15 minutes

export default function RazorpayQR({
  invoiceCode,
  amount,
  purpose = "invoice",
  referenceId,
  prefill: _prefill,   // accepted for API compatibility, not used in QR flow
  onSuccess,
  onClose,
  className = "",
}: Props) {
  const [open, setOpen]         = useState(false);
  const [state, setState]       = useState<QrState>("idle");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [qrId, setQrId]         = useState<string>("");
  const [error, setError]       = useState<string>("");
  const [secondsLeft, setSeconds] = useState(QR_EXPIRY_SECS);

  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearAll() {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function generateQR() {
    clearAll();
    setState("loading");
    setError("");
    setSeconds(QR_EXPIRY_SECS);

    try {
      const res = await apiFetch("/api/payment/create-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceCode, purpose, referenceId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setState("error");
        setError(data.error ?? "Failed to generate QR code.");
        return;
      }
      setImageUrl(data.imageUrl);
      setQrId(data.qrId);
      setState("ready");
      startPolling(data.qrId);
      startCountdown();
    } catch {
      setState("error");
      setError("Network error. Please try again.");
    }
  }

  function startPolling(id: string) {
    setState("polling");
    pollRef.current = setInterval(async () => {
      try {
        const res = await apiFetch("/api/payment/verify-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrId: id, invoiceCode, purpose, referenceId, amount }),
        });
        const data = await res.json();
        if (data.verified) {
          clearAll();
          setState("paid");
          setTimeout(() => {
            setOpen(false);
            onSuccess(data.paymentId ?? "");
          }, 2000);
        }
      } catch { /* keep polling */ }
    }, POLL_INTERVAL_MS);
  }

  function startCountdown() {
    timerRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearAll();
          setState("error");
          setError("QR code expired. Please generate a new one.");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function handleOpen() {
    setOpen(true);
    generateQR();
  }

  function handleClose() {
    clearAll();
    setOpen(false);
    setState("idle");
    setImageUrl("");
    setQrId("");
    setError("");
    onClose?.();
  }

  useEffect(() => () => clearAll(), []);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className={`inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-black text-white shadow-sm hover:bg-violet-500 active:scale-[0.97] transition ${className}`}
      >
        <QrCode className="h-4 w-4" />
        Pay via QR
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* Header */}
            <div className="relative bg-gradient-to-br from-violet-700 via-violet-600 to-purple-700 px-6 py-5 text-center">
              <div
                className="pointer-events-none absolute inset-0 opacity-[.07]"
                style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "18px 18px" }}
              />
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20 transition"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="relative">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Scan &amp; Pay</p>
                <h2 className="mt-0.5 text-xl font-black text-white">Razorpay QR Code</h2>
                <p className="mt-1 text-sm font-bold text-white/70">
                  ৳{amount.toLocaleString()} — {invoiceCode}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">

              {/* Loading */}
              {(state === "loading") && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
                  <p className="text-sm font-bold text-slate-500">Generating QR code…</p>
                </div>
              )}

              {/* QR Image */}
              {(state === "ready" || state === "polling") && imageUrl && (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="rounded-2xl border-4 border-violet-100 bg-white p-2 shadow-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt="Razorpay UPI QR Code"
                        className="h-56 w-56 object-contain"
                      />
                    </div>
                    {/* Scanning animation overlay */}
                    <div className="pointer-events-none absolute inset-2 overflow-hidden rounded-xl">
                      <div
                        className="absolute left-0 right-0 h-0.5 bg-violet-500/60 animate-scan-line"
                        style={{ boxShadow: "0 0 8px 2px rgba(139,92,246,0.4)" }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-full bg-violet-50 px-4 py-1.5">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
                    <p className="text-xs font-black text-violet-700">Waiting for payment…</p>
                  </div>

                  {/* Timer */}
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-mono font-bold">{mins}:{secs}</span>
                    <span className="text-xs">remaining</span>
                  </div>

                  <p className="text-center text-xs text-slate-400">
                    Open any UPI app (GPay, PhonePe, Paytm…) and scan this code to pay instantly.
                  </p>
                </div>
              )}

              {/* Paid */}
              {state === "paid" && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                  </div>
                  <p className="text-lg font-black text-emerald-700">Payment Received!</p>
                  <p className="text-sm text-slate-500">Invoice marked as paid. Closing…</p>
                </div>
              )}

              {/* Error */}
              {state === "error" && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <p className="text-center text-sm font-bold text-red-600">{error}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={generateQR}
                      className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-black text-white hover:bg-violet-500 transition"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Generate New QR
                    </button>
                    <button
                      onClick={handleClose}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-5 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-300 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {(state === "ready" || state === "polling") && (
              <div className="border-t border-slate-100 px-6 pb-5 pt-3">
                <button
                  onClick={generateQR}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-100 transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh QR Code
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scan line animation */}
      <style>{`
        @keyframes scan-line {
          0%   { top: 4px; }
          50%  { top: calc(100% - 4px); }
          100% { top: 4px; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
