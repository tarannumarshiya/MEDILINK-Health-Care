"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import { Bell, Calendar, Pill, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/apiFetch";

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
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setAuthLoading(false);

      if (data.session) {
        setLoading(true);
        apiFetch("/api/reminders")
          .then(async (res) => {
            const body: { success: boolean; reminders?: Reminder[]; error?: string } =
              await res.json();
            if (body.success) setReminders(body.reminders || []);
          })
          .finally(() => setLoading(false));
      }
    });
  }, []);

  async function deleteReminder(id: string) {
    if (!confirm("Delete reminder?")) return;

    try {
      const res = await apiFetch(`/api/reminders/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        alert(body?.error || "Failed to delete reminder.");
        return;
      }
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("Failed to delete reminder.");
    }
  }

  if (authLoading) {
    return (
      <>
        <PublicNavbar />
        <main className="pb-20 pt-28 text-center">
          <Loader2 className="mx-auto animate-spin text-primary" size={42} />
        </main>
        <PublicFooter />
      </>
    );
  }

  if (!signedIn) {
    return (
      <>
        <PublicNavbar />
        <main className="pb-20 pt-28">
          <section className="mx-auto max-w-2xl px-6">
            <div className="rounded-3xl glass-card p-12 text-center">
              <div
                className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Bell size={38} className="text-white" />
              </div>
              <h1 className="font-display text-3xl font-extrabold">Medicine Reminders</h1>
              <p className="mx-auto mt-4 max-w-md text-muted-foreground">
                For privacy, medicine reminders are now shown only to the logged-in
                owning patient. Please sign in to view and manage your reminders.
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Link
                  href="/patient/login"
                  className="rounded-2xl px-6 py-3 font-bold text-white"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  Sign in
                </Link>
                <Link
                  href="/patient/register"
                  className="rounded-2xl border-2 px-6 py-3 font-bold"
                >
                  Create account
                </Link>
              </div>
            </div>
          </section>
        </main>
        <PublicFooter />
      </>
    );
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
              Your reminders. You can only see and manage the reminders saved to your
              account.
            </p>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto animate-spin text-primary" size={42} />
              <p className="mt-4 font-semibold text-muted-foreground">
                Loading reminders...
              </p>
            </div>
          ) : reminders.length === 0 ? (
            <div className="rounded-3xl glass-card p-16 text-center">
              <Bell className="mx-auto text-primary" size={48} />
              <h3 className="mt-5 text-2xl font-bold">No reminders found</h3>
              <p className="mt-3 text-muted-foreground">
                Save reminders from the Pharmacy page while signed in, and they will
                appear here.
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