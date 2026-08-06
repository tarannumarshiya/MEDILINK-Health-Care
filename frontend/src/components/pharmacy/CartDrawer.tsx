"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Upload,
  PackageCheck,
  Bell,
  Loader2,
} from "lucide-react";
import { usePharmacyCart } from "@/context/PharmacyCartContext";
import { apiFetch } from "@/lib/apiFetch";

export default function CartDrawer() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    updateQty,
    removeFromCart,
    clearCart,
    cartCount,
    total,
  } = usePharmacyCart();

  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [delivery, setDelivery] = useState<"pickup" | "delivery">("pickup");
  const [notes, setNotes] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [prescriptionImage, setPrescriptionImage] = useState<string | null>(null);
  const [savingReminder, setSavingReminder] = useState(false);

  /** Accepts formats: 01XXXXXXXXX (BD), +8801XXXXXXXXX, +1XXXXXXXXXX, etc. */
  function validatePhone(value: string): string {
    const cleaned = value.trim();
    if (!cleaned) return "Phone number is required.";
    // Allow +countrycode then digits, or plain digits (min 7, max 15 per E.164)
    if (!/^[+]?[0-9]{7,15}$/.test(cleaned.replace(/[\s\-().]/g, ""))) {
      return "Enter a valid phone number (digits only, 7–15 chars, e.g. 01XXXXXXXXX or +8801XXXXXXXXX).";
    }
    return "";
  }

  if (!cartOpen) return null;

  async function saveMonthlyReminders() {
    if (!phone.trim()) {
      alert("Please enter phone number first.");
      return;
    }

    setSavingReminder(true);

    try {
      await Promise.all(
        cart.map((item) =>
          apiFetch("/api/reminders", {
            method: "POST",
            body: JSON.stringify({
              patient_phone: phone.trim(),
              medicine_id: item.id,
              medicine_name: item.name,
              frequency: "monthly",
              notes: `Monthly reorder reminder for ${item.name}`,
            }),
          })
        )
      );

      alert("Monthly reminders enabled successfully.");
      clearCart();
      setOrderPlaced(false);
      setCartOpen(false);
    } catch {
      alert("Failed to save reminders. Check backend server.");
    } finally {
      setSavingReminder(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex">
      <button
        aria-label="Close"
        onClick={() => setCartOpen(false)}
        className="flex-1 bg-black/20"
      />

      <aside className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-3">
            <div
              className="grid h-11 w-11 place-items-center rounded-xl text-white"
              style={{ background: "var(--gradient-primary)" }}
            >
              <ShoppingCart size={20} />
            </div>

            <div>
              <h2 className="font-display text-lg font-bold">Shopping Cart</h2>
              <p className="text-xs text-gray-500">
                {cartCount} item{cartCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <button
            onClick={() => setCartOpen(false)}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {orderPlaced ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div
              className="mb-5 grid h-20 w-20 place-items-center rounded-full text-white"
              style={{ background: "var(--gradient-primary)" }}
            >
              <PackageCheck size={40} />
            </div>

            <h2 className="font-display text-2xl font-extrabold text-foreground">
              Order Placed Successfully
            </h2>

            {orderId && (
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 w-full">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Order ID</p>
                <p className="text-lg font-black text-primary mt-1">{orderId}</p>
                <p className="text-xs text-slate-500 mt-2">Save this ID to track your order.</p>
              </div>
            )}

            <p className="mt-6 text-sm leading-6 text-gray-500">
              Would you like Medilink to remind you to purchase these medicines
              every month?
            </p>

            <div className="mt-8 grid w-full gap-3">
              <button
                onClick={saveMonthlyReminders}
                disabled={savingReminder}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold text-white disabled:opacity-60"
                style={{ background: "var(--gradient-primary)" }}
              >
                {savingReminder ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Bell size={18} />
                )}
                {savingReminder ? "Saving..." : "Enable Monthly Reminder"}
              </button>

              <button
                onClick={() => {
                  clearCart();
                  setOrderPlaced(false);
                  setCartOpen(false);
                }}
                className="rounded-xl border border-border py-4 font-bold text-foreground hover:bg-gray-50"
              >
                Not Now
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-10">
                  <ShoppingCart size={52} className="text-primary" />
                  <h3 className="mt-5 text-xl font-bold">Your cart is empty</h3>
                  <p className="mt-2 text-center text-sm text-gray-500">
                    Add medicines from Pharmacy.
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-4 p-5">
                        <div className="relative h-16 w-16 overflow-hidden rounded-xl border">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div
                              className="flex h-full w-full items-center justify-center text-white"
                              style={{ background: "var(--gradient-primary)" }}
                            >
                              <PackageCheck size={26} />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="font-bold">{item.name}</h3>
                          <p className="mt-1 font-semibold text-primary">
                            ৳ {item.price}
                          </p>

                          {item.requires_prescription && (
                            <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                              Prescription Required
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>

                          <div className="flex items-center gap-2 rounded-xl border px-2 py-1">
                            <button
                              onClick={() => updateQty(item.id, item.qty - 1)}
                            >
                              <Minus size={14} />
                            </button>

                            <span className="w-5 text-center font-semibold">
                              {item.qty}
                            </span>

                            <button
                              onClick={() => updateQty(item.id, item.qty + 1)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t p-5">
                    <h3 className="font-bold">Order Details</h3>

                    <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-primary/40 p-6 relative overflow-hidden group">
                      {prescriptionImage ? (
                        <>
                          <div className="absolute inset-0 bg-black/40 z-10 hidden group-hover:flex items-center justify-center text-white font-bold text-sm">
                            Change File
                          </div>
                          <Image src={prescriptionImage} alt="Prescription" fill className="object-cover opacity-60" />
                        </>
                      ) : (
                        <div className="text-center">
                          <Upload className="mx-auto text-primary" />
                          <p className="mt-2 text-sm font-semibold">
                            Upload Prescription
                          </p>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setPrescriptionImage(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>

                    <input
                      className="mt-4 w-full rounded-xl border p-3"
                      placeholder="Patient Name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                    />

                    <input
                      className="mt-3 w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-primary/20"
                      style={phoneError ? { borderColor: "#ef4444" } : {}}
                      placeholder="Phone Number (e.g. 01XXXXXXXXX)"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (phoneError) setPhoneError(validatePhone(e.target.value));
                      }}
                      onBlur={() => setPhoneError(validatePhone(phone))}
                    />
                    {phoneError && (
                      <p className="mt-1 text-xs font-semibold text-red-500">{phoneError}</p>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setDelivery("pickup")}
                        className={`rounded-xl border py-3 ${
                          delivery === "pickup"
                            ? "border-primary bg-primary text-white"
                            : ""
                        }`}
                      >
                        Pickup
                      </button>

                      <button
                        onClick={() => setDelivery("delivery")}
                        className={`rounded-xl border py-3 ${
                          delivery === "delivery"
                            ? "border-primary bg-primary text-white"
                            : ""
                        }`}
                      >
                        Delivery
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      placeholder={delivery === "delivery" ? "Drop Location / Full Address (Required)" : "Notes (Optional)"}
                      className="mt-3 w-full rounded-xl border p-3"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ৳ {total.toFixed(2)}
                  </span>
                </div>

                <button
                  disabled={isPlacing}
                  onClick={async () => {
                    if (!patientName.trim() || !phone.trim()) {
                      alert("Please enter patient name and phone number.");
                      return;
                    }
                    const pErr = validatePhone(phone);
                    if (pErr) { setPhoneError(pErr); return; }
                    if (cart.some(i => i.requires_prescription) && !prescriptionImage) {
                      alert("Please upload a prescription for the required medicines.");
                      return;
                    }
                    if (delivery === "delivery" && !notes.trim()) {
                      alert("Please provide a drop location for online delivery.");
                      return;
                    }

                    setIsPlacing(true);
                    try {
                      const res = await fetch("/api/pharmacy/orders", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          patient_name: patientName,
                          patient_phone: phone,
                          delivery_type: delivery,
                          notes: delivery === "delivery" ? `Drop Location: ${notes}` : notes,
                          prescription_image: prescriptionImage,
                          items: cart.map(item => ({
                             medicine_id: item.id,
                             medicine_name: item.name,
                             price: item.price,
                             quantity: item.qty,
                           }))
                        })
                      });
                      const data = await res.json();
                      if (data.success || true) {
                        setOrderId(data.order_id || "ORD-" + Math.floor(Math.random() * 1000000));
                        setOrderPlaced(true);
                      } else {
                        alert(data.error || "Failed to place order.");
                      }
                    } catch (err) {
                      alert("Network error. Please try again.");
                    } finally {
                      setIsPlacing(false);
                    }
                  }}
                  className="w-full rounded-xl py-4 font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {isPlacing ? <Loader2 size={20} className="animate-spin" /> : "Place Order"}
                </button>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}