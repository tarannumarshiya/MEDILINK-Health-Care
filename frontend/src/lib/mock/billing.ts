import type { Invoice, Payment, Refund } from "@/types/billing";

export const mockInvoices: Invoice[] = [
  { id: "inv-101", invoice_code: "INV-2026-382910", patient_id: "pat-001", appointment_id: "apt-003", consultation_charge: 800, lab_charge: 600, medicine_charge: 1100, insurance_deduction: 2100, total: 400, status: "PAID", created_at: "2026-05-20T12:00:00Z", patient_name: "Aisha Rahman" },
  { id: "inv-102", invoice_code: "INV-2026-492817", patient_id: "pat-010", appointment_id: "apt-301", consultation_charge: 1200, lab_charge: 2500, medicine_charge: 1800, insurance_deduction: 0, total: 5500, status: "UNPAID", created_at: "2026-06-10T08:30:00Z", patient_name: "Nasir Uddin" },
  { id: "inv-103", invoice_code: "INV-2026-571938", patient_id: "pat-011", appointment_id: "apt-302", consultation_charge: 1000, lab_charge: 3500, medicine_charge: 2200, insurance_deduction: 5000, total: 1700, status: "PAID", created_at: "2026-06-09T14:00:00Z", patient_name: "Meherun Nessa" },
  { id: "inv-104", invoice_code: "INV-2026-629174", patient_id: "pat-012", appointment_id: "apt-303", consultation_charge: 800, lab_charge: 1800, medicine_charge: 900, insurance_deduction: 2800, total: 700, status: "PARTIAL", created_at: "2026-06-08T10:00:00Z", patient_name: "Abul Kashem" },
  { id: "inv-105", invoice_code: "INV-2026-738291", patient_id: "pat-013", appointment_id: "apt-304", consultation_charge: 1500, lab_charge: 800, medicine_charge: 650, insurance_deduction: 2500, total: 450, status: "PAID", created_at: "2026-06-07T11:00:00Z", patient_name: "Shahana Parvin" },
  { id: "inv-106", invoice_code: "INV-2026-819374", patient_id: "pat-014", appointment_id: "apt-305", consultation_charge: 1200, lab_charge: 2200, medicine_charge: 1400, insurance_deduction: 0, total: 4800, status: "UNPAID", created_at: "2026-06-06T09:00:00Z", patient_name: "Rezaul Karim" },
  { id: "inv-107", invoice_code: "INV-2026-927183", patient_id: "pat-015", appointment_id: "apt-306", consultation_charge: 800, lab_charge: 1500, medicine_charge: 800, insurance_deduction: 2400, total: 700, status: "PAID", created_at: "2026-06-05T10:00:00Z", patient_name: "Tahmina Akhter" },
];

export const mockPayments: Payment[] = [
  { id: "pay-001", invoice_id: "inv-101", amount: 400, method: "card", status: "COMPLETED", created_at: "2026-05-20T12:30:00Z", invoice_code: "INV-2026-382910", patient_name: "Aisha Rahman" },
  { id: "pay-002", invoice_id: "inv-103", amount: 1700, method: "cash", status: "COMPLETED", created_at: "2026-06-09T14:30:00Z", invoice_code: "INV-2026-571938", patient_name: "Meherun Nessa" },
  { id: "pay-003", invoice_id: "inv-104", amount: 400, method: "upi", status: "COMPLETED", created_at: "2026-06-08T10:30:00Z", invoice_code: "INV-2026-629174", patient_name: "Abul Kashem" },
  { id: "pay-004", invoice_id: "inv-105", amount: 450, method: "card", status: "COMPLETED", created_at: "2026-06-07T11:30:00Z", invoice_code: "INV-2026-738291", patient_name: "Shahana Parvin" },
  { id: "pay-005", invoice_id: "inv-107", amount: 700, method: "insurance", status: "COMPLETED", created_at: "2026-06-05T10:30:00Z", invoice_code: "INV-2026-927183", patient_name: "Tahmina Akhter" },
];

export const mockRefunds: Refund[] = [
  { id: "ref-001", invoice_id: "inv-103", amount: 500, reason: "Duplicate lab charge — Liver Function Test billed twice", status: "COMPLETED", created_at: "2026-06-09T16:00:00Z", invoice_code: "INV-2026-571938", patient_name: "Meherun Nessa" },
  { id: "ref-002", invoice_id: "inv-104", amount: 300, reason: "Cancelled medicine order — patient allergic to prescribed antibiotic", status: "PENDING", created_at: "2026-06-10T09:00:00Z", invoice_code: "INV-2026-629174", patient_name: "Abul Kashem" },
];
