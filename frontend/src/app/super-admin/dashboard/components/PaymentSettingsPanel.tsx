"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Panel } from "@/components/dashboard/Panel";
import { apiFetch } from "@/lib/apiFetch";

export function PaymentSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [keys, setKeys] = useState({ RAZORPAY_KEY_ID: "", RAZORPAY_KEY_SECRET: "" });

  useEffect(() => {
    apiFetch("/api/payment/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.settings) {
          setKeys({
            RAZORPAY_KEY_ID: data.settings.RAZORPAY_KEY_ID || "",
            RAZORPAY_KEY_SECRET: data.settings.RAZORPAY_KEY_SECRET || "",
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setMsg("Failed to load payment settings");
        setLoading(false);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await apiFetch("/api/payment/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(keys),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg("Payment settings saved successfully.");
      } else {
        setMsg(data.error || "Failed to save payment settings.");
      }
    } catch {
      setMsg("Failed to save payment settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-slate-500">Loading settings...</div>;
  }

  return (
    <Panel title="Payment Gateway Settings" subtitle="Configure Razorpay live keys">
      {msg && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-teal-200 bg-teal-50 px-5 py-3 text-sm font-bold text-teal-800">
          {msg}
          <button onClick={() => setMsg("")} className="ml-4 text-teal-500 hover:text-teal-700">✕</button>
        </div>
      )}

      <form onSubmit={save} className="grid gap-6 max-w-2xl">
        <div>
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">
            Razorpay Key ID
          </label>
          <input
            type="text"
            required
            className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-500 font-mono"
            value={keys.RAZORPAY_KEY_ID}
            onChange={(e) => setKeys({ ...keys, RAZORPAY_KEY_ID: e.target.value })}
            placeholder="rzp_test_..."
          />
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-widest text-slate-500">
            Razorpay Key Secret
          </label>
          <input
            type="password"
            required
            className="mt-1 w-full rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-teal-500 font-mono"
            value={keys.RAZORPAY_KEY_SECRET}
            onChange={(e) => setKeys({ ...keys, RAZORPAY_KEY_SECRET: e.target.value })}
            placeholder="Secret Key"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex w-fit items-center justify-center gap-2 rounded-2xl bg-slate-950 px-8 py-3 font-black text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Settings"}
        </button>
      </form>
    </Panel>
  );
}
