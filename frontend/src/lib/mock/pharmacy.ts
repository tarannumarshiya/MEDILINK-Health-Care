import type { Medicine, Vendor, PharmacyOrder } from "@/types/inventory";
import type { PrescriptionWithItems } from "@/types/prescription";

export const mockPrescriptionQueue: PrescriptionWithItems[] = [
  {
    id: "rx-101", appointment_id: "apt-201", doctor_id: "doc-001", prescription_notes: "Upper respiratory infection. Antibiotics + cough suppressant.", status: "PENDING", created_at: "2026-06-10T09:00:00Z", doctor_name: "Dr. Farid Hossain", patient_name: "Rafiq Ahmed",
    items: [
      { id: "rxi-101", prescription_id: "rx-101", medicine_name: "Amoxicillin 500mg", dosage: "500mg", quantity: 21, instructions: "Three times daily after meals for 7 days" },
      { id: "rxi-102", prescription_id: "rx-101", medicine_name: "Dextromethorphan Syrup", dosage: "15ml", quantity: 1, instructions: "10ml three times daily as needed" },
    ],
  },
  {
    id: "rx-102", appointment_id: "apt-202", doctor_id: "doc-002", prescription_notes: "Type 2 diabetes — continuing metformin, adding glimepiride.", status: "PENDING", created_at: "2026-06-10T09:30:00Z", doctor_name: "Dr. Rashida Begum", patient_name: "Kamal Uddin",
    items: [
      { id: "rxi-103", prescription_id: "rx-102", medicine_name: "Metformin 500mg", dosage: "500mg", quantity: 60, instructions: "Twice daily with meals" },
      { id: "rxi-104", prescription_id: "rx-102", medicine_name: "Glimepiride 2mg", dosage: "2mg", quantity: 30, instructions: "Once daily before breakfast" },
    ],
  },
  {
    id: "rx-103", appointment_id: "apt-203", doctor_id: "doc-003", prescription_notes: "Hypertension management — ACE inhibitor + diuretic.", status: "PENDING", created_at: "2026-06-10T10:00:00Z", doctor_name: "Dr. Nusrat Jahan", patient_name: "Salma Khatun",
    items: [
      { id: "rxi-105", prescription_id: "rx-103", medicine_name: "Enalapril 10mg", dosage: "10mg", quantity: 30, instructions: "Once daily in the morning" },
      { id: "rxi-106", prescription_id: "rx-103", medicine_name: "Hydrochlorothiazide 12.5mg", dosage: "12.5mg", quantity: 30, instructions: "Once daily in the morning" },
    ],
  },
  {
    id: "rx-104", appointment_id: "apt-204", doctor_id: "doc-001", prescription_notes: "Post-operative pain management — mild analgesic.", status: "DISPENSED", created_at: "2026-06-09T14:00:00Z", doctor_name: "Dr. Farid Hossain", patient_name: "Jamal Hasan",
    items: [
      { id: "rxi-107", prescription_id: "rx-104", medicine_name: "Paracetamol 500mg", dosage: "500mg", quantity: 20, instructions: "As needed, max 4 tablets per day" },
      { id: "rxi-108", prescription_id: "rx-104", medicine_name: "Omeprazole 20mg", dosage: "20mg", quantity: 14, instructions: "Once daily before breakfast" },
    ],
  },
  {
    id: "rx-105", appointment_id: "apt-205", doctor_id: "doc-004", prescription_notes: "Childhood asthma — inhaler + montelukast.", status: "PENDING", created_at: "2026-06-10T10:30:00Z", doctor_name: "Dr. Shafiqul Alam", patient_name: "Fatema Tuz (Minor — Mother: Hasina Akter)",
    items: [
      { id: "rxi-109", prescription_id: "rx-105", medicine_name: "Salbutamol Inhaler", dosage: "100mcg/puff", quantity: 1, instructions: "2 puffs as needed for wheeze" },
      { id: "rxi-110", prescription_id: "rx-105", medicine_name: "Montelukast 5mg Chewable", dosage: "5mg", quantity: 30, instructions: "Once daily at bedtime" },
    ],
  },
];

export const mockInventory: Medicine[] = [
  { id: "med-001", name: "Amoxicillin 500mg", batch_no: "AMX-B2026-041", quantity: 320, expiry_date: "2027-08-15", supplier_id: "ven-001", reorder_level: 100, price: 8, supplier_name: "MediSupply BD" },
  { id: "med-002", name: "Paracetamol 500mg", batch_no: "PCM-B2026-018", quantity: 1200, expiry_date: "2028-02-10", supplier_id: "ven-001", reorder_level: 200, price: 3, supplier_name: "MediSupply BD" },
  { id: "med-003", name: "Metformin 500mg", batch_no: "MET-B2025-092", quantity: 45, expiry_date: "2026-09-20", supplier_id: "ven-002", reorder_level: 100, price: 6, supplier_name: "PharmaLink International" },
  { id: "med-004", name: "Cetirizine 10mg", batch_no: "CET-B2026-033", quantity: 800, expiry_date: "2027-12-01", supplier_id: "ven-001", reorder_level: 150, price: 4, supplier_name: "MediSupply BD" },
  { id: "med-005", name: "Omeprazole 20mg", batch_no: "OMP-B2026-057", quantity: 180, expiry_date: "2027-05-30", supplier_id: "ven-003", reorder_level: 80, price: 10, supplier_name: "HealthFirst Distributors" },
  { id: "med-006", name: "Enalapril 10mg", batch_no: "ENL-B2025-115", quantity: 22, expiry_date: "2026-07-15", supplier_id: "ven-002", reorder_level: 50, price: 12, supplier_name: "PharmaLink International" },
  { id: "med-007", name: "Salbutamol Inhaler", batch_no: "SAL-B2026-008", quantity: 35, expiry_date: "2027-11-01", supplier_id: "ven-003", reorder_level: 20, price: 180, supplier_name: "HealthFirst Distributors" },
  { id: "med-008", name: "Glimepiride 2mg", batch_no: "GLM-B2026-024", quantity: 90, expiry_date: "2027-03-10", supplier_id: "ven-002", reorder_level: 60, price: 15, supplier_name: "PharmaLink International" },
  { id: "med-009", name: "Dextromethorphan Syrup", batch_no: "DEX-B2025-099", quantity: 12, expiry_date: "2026-08-01", supplier_id: "ven-001", reorder_level: 30, price: 65, supplier_name: "MediSupply BD" },
  { id: "med-010", name: "Ferrous Sulfate 325mg", batch_no: "FER-B2026-061", quantity: 450, expiry_date: "2028-01-15", supplier_id: "ven-003", reorder_level: 100, price: 5, supplier_name: "HealthFirst Distributors" },
];

export const mockVendors: Vendor[] = [
  { id: "ven-001", name: "MediSupply BD", contact: "+880 1711 223344", email: "orders@medisupplybd.com" },
  { id: "ven-002", name: "PharmaLink International", contact: "+880 1811 556677", email: "supply@pharmalink.com" },
  { id: "ven-003", name: "HealthFirst Distributors", contact: "+880 1911 889900", email: "sales@healthfirst.com.bd" },
];

export const mockPharmacyOrders: PharmacyOrder[] = [
  { id: "po-001", prescription_id: "rx-104", status: "DELIVERED", delivery_type: "pickup", total: 430, created_at: "2026-06-09T15:00:00Z", patient_name: "Jamal Hasan", prescription_code: "RX-2026-104" },
  { id: "po-002", prescription_id: "rx-001", status: "DELIVERED", delivery_type: "home_delivery", total: 1250, created_at: "2026-05-20T13:00:00Z", patient_name: "Aisha Rahman", prescription_code: "RX-2026-001" },
  { id: "po-003", prescription_id: "rx-002", status: "DELIVERED", delivery_type: "pickup", total: 780, created_at: "2026-04-10T11:00:00Z", patient_name: "Aisha Rahman", prescription_code: "RX-2026-002" },
  { id: "po-004", prescription_id: "rx-101", status: "PENDING", delivery_type: "pickup", total: 0, created_at: "2026-06-10T09:15:00Z", patient_name: "Rafiq Ahmed", prescription_code: "RX-2026-101" },
  { id: "po-005", prescription_id: "rx-102", status: "PENDING", delivery_type: "home_delivery", total: 0, created_at: "2026-06-10T09:45:00Z", patient_name: "Kamal Uddin", prescription_code: "RX-2026-102" },
];
