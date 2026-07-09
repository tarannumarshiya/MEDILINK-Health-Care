"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Pill, ShoppingCart } from "lucide-react";
import { SectionHeading } from "@/components/public/SectionHeading";

type Medicine = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  quantity: number;
  requires_prescription: boolean;
};

export function Pharmacy() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pharmacy/medicines")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.medicines)) {
          setMedicines(json.medicines.slice(0, 4));
        }
      })
      .catch(() => setMedicines([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="pharmacy" className="relative overflow-hidden py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHeading
              eyebrow="Pharmacy"
              title="Pharmacy Services"
              description="Browse available medicines, upload prescriptions, and continue to the full pharmacy catalogue."
            />

            <div className="mt-7 grid gap-3">
              {[
                "Prescription-based medicine ordering",
                "Real pharmacy catalogue from the system",
                "Cart, prescription upload, and payment flow",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <Pill size={17} />
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/pharmacy"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              style={{
                background: "var(--gradient-primary)",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              Visit Pharmacy
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="rounded-3xl glass-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Medicine Preview
                </h3>
                <p className="text-sm text-muted-foreground">
                  Latest available medicines
                </p>
              </div>
              <ShoppingCart className="text-primary" size={24} />
            </div>

            {loading ? (
              <div className="flex h-52 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : medicines.length === 0 ? (
              <div className="flex h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/50 text-center">
                <Pill className="mb-3 text-primary" size={34} />
                <p className="font-bold text-foreground">
                  Pharmacy catalogue will appear here
                </p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Medicines are managed from the pharmacy system. Open the full
                  pharmacy page to view the catalogue.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {medicines.map((med) => (
                  <div
                    key={med.id}
                    className="rounded-2xl border border-border bg-background/60 p-4"
                  >
                    <p className="text-xs font-bold uppercase text-primary">
                      {med.category}
                    </p>
                    <h4 className="mt-1 font-display text-base font-bold text-foreground">
                      {med.name}
                    </h4>
                    <p className="mt-2 font-bold text-primary">৳{med.price}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {med.quantity > 0 ? `${med.quantity} in stock` : "Out of stock"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}