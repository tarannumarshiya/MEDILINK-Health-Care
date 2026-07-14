"use client";

import { useState } from "react";
import Link from "next/link";
import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import StickyHelpBar from "@/components/public/StickyHelpBar";
import { Loader2, Search } from "lucide-react";

type OrderItem = {
  id: string;
  medicine_name: string;
  price: number;
  quantity: number;
};

type PharmacyOrder = {
  id: string;
  patient_name: string;
  patient_phone: string;
  delivery_type: string;
  status: string;
  total: number;
  notes: string | null;
  created_at: string;
  pharmacy_order_items: OrderItem[];
};

const statusSteps = [
  "PENDING",
  "APPROVED",
  "DISPATCHED",
  "DELIVERED",
  "CANCELLED",
];

function getStatusIndex(status: string) {
  return statusSteps.indexOf(status.toUpperCase());
}

export default function PharmacyTrackPage() {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    setMessage("");
    setOrders([]);

    try {
      const res = await fetch("/api/pharmacy/orders/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ search: search.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "No orders found");
        return;
      }

      setOrders(data.orders || []);
    } catch {
      setMessage("Something went wrong while tracking your order.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <PublicNavbar />

      <section className="mx-auto max-w-7xl px-4 pt-32 pb-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-primary">
            Order Tracking
          </p>

          <h1 className="mt-3 text-4xl font-black text-slate-950 sm:text-5xl">
            Track Pharmacy Order
          </h1>

          <p className="mt-4 max-w-3xl text-slate-600">
            Enter your Order ID or Phone Number to check the status of your medicines.
          </p>
        </div>

        <form
          onSubmit={handleTrack}
          className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl sm:p-8"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <input
              id="track-search"
              aria-label="Search by Order ID or Phone"
              className="rounded-2xl border border-slate-300 p-4 outline-none focus:border-primary"
              placeholder="Order ID or Phone Number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              required
            />

            <button
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-2xl px-8 py-4 font-black text-white hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--gradient-primary)" }}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Search size={20} />
              )}
              {loading ? "Searching..." : "Track Status"}
            </button>
          </div>
        </form>

        <div aria-live="polite">
          {message && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
              {message}
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-6">
          {orders.map((order) => {
            const currentIndex = getStatusIndex(order.status);

            return (
              <div
                key={order.id}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl"
              >
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-start">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">
                      {order.patient_name}
                    </h2>

                    <p className="mt-1 font-bold text-slate-600">
                      Order ID:{" "}
                      <span className="text-primary">{order.id}</span>
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-500">
                      Delivery Type: <span className="uppercase">{order.delivery_type}</span>
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 uppercase">
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Phone
                    </p>
                    <p className="mt-1 font-black text-slate-900">
                      {order.patient_phone}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Total Amount
                    </p>
                    <p className="mt-1 font-black text-primary">
                      ৳ {order.total.toFixed(2)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Items
                    </p>
                    <p className="mt-1 font-black text-slate-900">
                      {order.pharmacy_order_items.length} medicines
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Ordered On
                    </p>
                    <p className="mt-1 font-black text-slate-900">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-primary">
                    Order Progress
                  </p>

                  <div className="flex flex-wrap gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {statusSteps.filter(s => s !== "CANCELLED").map((step, index) => (
                      <div
                        key={step}
                        className={`rounded-2xl border p-4 text-xs font-black sm:text-sm ${
                          order.status === "CANCELLED"
                            ? "border-red-200 bg-red-50 text-red-500"
                            : index === currentIndex
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : index < currentIndex
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-slate-200 bg-white text-slate-400"
                        }`}
                      >
                        {step.replaceAll("_", " ")}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-3xl bg-slate-50 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-3">
                    Medicines
                  </p>
                  <ul className="space-y-2">
                    {order.pharmacy_order_items.map((item) => (
                      <li key={item.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                        <span className="font-bold text-slate-800">{item.medicine_name}</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-slate-500">Qty: {item.quantity}</span>
                          <span className="ml-4 font-black text-primary">৳ {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {orders.length === 0 && !message && (
          <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow">
            <p className="font-bold text-slate-500">
              Enter your order details above to track your delivery or pickup status.
            </p>
            <Link
              href="/pharmacy"
              className="mt-5 inline-flex rounded-2xl px-6 py-4 font-black text-white hover:opacity-90 transition-opacity"
              style={{ background: "var(--gradient-primary)" }}
            >
              Go to Pharmacy
            </Link>
          </div>
        )}
      </section>

      <PublicFooter />
      <StickyHelpBar />
    </main>
  );
}
