"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList, Pill, CheckSquare, Package,
  AlertTriangle, Building2, AlertOctagon, Clock,
  Database, Plus, Loader2, Image as ImageIcon, RefreshCw,
  ShoppingBag, Eye,
} from "lucide-react";
import { DashboardShell, TabItem } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Panel } from "@/components/dashboard/Panel";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { SuccessBanner } from "@/components/dashboard/SuccessBanner";
import { apiFetch } from "@/lib/apiFetch";

type PrescriptionItem = {
  id: string; prescription_id: string;
  medicine_name: string; dosage: string; quantity: number; instructions: string;
};
type Prescription = {
  id: string; appointment_id: string; doctor_id: string;
  prescription_notes: string; status: string; created_at: string;
  patient_name: string; patient_phone: string; doctor_name: string;
  items: PrescriptionItem[];
};
type Medicine = {
  id: string; name: string; description: string | null; category: string;
  price: number; quantity: number; image_url: string | null;
  requires_prescription: boolean; is_available: boolean;
  reorder_level: number; batch_no: string | null; expiry_date: string | null;
};
type PublicOrder = {
  id: string; patient_name: string; patient_phone: string | null;
  items: { id: string; name: string; price: number; quantity: number }[];
  total: number; delivery_type: string; notes: string | null;
  prescription_image: string | null; status: string; created_at: string;
};
type Vendor = { id: string; name: string; contact: string; email: string };

type Tab = "queue" | "inventory" | "dispensing" | "orders" | "alerts" | "vendors" | "add";

const tabs: TabItem[] = [
  { label: "Rx Queue",      value: "queue",      icon: <ClipboardList className="h-[18px] w-[18px]" /> },
  { label: "Inventory",     value: "inventory",  icon: <Pill           className="h-[18px] w-[18px]" /> },
  { label: "Dispensed",     value: "dispensing", icon: <CheckSquare    className="h-[18px] w-[18px]" /> },
  { label: "Public Orders", value: "orders",     icon: <ShoppingBag    className="h-[18px] w-[18px]" /> },
  { label: "Stock Alerts",  value: "alerts",     icon: <AlertTriangle  className="h-[18px] w-[18px]" /> },
  { label: "Vendors",       value: "vendors",    icon: <Building2      className="h-[18px] w-[18px]" /> },
  { label: "Add Medicine",  value: "add",        icon: <Plus           className="h-[18px] w-[18px]" /> },
];

const inputCls = "h-10 w-full rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]";

// Bug 14 & 15 fix: keep the main form actions visible and visually strong.
const stickyActionBoxCls = "sticky bottom-4 z-20 mt-5 rounded-2xl border border-teal-200 bg-white/95 p-3 shadow-xl backdrop-blur";
const primaryActionBtnCls = "flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60";

// React render must stay pure. Keep the current-day timestamp outside render
// and use this helper instead of calling Date.now() inside JSX/render logic.
const ONE_DAY_MS = 86_400_000;
const TODAY_START_MS = (() => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
})();

function getDaysUntil(expiryDate: string | null) {
  if (!expiryDate) return Number.POSITIVE_INFINITY;
  return (new Date(expiryDate).getTime() - TODAY_START_MS) / ONE_DAY_MS;
}

export default function PharmacyQueuePage() {
  const [activeTab,     setActiveTab]     = useState<Tab>("queue");
  const [message,       setMessage]       = useState("");
  const [loading,       setLoading]       = useState(true);
  const [actionId,      setActionId]      = useState<string | null>(null);
  const [expandedRx,    setExpandedRx]    = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicines,     setMedicines]     = useState<Medicine[]>([]);
  const [orders,        setOrders]        = useState<PublicOrder[]>([]);
  const [vendors,       setVendors]       = useState<Vendor[]>([]);

  const [vendorForm,    setVendorForm]    = useState({ name: "", contact: "", email: "" });
  const [vendorLoading, setVendorLoading] = useState(false);
  const [contactError,  setContactError]  = useState("");
  const [nameError,     setNameError]     = useState("");
  const [addForm,       setAddForm]       = useState({
    name: "", description: "", category: "General",
    price: "", quantity: "", image_url: "", requires_prescription: false,
  });
  const [addLoading, setAddLoading] = useState(false);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    const [rxRes, invRes, ordRes, venRes] = await Promise.all([
      apiFetch("/api/pharmacy/queue").then(r => r.json()).catch(() => ({})),
      apiFetch("/api/pharmacy/inventory").then(r => r.json()).catch(() => ({})),
      apiFetch("/api/pharmacy/orders").then(r => r.json()).catch(() => ({})),
      apiFetch("/api/pharmacy/vendors").then(r => r.json()).catch(() => ({})),
    ]);
    if (rxRes.success)  setPrescriptions(rxRes.prescriptions ?? []);
    if (invRes.success) setMedicines(invRes.medicines ?? []);
    if (ordRes.success) setOrders(ordRes.orders ?? []);
    if (venRes.success) setVendors(venRes.vendors ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  async function dispense(id: string) {
    setActionId(id);
    const res = await apiFetch("/api/pharmacy/queue", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prescription_id: id }),
    });
    const json = await res.json();
    if (!res.ok) { setMessage(json.error || "Failed to dispense"); setActionId(null); return; }
    setMessage("Prescription dispensed and stock updated.");
    await load(); setActionId(null);
  }

  async function updateOrderStatus(id: string, status: string) {
    setActionId(id);
    const res = await apiFetch("/api/pharmacy/orders", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json();
    if (!res.ok) { setMessage(json.error || "Failed"); setActionId(null); return; }
    setMessage(`Order marked as ${status}.`);
    await load(); setActionId(null);
  }

  async function toggleAvailability(med: Medicine) {
    await apiFetch("/api/pharmacy/inventory", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: med.id, is_available: !med.is_available }),
    });
    await load();
  }

  async function addVendor(e: React.FormEvent) {
    e.preventDefault();
    setContactError("");
    setNameError("");

    if (!vendorForm.name.trim()) {
      setNameError("Vendor name is required.");
      return;
    }
    if (/^[\d\s]+$/.test(vendorForm.name.trim())) {
      setNameError("Vendor name cannot contain only numbers.");
      return;
    }
    if (!/[A-Za-z]/.test(vendorForm.name)) {
      setNameError("Vendor name must contain at least some letters.");
      return;
    }

    // Validate contact phone: optional, but if provided must be a valid BD mobile number.
    // Accepted: 01XXXXXXXXX (11 digits) or +880 1XXXXXXXXX (with optional spaces/dashes)
    if (vendorForm.contact.trim()) {
      const raw = vendorForm.contact.replace(/[\s\-]/g, "");
      const bdMobileRegex = /^(?:\+?880)?01[3-9]\d{8}$/;
      if (!bdMobileRegex.test(raw)) {
        setContactError(
          "Enter a valid mobile number (e.g. 01XXXXXXXXX or +8801XXXXXXXXX). Must be 11 digits starting with 01."
        );
        return;
      }
    }

    if (vendorForm.email && !/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i.test(vendorForm.email.trim())) {
      setMessage("Enter a valid vendor email address."); return;
    }
    setVendorLoading(true);
    const res = await apiFetch("/api/pharmacy/vendors", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...vendorForm, email: vendorForm.email.trim().toLowerCase() }),
    });
    const json = await res.json();
    if (!res.ok) { setMessage(json.error || "Failed"); setVendorLoading(false); return; }
    setMessage("Vendor added successfully.");
    setVendorForm({ name: "", contact: "", email: "" });
    setContactError("");
    setNameError("");
    await load(); setVendorLoading(false);
  }

  async function addMedicine(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(addForm.quantity);
    if (!addForm.name.trim()) { setMessage("Medicine name is required."); return; }
    if (!addForm.price || Number(addForm.price) <= 0) { setMessage("Enter a valid price greater than 0."); return; }
    if (addForm.quantity !== "" && (isNaN(qty) || qty < 0)) { setMessage("Stock quantity must be 0 or more."); return; }
    setAddLoading(true);
    const res = await apiFetch("/api/pharmacy/medicines", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addForm, price: Number(addForm.price), quantity: Number(addForm.quantity), image_url: addForm.image_url || null }),
    });
    const json = await res.json();
    if (!res.ok) { setMessage(json.error || "Failed"); setAddLoading(false); return; }
    setMessage(`"${addForm.name}" added to catalogue.`);
    setAddForm({ name: "", description: "", category: "General", price: "", quantity: "", image_url: "", requires_prescription: false });
    await load(); setAddLoading(false);
  }

  const pendingRx     = prescriptions.filter(p => p.status === "PENDING").length;
  const dispensedRx   = prescriptions.filter(p => p.status === "DISPENSED").length;
  const lowStock      = medicines.filter(m => m.quantity <= (m.reorder_level ?? 0)).length;
  const nearExpiry    = medicines.filter(m => {
    if (!m.expiry_date) return false;
    const days = getDaysUntil(m.expiry_date);
    return days <= 90 && days > 0;
  }).length;
  const pendingOrders = orders.filter(o => o.status === "PENDING").length;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
    </div>
  );

  return (
    <DashboardShell
      portalName="Pharmacy"
      portalSubtitle="Prescription & Inventory Management"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={t => setActiveTab(t as Tab)}
      liveSummary={[
        { label: "Pending Rx",    value: pendingRx },
        { label: "Low Stock",     value: lowStock },
        { label: "Public Orders", value: pendingOrders },
      ]}
    >
      {message && <SuccessBanner message={message} onDismiss={() => setMessage("")} />}

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Medicine Inventory Management
            </h2>
            <p className="text-sm font-medium text-slate-600">
              Add new medicines, update stock, manage availability, and monitor expiry.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("add")}
            className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-teal-500"
          >
            <Plus className="h-5 w-5" />
            Add Medicine
          </button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Pending Rx"      value={pendingRx}        icon={<Clock         className="h-5 w-5" />} deltaType={pendingRx > 0 ? "increase" : "neutral"} />
        <MetricCard label="Dispensed"       value={dispensedRx}      icon={<CheckSquare   className="h-5 w-5" />} />
        <MetricCard label="Low Stock"       value={lowStock}         icon={<AlertOctagon  className="h-5 w-5" />} deltaType={lowStock > 0 ? "decrease" : "neutral"} />
        <MetricCard label="Near Expiry"     value={nearExpiry}       icon={<AlertTriangle className="h-5 w-5" />} deltaType={nearExpiry > 0 ? "decrease" : "neutral"} />
        <MetricCard label="Total Medicines" value={medicines.length} icon={<Database      className="h-5 w-5" />} />
      </div>

      <div key={activeTab} className="animate-fade-rise">

        {activeTab === "queue" && (
          <Panel title="Prescription Queue" subtitle={`${pendingRx} pending — from doctor consultations`}>
            <div className="mb-4 flex justify-end">
              <button onClick={() => load()} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:border-teal-400 hover:text-teal-700">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
            <div className="grid gap-4">
              {prescriptions.filter(p => p.status === "PENDING").length === 0 && (
                <p className="rounded-2xl bg-emerald-50 p-8 text-center font-bold text-emerald-700">No pending prescriptions ✓</p>
              )}
              {prescriptions.filter(p => p.status === "PENDING").map(rx => (
                <div key={rx.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{rx.patient_name}</h3>
                      <p className="text-sm text-slate-500">{rx.doctor_name} • {new Date(rx.created_at).toLocaleString()}</p>
                      {rx.prescription_notes && <p className="mt-1 text-sm italic text-slate-600">{rx.prescription_notes}</p>}
                    </div>
                    <StatusBadge status={rx.status} />
                  </div>
                  <button onClick={() => setExpandedRx(expandedRx === rx.id ? null : rx.id)}
                    className="mt-3 flex items-center gap-1.5 text-sm font-bold text-teal-700 hover:text-teal-600">
                    <Eye className="h-4 w-4" />
                    {expandedRx === rx.id ? "Hide" : "View"} {rx.items.length} medicine{rx.items.length !== 1 ? "s" : ""}
                  </button>
                  {expandedRx === rx.id && (
                    <div className="mt-3 grid gap-2">
                      {rx.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                          <div>
                            <p className="font-bold text-slate-900">{item.medicine_name}</p>
                            <p className="text-xs text-slate-500">{item.instructions}</p>
                          </div>
                          <p className="font-black text-teal-700">{item.dosage} × {item.quantity}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => dispense(rx.id)} disabled={actionId === rx.id}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-black text-white transition hover:bg-teal-500 disabled:opacity-60">
                    {actionId === rx.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4" />}
                    {actionId === rx.id ? "Dispensing…" : "Dispense & Deduct Stock"}
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {activeTab === "inventory" && (
          <Panel title="Medicine Inventory" subtitle={`${medicines.length} medicines`}>
            <div className="mb-4 flex justify-end">
              
            <button onClick={() => load()} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:border-teal-400 hover:text-teal-700">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-950 text-left text-white">
                    {["Medicine", "Category", "Stock", "Reorder", "Price (৳)", "Expiry", "Status", "Action"].map(h => (
                      <th key={h} className="px-4 py-3 font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {medicines.map(med => (
                    <tr key={med.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900">{med.name}</td>
                      <td className="px-4 py-3 text-slate-600">{med.category}</td>
                      <td className={`px-4 py-3 font-black tabular-nums ${med.quantity <= (med.reorder_level ?? 0) ? "text-red-600" : "text-slate-900"}`}>{med.quantity}</td>
                      <td className="px-4 py-3 text-slate-500">{med.reorder_level ?? "—"}</td>
                      <td className="px-4 py-3 font-bold text-teal-700">{med.price}</td>
                      <td className={`px-4 py-3 text-sm ${med.expiry_date && getDaysUntil(med.expiry_date) <= 90 ? "font-bold text-amber-600" : "text-slate-500"}`}>
                        {med.expiry_date ?? "—"}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={med.is_available ? "ACTIVE" : "INACTIVE"} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleAvailability(med)}
                          className={`rounded-lg px-3 py-1 text-xs font-black text-white transition ${med.is_available ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"}`}>
                          {med.is_available ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {medicines.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No medicines found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {activeTab === "dispensing" && (
          <Panel title="Dispensed Prescriptions" subtitle={`${dispensedRx} dispensed`}>
            <div className="grid gap-4">
              {prescriptions.filter(p => p.status === "DISPENSED").length === 0 && (
                <p className="rounded-2xl bg-slate-50 p-8 text-center text-slate-400">No dispensed prescriptions yet.</p>
              )}
              {prescriptions.filter(p => p.status === "DISPENSED").map(rx => (
                <div key={rx.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-slate-900">{rx.patient_name}</p>
                      <p className="text-sm text-slate-500">{rx.doctor_name} • {new Date(rx.created_at).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status="DISPENSED" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rx.items.map(item => (
                      <span key={item.id} className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                        {item.medicine_name} ×{item.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {activeTab === "orders" && (
          <Panel title="Public Orders" subtitle={`${pendingOrders} pending`}>
            <div className="mb-4 flex justify-end">
              <button onClick={() => load()} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:border-teal-400 hover:text-teal-700">
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
            </div>
            <div className="grid gap-4">
              {orders.length === 0 && <p className="rounded-2xl bg-slate-50 p-8 text-center text-slate-400">No public orders yet.</p>}
              {orders.map(order => (
                <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="font-black text-slate-900">{order.patient_name}</h3>
                      <p className="text-sm text-slate-500">
                        {order.patient_phone ?? "No phone"} • {order.delivery_type === "pickup" ? "🏥 Pickup" : "🚚 Home Delivery"} • {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="mt-3 flex items-center gap-1.5 text-sm font-bold text-teal-700 hover:text-teal-600">
                    <Eye className="h-4 w-4" />
                    {expandedOrder === order.id ? "Hide" : "View"} {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? "s" : ""}
                  </button>
                  {expandedOrder === order.id && (
                    <div className="mt-3 grid gap-2">
                      {(order.items ?? []).map((item, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="font-black text-teal-700">৳{item.price} × {item.quantity}</p>
                        </div>
                      ))}
                      <div className="flex items-center justify-between rounded-xl bg-slate-950 px-4 py-2.5">
                        <p className="font-bold text-white">Total</p>
                        <p className="font-black text-teal-400">৳{order.total.toFixed(2)}</p>
                      </div>
                      {order.notes && <p className="rounded-xl bg-blue-50 px-4 py-2 text-sm text-blue-700">Note: {order.notes}</p>}
                      {order.prescription_image && (
                        <a href={order.prescription_image} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100">
                          📄 View Prescription
                        </a>
                      )}
                    </div>
                  )}
                  {order.status === "PENDING" && (
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => updateOrderStatus(order.id, "PROCESSING")} disabled={actionId === order.id}
                        className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-black text-white transition hover:bg-blue-500 disabled:opacity-60">
                        {actionId === order.id ? "…" : "Mark Processing"}
                      </button>
                      <button onClick={() => updateOrderStatus(order.id, "DELIVERED")} disabled={actionId === order.id}
                        className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-black text-white transition hover:bg-emerald-500 disabled:opacity-60">
                        Mark Delivered
                      </button>
                    </div>
                  )}
                  {order.status === "PROCESSING" && (
                    <button onClick={() => updateOrderStatus(order.id, "DELIVERED")} disabled={actionId === order.id}
                      className="mt-4 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-black text-white transition hover:bg-emerald-500 disabled:opacity-60">
                      {actionId === order.id ? "…" : "Mark Delivered"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        )}

        {activeTab === "alerts" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Low Stock Items" subtitle="Below reorder level">
              <div className="grid gap-3">
                {medicines.filter(m => m.quantity <= (m.reorder_level ?? 0)).length === 0 && (
                  <p className="rounded-2xl bg-emerald-50 p-6 text-center font-bold text-emerald-700">All stock levels healthy ✓</p>
                )}
                {medicines.filter(m => m.quantity <= (m.reorder_level ?? 0)).map(med => (
                  <div key={med.id} className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                    <div>
                      <p className="font-black text-slate-900">{med.name}</p>
                      <p className="text-xs text-slate-500">{med.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-red-600">{med.quantity} left</p>
                      <p className="text-xs text-slate-500">Reorder at: {med.reorder_level ?? "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Near Expiry Items" subtitle="Expiring within 90 days">
              <div className="grid gap-3">
                {medicines.filter(m => {
                  if (!m.expiry_date) return false;
                  const d = getDaysUntil(m.expiry_date);
                  return d <= 90 && d > 0;
                }).length === 0 && (
                  <p className="rounded-2xl bg-emerald-50 p-6 text-center font-bold text-emerald-700">No near-expiry items ✓</p>
                )}
                {medicines.filter(m => {
                  if (!m.expiry_date) return false;
                  const d = getDaysUntil(m.expiry_date);
                  return d <= 90 && d > 0;
                }).map(med => (
                  <div key={med.id} className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                    <div>
                      <p className="font-black text-slate-900">{med.name}</p>
                      <p className="text-xs text-slate-500">{med.quantity} units in stock</p>
                    </div>
                    <p className="font-black text-amber-700">{med.expiry_date}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {activeTab === "vendors" && (
          <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
            <Panel title="Add Vendor" subtitle="Register a new supplier">
              <form onSubmit={addVendor} className="grid gap-4 pb-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Vendor Name *</label>
                  <input type="text" required placeholder="e.g. MediSupply BD" 
                    className={`${inputCls} ${nameError ? "border-red-400 bg-red-50 focus:ring-red-400" : ""}`}
                    value={vendorForm.name}
                    onChange={e => {
                      setVendorForm(p => ({ ...p, name: e.target.value }));
                      if (nameError) setNameError("");
                    }} />
                  {nameError && <p className="text-xs font-semibold text-red-500">{nameError}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Email</label>
                  <input type="email" placeholder="orders@vendor.com" className={inputCls}
                    value={vendorForm.email}
                    onChange={e => setVendorForm(p => ({ ...p, email: e.target.value }))} />
                </div>

                {/* Contact Phone — separate with validation */}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="01XXXXXXXXX or +8801XXXXXXXXX"
                    className={`${inputCls} ${contactError ? "border-red-400 bg-red-50 focus:ring-red-400" : ""}`}
                    value={vendorForm.contact}
                    onChange={e => {
                      setVendorForm(p => ({ ...p, contact: e.target.value }));
                      if (contactError) setContactError("");
                    }}
                  />
                  {contactError && (
                    <p className="text-xs font-semibold text-red-500">{contactError}</p>
                  )}
                  <p className="text-[11px] text-slate-400">
                    Format: 01XXXXXXXXX or +8801XXXXXXXXX (11 digits, starts with 01)
                  </p>
                </div>
                <div className={stickyActionBoxCls}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-600">
                      Primary Action
                    </p>
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-black text-teal-700">
                      Always visible
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={vendorLoading}
                    className={primaryActionBtnCls}
                  >
                    {vendorLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {vendorLoading ? "Adding Vendor…" : "Add Vendor"}
                  </button>
                </div>
              </form>
            </Panel>
            <Panel title="Vendor Directory" subtitle={`${vendors.length} registered suppliers`}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-950 text-left text-white">
                      {["Vendor Name", "Contact", "Email"].map(h => (
                        <th key={h} className="px-4 py-3 font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map(v => (
                      <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">{v.name}</td>
                        <td className="px-4 py-3 text-slate-600">{v.contact || "—"}</td>
                        <td className="px-4 py-3 text-slate-500">{v.email || "—"}</td>
                      </tr>
                    ))}
                    {vendors.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No vendors yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}

        {activeTab === "add" && (
          <div className="grid gap-6 xl:grid-cols-[500px_1fr]">
            <Panel title="Add Medicine to Catalogue" subtitle="Appears immediately on the public pharmacy page">
              <form onSubmit={addMedicine} className="grid gap-4 pb-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Medicine Name *</label>
                  <input required className={inputCls} value={addForm.name}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Paracetamol 500mg" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Category</label>
                    <select className={inputCls} value={addForm.category}
                      onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))}>
                      {["General","Pain Relief","Antibiotics","Allergy","Gastro","Diabetes","Cardiology","Respiratory","Supplements"].map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Price (৳) *</label>
                    <input required type="number" min="0" step="0.01" className={inputCls} value={addForm.price}
                      onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Stock Qty</label>
                    <input type="number" min="0" className={inputCls} value={addForm.quantity}
                      onChange={e => setAddForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" />
                  </div>
                  <div className="flex items-center gap-3 pt-5">
                    <input id="rx-req" type="checkbox" className="h-4 w-4 accent-teal-600"
                      checked={addForm.requires_prescription}
                      onChange={e => setAddForm(f => ({ ...f, requires_prescription: e.target.checked }))} />
                    <label htmlFor="rx-req" className="text-sm font-semibold text-[var(--ink)]">Requires Prescription</label>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)] flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" /> Image URL
                  </label>
                  <input type="url" className={inputCls} value={addForm.image_url}
                    onChange={e => setAddForm(f => ({ ...f, image_url: e.target.value }))}
                    placeholder="https://images.unsplash.com/…" />
                </div>
                {addForm.image_url && (
                  <div className="relative h-36 overflow-hidden rounded-2xl border border-[var(--line)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={addForm.image_url} alt="Preview" className="h-full w-full object-cover"
                      onError={e => (e.currentTarget.style.opacity = "0.15")} />
                    <span className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-0.5 text-xs font-bold text-white">Preview</span>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Description</label>
                  <textarea rows={2} className="w-full resize-none rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none"
                    value={addForm.description}
                    onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Short description…" />
                </div>
                <div className={stickyActionBoxCls}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-600">
                      Primary Action
                    </p>
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-black text-teal-700">
                      Always visible
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className={primaryActionBtnCls}
                  >
                    {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {addLoading ? "Adding Medicine…" : "Add Medicine to Catalogue"}
                  </button>
                </div>
              </form>
            </Panel>
            <Panel title="Image URL Tips" subtitle="How to get good medicine images">
              <div className="space-y-4 text-sm">
                {[
                  { site: "Unsplash", url: "https://unsplash.com/s/photos/medicine", tip: "Search 'medicine', 'tablets' — right-click image → Copy image address" },
                  { site: "Pexels",   url: "https://www.pexels.com/search/medicine/", tip: "Free photos — right-click and copy image URL directly" },
                ].map(({ site, url, tip }) => (
                  <div key={site} className="rounded-2xl border border-[var(--line)] bg-[var(--canvas)] p-4">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="font-black text-teal-700 hover:underline">{site} →</a>
                    <p className="mt-1 text-[var(--muted)]">{tip}</p>
                  </div>
                ))}
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-1 text-amber-800 text-xs">
                  <p className="font-bold">✓ URL must start with https://</p>
                  <p className="font-bold">✓ End in .jpg, .png, or .webp</p>
                  <p className="font-bold">✗ Avoid Google Images — links expire</p>
                </div>
              </div>
            </Panel>
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
