"use client";

import { useState } from "react";
import { Bell, Loader2, X } from "lucide-react";

type Medicine = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  requires_prescription: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  medicine: Medicine | null;
};

type Frequency = "daily" | "weekly" | "monthly" | "every_15_days";

export default function ReminderModal({ open, onClose, medicine }: Props) {
  const [phone, setPhone] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open || !medicine) return null;

  const currentMedicine = medicine;

  async function saveReminder() {
    if (!phone.trim()) {
      alert("Please enter phone number.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("http://localhost:4000/api/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_phone: phone.trim(),
          medicine_id: currentMedicine.id,
          medicine_name: currentMedicine.name,
          frequency,
          notes: notes.trim(),
        }),
      });

      const data: { success: boolean; error?: string } = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to save reminder.");
        return;
      }

      alert("Medicine reminder saved successfully.");
      setPhone("");
      setFrequency("monthly");
      setNotes("");
      onClose();
    } catch {
      alert("Backend not reachable. Please check backend server on port 4000.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="grid h-11 w-11 place-items-center rounded-xl text-white"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Bell size={20} />
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Medicine Reminder
              </h2>
              <p className="text-xs text-muted-foreground">
                Save monthly or regular refill reminder.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-foreground hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              Medicine
            </label>
            <input
              value={currentMedicine.name}
              disabled
              className="w-full rounded-xl border border-border bg-gray-50 p-3 text-sm text-muted-foreground"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              Phone Number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+880 1xxx xxxxxx"
              className="w-full rounded-xl border border-border p-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
              className="w-full rounded-xl border border-border p-3 text-sm outline-none focus:border-primary"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="every_15_days">Every 15 Days</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Example: Buy every month for BP/diabetes..."
              className="w-full resize-none rounded-xl border border-border p-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <button
            type="button"
            onClick={saveReminder}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white disabled:opacity-60"
            style={{ background: "var(--gradient-primary)" }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Save Reminder"}
          </button>
        </div>
      </div>
    </div>
  );
}