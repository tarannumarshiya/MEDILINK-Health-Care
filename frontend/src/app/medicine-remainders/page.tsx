"use client";

import { useState } from "react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { Bell, Calendar, Pill, Trash2, Loader2, Search } from "lucide-react";

type Reminder = {
  id: string;
  patient_phone: string;
  medicine_name: string;
  frequency: string;
  next_reminder_date: string;
  notes: string | null;
  is_active: boolean;
};

export default function MedicineRemindersPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  async function loadReminders() {
    if (!phone.trim()) {
      alert("Please enter phone number.");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(
        `http://localhost:4000/api/reminders?patient_phone=${encodeURIComponent(
          phone.trim()
        )}`
      );

      const data: { success: boolean; reminders?: Reminder[]; error?: string } =
        await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to load reminders.");
        return;
      }

      setReminders(data.reminders || []);
    } catch {
      alert("Backend not reachable. Please check backend server on port 4000.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteReminder(id: string) {
    if (!confirm("Delete reminder?")) return;

    try {
      await fetch(`http://localhost:4000/api/reminders/${id}`, {
        method: "DELETE",
      });

      await loadReminders();
    } catch {
      alert("Failed to delete reminder.");
    }
  }

  return (
    <>
      <PublicNavbar />

      <main className="pb-20 pt-28">
        <section className="mx-auto max-w-7xl px-6">
          <div className="mb-10 text-center">
            <div
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Bell size={38} className="text-white" />
            </div>

            <h1 className="font-display text-4xl font-extrabold sm:text-5xl">
              Medicine Reminders
            </h1>

            <p className="mt-4 text-muted-foreground">
              Search your phone number to view and manage recurring medicine
              reminders.
            </p>
          </div>

          <div className="mx-auto mb-10 flex max-w-xl gap-3">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadReminders();
              }}
              placeholder="Enter phone number"
              className="w-full rounded-2xl border border-border p-4 outline-none focus:border-primary"
            />

            <button
              onClick={loadReminders}
              disabled={loading}
              className="flex items-center gap-2 rounded-2xl px-6 font-bold text-white disabled:opacity-60"
              style={{ background: "var(--gradient-primary)" }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}
              Search
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto animate-spin text-primary" size={42} />
              <p className="mt-4 font-semibold text-muted-foreground">
                Loading reminders...
              </p>
            </div>
          ) : !searched ? (
            <div className="rounded-3xl glass-card p-16 text-center">
              <Bell className="mx-auto text-primary" size={48} />
              <h3 className="mt-5 text-2xl font-bold">
                Search your reminders
              </h3>
              <p className="mt-3 text-muted-foreground">
                Enter your phone number and click Search.
              </p>
            </div>
          ) : reminders.length === 0 ? (
            <div className="rounded-3xl glass-card p-16 text-center">
              <Bell className="mx-auto text-primary" size={48} />
              <h3 className="mt-5 text-2xl font-bold">No reminders found</h3>
              <p className="mt-3 text-muted-foreground">
                Save reminders from the Pharmacy page.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reminders.map((item) => (
                <div key={item.id} className="rounded-3xl glass-card p-6">
                  <div className="flex items-center gap-3">
                    <Pill className="text-primary" size={24} />
                    <h2 className="text-lg font-bold">{item.medicine_name}</h2>
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <p>
                      <strong>Phone:</strong> {item.patient_phone}
                    </p>

                    <p>
                      <strong>Frequency:</strong> {item.frequency}
                    </p>

                    <p className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>
                        <strong>Next Reminder:</strong>{" "}
                        {item.next_reminder_date}
                      </span>
                    </p>

                    <p>
                      <strong>Status:</strong>{" "}
                      {item.is_active ? "Active" : "Paused"}
                    </p>

                    {item.notes && (
                      <p>
                        <strong>Notes:</strong> {item.notes}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteReminder(item.id)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 py-3 font-bold text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 size={17} />
                    Delete Reminder
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </>
  );
}