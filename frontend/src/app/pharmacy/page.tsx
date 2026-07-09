"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import ReminderModal from "@/components/pharmacy/ReminderModal";
import { usePharmacyCart } from "@/context/PharmacyCartContext";
import {
  Bell,
  Search,
  Plus,
  Pill,
  Truck,
  ShieldCheck,
  Clock,
  Loader2,
  FileText,
} from "lucide-react";
import Link from "next/link";

type Medicine = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  quantity: number;
  image_url: string | null;
  requires_prescription: boolean;
  is_available: boolean;
};

const FALLBACK: Medicine[] = [
  {
    id: "f-1",
    name: "Paracetamol 500mg",
    description: "Fever & mild pain relief",
    category: "Pain Relief",
    price: 3,
    quantity: 500,
    image_url: "/pharmacy/paracetamol.jpg",
    requires_prescription: false,
    is_available: true,
  },
  {
    id: "f-2",
    name: "Amoxicillin 500mg",
    description: "Broad-spectrum antibiotic",
    category: "Antibiotics",
    price: 8,
    quantity: 200,
    image_url: "/pharmacy/amoxicillin.jpg",
    requires_prescription: true,
    is_available: true,
  },
  {
    id: "f-3",
    name: "Cetirizine 10mg",
    description: "Antihistamine for allergies",
    category: "Allergy",
    price: 4,
    quantity: 350,
    image_url: "/pharmacy/cetirizine.jpg",
    requires_prescription: false,
    is_available: true,
  },
  {
    id: "f-4",
    name: "Omeprazole 20mg",
    description: "Acid reflux & stomach ulcers",
    category: "Gastro",
    price: 10,
    quantity: 180,
    image_url: "/pharmacy/omeprazole.jpg",
    requires_prescription: false,
    is_available: true,
  },
  {
    id: "f-5",
    name: "Metformin 500mg",
    description: "Type 2 diabetes management",
    category: "Diabetes",
    price: 6,
    quantity: 45,
    image_url: "/pharmacy/metformin.jpg",
    requires_prescription: true,
    is_available: true,
  },
  {
    id: "f-6",
    name: "Salbutamol Inhaler",
    description: "Relieves bronchospasm in asthma",
    category: "Respiratory",
    price: 180,
    quantity: 35,
    image_url: "/pharmacy/salbutamol-inhaler.jpg",
    requires_prescription: true,
    is_available: true,
  },
  {
    id: "f-7",
    name: "Vitamin C 500mg",
    description: "Immune support supplement",
    category: "Supplements",
    price: 5,
    quantity: 600,
    image_url: "/pharmacy/vitamin-c.jpg",
    requires_prescription: false,
    is_available: true,
  },
  {
    id: "f-8",
    name: "Ibuprofen 400mg",
    description: "Anti-inflammatory pain relief",
    category: "Pain Relief",
    price: 4,
    quantity: 300,
    image_url: "/pharmacy/ibuprofen.jpg",
    requires_prescription: false,
    is_available: true,
  },
];

function catColor(cat: string) {
  const m: Record<string, string> = {
    "Pain Relief": "bg-rose-100/60 text-rose-800 border-rose-300",
    Antibiotics: "bg-amber-100/60 text-amber-800 border-amber-300",
    Allergy: "bg-green-100/60 text-green-800 border-green-300",
    Gastro: "bg-purple-100/60 text-purple-800 border-purple-300",
    Diabetes: "bg-red-100/60 text-red-800 border-red-300",
    Respiratory: "bg-sky-100/60 text-sky-800 border-sky-300",
    Supplements: "bg-yellow-100/60 text-yellow-800 border-yellow-300",
  };

  return m[cat] ?? "bg-teal-100/60 text-teal-800 border-teal-300";
}

function MedicineCard({
  med,
  onAdd,
  onReminder,
}: {
  med: Medicine;
  onAdd: (m: Medicine) => void;
  onReminder: (m: Medicine) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const inStock = med.quantity > 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl glass-card transition duration-200 hover:-translate-y-1 hover:shadow-glow">
      <div className="relative h-44 overflow-hidden" style={{ background: "var(--gradient-soft)" }}>
        {med.image_url && !imgError ? (
          <img
            src={med.image_url}
            alt={med.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2" style={{ background: "var(--gradient-hero)" }}>
            <Pill size={40} className="text-white/80" />
            <span className="text-xs font-bold uppercase tracking-wider text-white/70">{med.category}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
            {med.name}
          </h3>

          {med.requires_prescription && (
            <span className="shrink-0 rounded-full border border-amber-300 bg-amber-100/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
              Rx
            </span>
          )}
        </div>

        {med.description && (
          <p className="text-xs leading-5 text-muted-foreground">{med.description}</p>
        )}

        <span className={`self-start rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${catColor(med.category)}`}>
          {med.category}
        </span>

        <div className="mt-auto pt-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-display text-xl font-extrabold text-primary">৳{med.price}</p>
              <p className={`text-xs font-semibold ${inStock ? "text-mint" : "text-red-500"}`}>
                {inStock ? `${med.quantity} in stock` : "Out of stock"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={!inStock}
              onClick={() => onAdd(med)}
              className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: "var(--gradient-primary)",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              <Plus className="h-4 w-4" />
              Add
            </button>

            <button
              type="button"
              onClick={() => onReminder(med)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm font-bold text-foreground transition hover:bg-primary/10 hover:text-primary"
            >
              <Bell className="h-4 w-4" />
              Reminder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PharmacyPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [toast, setToast] = useState<string | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { addToCart } = usePharmacyCart();

  function loadMedicines() {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    fetch("/api/pharmacy/medicines", { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setMedicines(json.medicines);
        } else {
          setError(json.error || "Failed to load medicines from server.");
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          setError("Request timed out. The server is unresponsive.");
        } else {
          setError("Failed to load medicines. Please check your connection.");
        }
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadMedicines();
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(medicines.map((m) => m.category))],
    [medicines]
  );

  const filtered = useMemo(() => {
    return medicines.filter((m) => {
      const matchCat = activeCategory === "All" || m.category === activeCategory;
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.description ?? "").toLowerCase().includes(search.toLowerCase());

      return matchCat && matchSearch;
    });
  }, [medicines, search, activeCategory]);

  function handleAddToCart(med: Medicine) {
    addToCart({
      id: med.id,
      name: med.name,
      price: med.price,
      image_url: med.image_url,
      category: med.category,
      requires_prescription: med.requires_prescription,
    });

    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(`✓ ${med.name} added to cart`);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }

  function handleOpenReminder(med: Medicine) {
    setSelectedMedicine(med);
    setReminderOpen(true);
  }

  function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  return (
    <div className="min-h-screen">
      <PublicNavbar />

      <section className="relative overflow-hidden pt-24 pb-0 sm:pt-28">
        <div className="absolute inset-0 bg-foreground/5" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full glass px-5 py-2 text-base font-bold tracking-wide text-primary">
            <Pill className="h-4 w-4 text-primary" />
            Medilink Pharmacy
          </span>

          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Trusted <span style={{ color: "oklch(0.12 0.08 248)" }}>Online Pharmacy</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed" style={{ color: "oklch(0.20 0.05 240)" }}>
            Real medicines. Fast delivery. Browse our catalogue, add medicines to your cart, upload prescriptions, and place orders easily.
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-5">
            {[
              { icon: ShieldCheck, label: "100% Genuine Medicines" },
              { icon: Clock, label: "Same-Day Pickup" },
              { icon: Truck, label: "Home Delivery Available" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </div>
            ))}
          </div>

          <div className="mx-auto mt-6 max-w-2xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
                placeholder="Search medicines..."
                className="w-full rounded-2xl border border-border py-3 pl-10 pr-4 text-sm text-foreground shadow-soft placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="mx-auto mt-4 flex max-w-2xl flex-wrap justify-center gap-2 pb-2">
            <Link
              href="/pharmacy/track"
              className="shrink-0 rounded-full bg-slate-900 px-5 py-1.5 text-xs font-bold text-white shadow-md transition-transform hover:scale-105 flex items-center justify-center"
            >
              Track Order
            </Link>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                  activeCategory === cat
                    ? "text-primary-foreground"
                    : "glass border border-border text-foreground hover:border-primary/50"
                }`}
                style={
                  activeCategory === cat
                    ? {
                        background: "var(--gradient-primary)",
                        boxShadow: "var(--shadow-glow)",
                      }
                    : {}
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main ref={resultsRef} className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="mb-8 flex items-center gap-4 rounded-2xl glass-card px-6 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <FileText className="h-6 w-6" />
          </div>

          <div>
            <p className="font-bold text-foreground">Have a doctors prescription?</p>
            <p className="text-sm text-muted-foreground">
              Add medicines to your cart. You can upload the prescription in the cart drawer.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="font-bold text-muted-foreground">Loading medicines...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-500">
              <ShieldCheck size={40} />
            </div>
            <p className="font-display text-xl font-bold text-red-600">{error}</p>
            <button
              onClick={loadMedicines}
              className="mt-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 active:scale-[0.98]"
              style={{ background: "var(--gradient-primary)" }}
            >
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl glass-card text-primary">
              <Pill size={40} />
            </div>
            <p className="font-display text-xl font-bold text-foreground">No medicines found</p>
            <p className="text-muted-foreground">Try a different search or category.</p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm font-bold text-muted-foreground">
              {filtered.length} medicine{filtered.length !== 1 ? "s" : ""} found
            </p>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((med) => (
                <MedicineCard
                  key={med.id}
                  med={med}
                  onAdd={handleAddToCart}
                  onReminder={handleOpenReminder}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <section className="relative mt-16 border-t border-border/40 py-12">
        <div className="absolute inset-0 bg-foreground/5" />

        <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Genuine Medicines",
              desc: "All medicines sourced from certified suppliers.",
            },
            {
              icon: Truck,
              title: "Fast Delivery",
              desc: "Home delivery and same-day counter pickup available.",
            },
            {
              icon: FileText,
              title: "Prescription Safe",
              desc: "Upload your Rx at checkout. Our pharmacist verifies it.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                <Icon className="h-6 w-6" />
              </div>

              <div>
                <h3 className="font-display font-bold text-foreground">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter />

      <ReminderModal
        open={reminderOpen}
        onClose={() => {
          setReminderOpen(false);
          setSelectedMedicine(null);
        }}
        medicine={selectedMedicine}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-xl" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}