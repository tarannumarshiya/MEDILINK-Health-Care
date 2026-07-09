"use client";

import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

export type PrescriptionBillItem = {
  medicine_name: string;
  dosage?: string | null;
  quantity: number;
  instructions?: string | null;
};

export type HospitalBillProps = {
  invoiceCode: string;
  invoiceDate: string;
  patientName: string;
  patientCode?: string;
  patientAge?: number | string;
  patientPhone?: string;
  doctorName?: string;
  department?: string;
  consultationCharge: number;
  labCharge: number;
  medicineCharge: number;
  insuranceDeduction: number;
  total: number;
  status: string;
  labTests?: { test_type: string; result_summary?: string | null }[];
  prescriptionItems?: PrescriptionBillItem[];
  prescriptionNotes?: string | null;
  onClose: () => void;
};

function fmt(n: number) {
  return `৳${Number(n).toLocaleString("en-IN")}`;
}

export default function HospitalBill(props: HospitalBillProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const subtotal = props.consultationCharge + props.labCharge + props.medicineCharge;

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") props.onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props]);

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=900,height=750");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Invoice ${props.invoiceCode} — Medilink Healthcare</title>
      <meta charset="UTF-8"/>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Segoe UI',Arial,sans-serif;color:#1a202c;background:#fff;padding:20px}
        @media print{@page{margin:12mm;size:A4}body{padding:0}}
        table{border-collapse:collapse;width:100%}
      </style>
    </head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  }

  // Build pharmacy URL with prescription medicines as search query
  const pharmacyUrl = props.prescriptionItems && props.prescriptionItems.length > 0
    ? `/pharmacy?search=${encodeURIComponent(props.prescriptionItems[0].medicine_name)}`
    : "/pharmacy";

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const bill = (
    /* Overlay: fixed, full screen, scrollable */
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
    >
      {/* Click backdrop to close */}
      <div className="fixed inset-0" onClick={props.onClose} />

      {/* Content wrapper — sits above backdrop, centered, with padding so nothing clips */}
      <div className="relative z-10 mx-auto min-h-full w-full max-w-2xl px-4 py-8 flex flex-col gap-0">

        {/* ── Sticky action bar ── */}
        <div className="sticky top-4 z-20 mb-4 flex items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-full bg-teal-600 px-5 py-2.5 text-sm font-black text-white shadow-xl transition hover:bg-teal-500 active:scale-95"
          >
            🖨️ Print / Save PDF
          </button>
          <button
            onClick={props.onClose}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-800 shadow-xl transition hover:bg-slate-100 active:scale-95"
          >
            ✕ Close
          </button>
        </div>

        {/* ── Printable bill card ── */}
        <div
          ref={printRef}
          style={{
            background: "#fff",
            borderRadius: "16px",
            overflow: "hidden",
            fontFamily: "'Segoe UI', Arial, sans-serif",
            color: "#1a202c",
            boxShadow: "0 25px 60px -10px rgba(0,0,0,.7)",
          }}
        >
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg,#0C1A27 0%,#1B5FA8 55%,#0D7550 100%)", padding: "24px 28px", color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <div style={{ width: "40px", height: "40px", background: "rgba(255,255,255,.15)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🏥</div>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: 900 }}>Medilink Healthcare</div>
                    <div style={{ fontSize: "11px", opacity: 0.6 }}>Multi-Specialty Hospital &amp; Diagnostics</div>
                  </div>
                </div>
                <div style={{ fontSize: "11px", opacity: 0.55, marginTop: "6px", lineHeight: 1.7 }}>
                  123 Healthcare Avenue, Medical District, Dhaka-1215<br />
                  📞 +880-2-9876543 &nbsp;|&nbsp; ✉ info@medilink.health<br />
                  Reg: ML-HOSP-2024-001 &nbsp;|&nbsp; BMDC Approved
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ background: "rgba(255,255,255,.12)", borderRadius: "10px", padding: "12px 16px" }}>
                  <div style={{ fontSize: "9px", opacity: 0.6, letterSpacing: "1px", textTransform: "uppercase" }}>Invoice No.</div>
                  <div style={{ fontSize: "18px", fontWeight: 900, fontFamily: "monospace", marginTop: "2px" }}>{props.invoiceCode}</div>
                  <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "3px" }}>
                    {new Date(props.invoiceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <div style={{
                    marginTop: "6px", display: "inline-block",
                    background: props.status === "PAID" ? "#10b981" : "#f59e0b",
                    borderRadius: "999px", padding: "2px 10px", fontSize: "11px", fontWeight: 800,
                  }}>
                    {props.status === "PAID" ? "✓ PAID" : "⏳ UNPAID"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Patient info */}
          <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "14px 28px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
              {[
                ["Patient Name",     props.patientName || "—"],
                ["Patient ID",       props.patientCode || "—"],
                ["Age",              props.patientAge ? `${props.patientAge} yrs` : "—"],
                ["Phone",            props.patientPhone || "—"],
                ["Attending Doctor", props.doctorName || "—"],
                ["Department",       props.department || "—"],
              ].map(([label, value]) => (
                <div key={label} style={{ background: "#fff", borderRadius: "8px", padding: "8px 12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", marginBottom: "2px" }}>{label}</div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "20px 28px" }}>

            {/* Charges table */}
            <div style={{ marginBottom: "18px" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", marginBottom: "8px" }}>Service Charges</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#1e293b", color: "#fff" }}>
                    <th style={{ padding: "9px 12px", textAlign: "left", fontWeight: 700, fontSize: "11px" }}>Description</th>
                    <th style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, fontSize: "11px" }}>Amount (BDT)</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    ["Consultation Fee",                props.consultationCharge],
                    ["Laboratory / Diagnostic Charges", props.labCharge],
                    ["Medicine / Pharmacy Charges",     props.medicineCharge],
                  ] as [string, number][]).map(([desc, amount], i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                      <td style={{ padding: "9px 12px", color: "#374151" }}>{desc}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600, color: "#1e293b" }}>{fmt(amount)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: "2px solid #e2e8f0", background: "#f8fafc" }}>
                    <td style={{ padding: "9px 12px", fontWeight: 700, color: "#374151" }}>Subtotal</td>
                    <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: "#1e293b" }}>{fmt(subtotal)}</td>
                  </tr>
                  {props.insuranceDeduction > 0 && (
                    <tr style={{ background: "#f0fdf4" }}>
                      <td style={{ padding: "9px 12px", fontWeight: 600, color: "#15803d" }}>🛡️ Insurance Deduction</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: "#15803d" }}>− {fmt(props.insuranceDeduction)}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: "linear-gradient(90deg,#1B5FA8,#0D7550)", color: "#fff" }}>
                    <td style={{ padding: "12px 12px", fontWeight: 900, fontSize: "14px" }}>TOTAL AMOUNT DUE</td>
                    <td style={{ padding: "12px 12px", textAlign: "right", fontWeight: 900, fontSize: "17px" }}>{fmt(props.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Lab tests */}
            {props.labTests && props.labTests.length > 0 && (
              <div style={{ marginBottom: "18px" }}>
                <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", marginBottom: "8px" }}>Laboratory Tests Performed</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#312e81", color: "#fff" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, fontSize: "11px" }}>Test Name</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, fontSize: "11px" }}>Result / Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.labTests.map((t, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #e0e7ff", background: i % 2 === 0 ? "#fff" : "#eef2ff" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600, color: "#312e81" }}>{t.test_type}</td>
                        <td style={{ padding: "8px 12px", color: "#4b5563" }}>{t.result_summary ?? "Pending"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Prescription */}
            {props.prescriptionItems && props.prescriptionItems.length > 0 && (
              <div style={{ marginBottom: "18px" }}>
                <div style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", marginBottom: "8px" }}>Prescription — Medicines</div>
                {props.prescriptionNotes && (
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "9px 12px", marginBottom: "8px", fontSize: "12px", color: "#78350f" }}>
                    📋 Doctor&apos;s Notes: {props.prescriptionNotes}
                  </div>
                )}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#065f46", color: "#fff" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, fontSize: "11px" }}>Medicine</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, fontSize: "11px" }}>Dosage</th>
                      <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, fontSize: "11px" }}>Qty</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, fontSize: "11px" }}>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.prescriptionItems.map((item, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #d1fae5", background: i % 2 === 0 ? "#fff" : "#f0fdf4" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 700, color: "#065f46" }}>{item.medicine_name}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center", color: "#374151" }}>{item.dosage ?? "—"}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 700, color: "#374151" }}>{item.quantity}</td>
                        <td style={{ padding: "8px 12px", color: "#6b7280", fontSize: "12px" }}>{item.instructions ?? "As directed"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div style={{ borderTop: "2px dashed #e2e8f0", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ fontSize: "10px", color: "#94a3b8", lineHeight: 1.8 }}>
                <div style={{ fontWeight: 700, color: "#475569", marginBottom: "3px" }}>Terms &amp; Conditions</div>
                • Payment due within 7 days of invoice date<br />
                • Computer-generated invoice — no signature required<br />
                • Disputes: billing@medilink.health
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ borderTop: "1.5px solid #334155", paddingTop: "6px", width: "150px", fontSize: "10px", color: "#475569", fontWeight: 600 }}>
                  Authorized Signatory<br />
                  <span style={{ fontSize: "9px", color: "#94a3b8" }}>Medilink Healthcare</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "14px", fontSize: "11px", color: "#94a3b8" }}>
              Thank you for choosing Medilink Healthcare. Wishing you good health! 💙
            </div>
          </div>
        </div>

        {/* ── Buy Medicines banner (outside printable area) ── */}
        {props.prescriptionItems && props.prescriptionItems.length > 0 && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-emerald-900 text-sm">💊 Need to buy your prescribed medicines?</p>
                <p className="mt-0.5 text-xs text-emerald-700">
                  {props.prescriptionItems.length} medicine{props.prescriptionItems.length > 1 ? "s" : ""} prescribed —&nbsp;
                  {props.prescriptionItems.map(i => i.medicine_name).join(", ")}
                </p>
              </div>
              <Link
                href={pharmacyUrl}
                onClick={props.onClose}
                className="shrink-0 rounded-full bg-emerald-600 px-5 py-2.5 text-center text-sm font-black text-white shadow-md transition hover:bg-emerald-500 active:scale-95"
              >
                🛒 Buy Medicines
              </Link>
            </div>
          </div>
        )}

        {/* ── Bottom close button ── */}
        <div className="mt-4 mb-2 flex justify-center">
          <button
            onClick={props.onClose}
            className="rounded-full bg-white px-10 py-3 text-sm font-black text-slate-800 shadow-xl transition hover:bg-slate-100 active:scale-95"
          >
            ✕ Close Bill
          </button>
        </div>

      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(bill, document.body);
}
