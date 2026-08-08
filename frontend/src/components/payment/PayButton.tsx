"use client";

import { useState } from "react";
import { initiatePayment, type PayOptions } from "@/lib/payment";
import { apiFetch } from "@/lib/apiFetch";

type Props = {
  amount: number;
  invoiceCode: string;
  description?: string;
  label?: string;
  className?: string;
  prefill?: PayOptions["prefill"];
  purpose?: PayOptions["purpose"];
  referenceId?: string;
  onSuccess: PayOptions["onSuccess"];
  onFailure?: PayOptions["onFailure"];
};

export default function PayButton({
  amount,
  invoiceCode,
  description = "Invoice payment",
  label,
  className = "",
  prefill,
  purpose,
  referenceId,
  onSuccess,
  onFailure,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  async function handleCash() {
    setBusy(true);
    try {
      const res = await apiFetch("/api/payment/mark-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceCode, purpose, referenceId, amount })
      });
      if (res.ok) {
        const data = await res.json();
        onSuccess({ success: true, paymentId: data.paymentId, orderId: "cash", method: "cash" });
      } else {
        onFailure?.({ success: false, error: "Failed to mark as paid via cash" });
      }
    } catch (e: any) {
      onFailure?.({ success: false, error: e.message });
    } finally {
      setBusy(false);
      setShowOptions(false);
    }
  }

  function handleRazorpay() {
    setBusy(true);
    initiatePayment({
      amount,
      invoiceCode,
      description,
      prefill,
      purpose,
      referenceId,
      onSuccess: (r) => { setBusy(false); setShowOptions(false); onSuccess(r); },
      onFailure: (r) => { setBusy(false); setShowOptions(false); onFailure?.(r); },
    });
  }

  if (showOptions) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <p className="text-xs font-bold text-slate-500 mb-1 text-center">Select Payment Method</p>
        <button
          disabled={busy}
          onClick={handleCash}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-100 px-6 py-2.5 text-sm font-black text-emerald-800 hover:bg-emerald-200 active:scale-[0.97] disabled:opacity-50 transition w-full"
        >
          {busy ? "Processing…" : "Pay via Cash"}
        </button>
        <button
          disabled={busy}
          onClick={handleRazorpay}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-black text-white hover:bg-blue-500 active:scale-[0.97] disabled:opacity-50 transition w-full"
        >
          {busy ? "Processing…" : "Pay via Razorpay"}
        </button>
        <button
          disabled={busy}
          onClick={() => setShowOptions(false)}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 underline mt-1"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      disabled={busy}
      onClick={() => setShowOptions(true)}
      className={`inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-black text-white shadow-sm hover:bg-emerald-500 active:scale-[0.97] disabled:opacity-50 transition ${className}`}
    >
      {label ?? `Pay ৳${amount.toLocaleString()}`}
    </button>
  );
}
