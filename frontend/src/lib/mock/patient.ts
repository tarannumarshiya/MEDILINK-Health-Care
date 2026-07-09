import type { Patient, Appointment, MedicalRecord, Notification } from "@/types";
import type { PrescriptionWithItems } from "@/types/prescription";
import type { LabReport } from "@/types/lab";
import type { InsuranceClaim } from "@/types/insurance";
import type { Invoice } from "@/types/billing";
import type { TelemedicineSession } from "@/types/telemedicine";

export const mockPatientProfile: Patient & {
  profile_id: string;
  emergency_contact: string;
  blood_group: string;
} = {
  id: "pat-001",
  patient_code: "PAT-2026-482916",
  full_name: "Aisha Rahman",
  age: 34,
  gender: "FEMALE",
  phone: "+880 1712 334455",
  email: "aisha.rahman@email.com",
  description: "Regular checkup patient",
  address: "42/A, Gulshan-2, Dhaka, Bangladesh",
  insurance_provider: null,
  insurance_policy_number: null,
  medical_history: null,
  created_at: "2025-11-10T09:30:00Z",
  profile_id: "prof-pat-001",
  emergency_contact: "+880 1912 667788 (Husband — Karim Rahman)",
  blood_group: "B+",
};

export const mockMedicalRecords: MedicalRecord[] = [
  { id: "mr-001", patient_id: "pat-001", type: "diagnosis", title: "Seasonal Allergic Rhinitis — Spring 2026", file_url: null, notes: "Prescribed cetirizine 10mg daily. Follow up in 2 weeks.", created_at: "2026-05-20T10:00:00Z" },
  { id: "mr-002", patient_id: "pat-001", type: "report", title: "Complete Blood Count (CBC)", file_url: "/reports/cbc-2026-04.pdf", notes: "All values within normal range.", created_at: "2026-04-12T11:30:00Z" },
  { id: "mr-003", patient_id: "pat-001", type: "vaccination", title: "COVID-19 Booster — Pfizer", file_url: "/reports/vaccine-cert.pdf", notes: "4th dose administered. No adverse reactions.", created_at: "2026-02-15T14:00:00Z" },
  { id: "mr-004", patient_id: "pat-001", type: "document", title: "Insurance Pre-Authorization Letter", file_url: "/documents/preauth-2026.pdf", notes: "Approved for cardiac screening package.", created_at: "2026-01-08T09:00:00Z" },
  { id: "mr-005", patient_id: "pat-001", type: "diagnosis", title: "Mild Iron Deficiency Anemia", file_url: null, notes: "Started ferrous sulfate 325mg twice daily. Recheck ferritin in 3 months.", created_at: "2025-12-05T16:00:00Z" },
  { id: "mr-006", patient_id: "pat-001", type: "report", title: "Thyroid Function Test (TFT)", file_url: "/reports/tft-2025-11.pdf", notes: "TSH: 2.8 mIU/L (Normal). Free T4: 1.2 ng/dL (Normal).", created_at: "2025-11-18T10:30:00Z" },
];

export const mockPatientAppointments: Appointment[] = [
  { id: "apt-001", appointment_code: "APT-2026-719283", patient_id: "pat-001", patient_name: "Aisha Rahman", patient_phone: "+880 1712 334455", patient_email: "aisha.rahman@email.com", department: "General Medicine", preferred_date: "2026-06-15", preferred_time: "10:00 AM", symptoms: "Persistent headache and fatigue for 3 days", status: "APPROVED", created_at: "2026-06-10T08:00:00Z" },
  { id: "apt-002", appointment_code: "APT-2026-812394", patient_id: "pat-001", patient_name: "Aisha Rahman", patient_phone: "+880 1712 334455", patient_email: "aisha.rahman@email.com", department: "Cardiology", preferred_date: "2026-06-20", preferred_time: "02:30 PM", symptoms: "Annual cardiac screening", status: "PENDING", created_at: "2026-06-09T14:00:00Z" },
  { id: "apt-003", appointment_code: "APT-2026-503817", patient_id: "pat-001", patient_name: "Aisha Rahman", patient_phone: "+880 1712 334455", patient_email: "aisha.rahman@email.com", department: "General Medicine", preferred_date: "2026-05-20", preferred_time: "11:00 AM", symptoms: "Seasonal allergies — sneezing, runny nose", status: "COMPLETED", created_at: "2026-05-15T09:00:00Z" },
  { id: "apt-004", appointment_code: "APT-2026-294756", patient_id: "pat-001", patient_name: "Aisha Rahman", patient_phone: "+880 1712 334455", patient_email: "aisha.rahman@email.com", department: "Gynecology / Obstetrics", preferred_date: "2026-04-10", preferred_time: "09:30 AM", symptoms: "Routine wellness checkup", status: "COMPLETED", created_at: "2026-04-05T08:00:00Z" },
  { id: "apt-005", appointment_code: "APT-2026-638291", patient_id: "pat-001", patient_name: "Aisha Rahman", patient_phone: "+880 1712 334455", patient_email: "aisha.rahman@email.com", department: "Neurology", preferred_date: "2026-03-15", preferred_time: null, symptoms: "Migraine evaluation", status: "REJECTED", created_at: "2026-03-12T10:00:00Z" },
];

export const mockPatientPrescriptions: PrescriptionWithItems[] = [
  {
    id: "rx-001", appointment_id: "apt-003", doctor_id: "doc-001", prescription_notes: "Allergic rhinitis — antihistamine therapy for 14 days. Avoid dust exposure.", status: "DISPENSED", created_at: "2026-05-20T11:30:00Z", doctor_name: "Dr. Farid Hossain", patient_name: "Aisha Rahman",
    items: [
      { id: "rxi-001", prescription_id: "rx-001", medicine_name: "Cetirizine 10mg", dosage: "10mg", quantity: 14, instructions: "Once daily at bedtime" },
      { id: "rxi-002", prescription_id: "rx-001", medicine_name: "Fluticasone Nasal Spray", dosage: "50mcg/spray", quantity: 1, instructions: "Two sprays each nostril, morning" },
    ],
  },
  {
    id: "rx-002", appointment_id: "apt-004", doctor_id: "doc-003", prescription_notes: "Iron supplementation for mild anemia. Recheck ferritin in 90 days.", status: "DISPENSED", created_at: "2026-04-10T10:00:00Z", doctor_name: "Dr. Nusrat Jahan", patient_name: "Aisha Rahman",
    items: [
      { id: "rxi-003", prescription_id: "rx-002", medicine_name: "Ferrous Sulfate 325mg", dosage: "325mg", quantity: 90, instructions: "Twice daily with vitamin C, after meals" },
      { id: "rxi-004", prescription_id: "rx-002", medicine_name: "Vitamin C 500mg", dosage: "500mg", quantity: 90, instructions: "Once daily with iron supplement" },
    ],
  },
  {
    id: "rx-003", appointment_id: "apt-001", doctor_id: "doc-001", prescription_notes: "Pending — headache evaluation in progress.", status: "PENDING", created_at: "2026-06-10T08:30:00Z", doctor_name: "Dr. Farid Hossain", patient_name: "Aisha Rahman",
    items: [],
  },
];

export const mockPatientLabReports: LabReport[] = [
  { id: "lr-001", lab_test_id: "lt-001", result_summary: "Hemoglobin: 11.2 g/dL (slightly low), WBC: 7,200/μL (normal), Platelets: 250,000/μL (normal)", file_url: "/reports/cbc-2026-04.pdf", verified_by: "Dr. Aminul Islam", verified_at: "2026-04-13T09:00:00Z", test_type: "Complete Blood Count (CBC)", patient_name: "Aisha Rahman" },
  { id: "lr-002", lab_test_id: "lt-002", result_summary: "TSH: 2.8 mIU/L (Normal), Free T4: 1.2 ng/dL (Normal)", file_url: "/reports/tft-2025-11.pdf", verified_by: "Dr. Aminul Islam", verified_at: "2025-11-19T10:00:00Z", test_type: "Thyroid Function Test", patient_name: "Aisha Rahman" },
  { id: "lr-003", lab_test_id: "lt-003", result_summary: "Ferritin: 18 ng/mL (low — indicates iron deficiency)", file_url: "/reports/ferritin-2025-12.pdf", verified_by: "Dr. Aminul Islam", verified_at: "2025-12-06T11:00:00Z", test_type: "Serum Ferritin", patient_name: "Aisha Rahman" },
  { id: "lr-004", lab_test_id: "lt-004", result_summary: "Fasting Glucose: 92 mg/dL (Normal), HbA1c: 5.1% (Normal)", file_url: "/reports/glucose-2026-01.pdf", verified_by: "Dr. Shafiqul Alam", verified_at: "2026-01-12T14:00:00Z", test_type: "Blood Glucose & HbA1c", patient_name: "Aisha Rahman" },
];

export const mockPatientInsuranceClaims: InsuranceClaim[] = [
  { id: "clm-001", patient_id: "pat-001", policy_id: "pol-001", appointment_id: "apt-003", amount: 2500, status: "SETTLED", decision_reason: "Covered under outpatient benefit", settled_amount: 2100, created_at: "2026-05-21T10:00:00Z", patient_name: "Aisha Rahman", policy_no: "MED-POL-2026-8837" },
  { id: "clm-002", patient_id: "pat-001", policy_id: "pol-001", appointment_id: "apt-004", amount: 4500, status: "APPROVED", decision_reason: "Routine checkup covered", settled_amount: 4000, created_at: "2026-04-11T12:00:00Z", patient_name: "Aisha Rahman", policy_no: "MED-POL-2026-8837" },
  { id: "clm-003", patient_id: "pat-001", policy_id: "pol-001", appointment_id: "apt-001", amount: 3000, status: "PENDING", decision_reason: null, settled_amount: null, created_at: "2026-06-10T09:00:00Z", patient_name: "Aisha Rahman", policy_no: "MED-POL-2026-8837" },
];

export const mockPatientInvoices: Invoice[] = [
  { id: "inv-001", invoice_code: "INV-2026-382910", patient_id: "pat-001", appointment_id: "apt-003", consultation_charge: 800, lab_charge: 600, medicine_charge: 1100, insurance_deduction: 2100, total: 400, status: "PAID", created_at: "2026-05-20T12:00:00Z", patient_name: "Aisha Rahman" },
  { id: "inv-002", invoice_code: "INV-2026-492817", patient_id: "pat-001", appointment_id: "apt-004", consultation_charge: 1200, lab_charge: 1500, medicine_charge: 1800, insurance_deduction: 4000, total: 500, status: "PAID", created_at: "2026-04-10T11:00:00Z", patient_name: "Aisha Rahman" },
  { id: "inv-003", invoice_code: "INV-2026-571938", patient_id: "pat-001", appointment_id: "apt-001", consultation_charge: 800, lab_charge: 0, medicine_charge: 0, insurance_deduction: 0, total: 800, status: "UNPAID", created_at: "2026-06-10T08:30:00Z", patient_name: "Aisha Rahman" },
];

export const mockPatientNotifications: Notification[] = [
  { id: "notif-001", user_id: "pat-001", title: "Appointment Confirmed", body: "Your appointment with General Medicine on June 15, 2026 at 10:00 AM has been approved.", is_read: false, created_at: "2026-06-10T08:15:00Z" },
  { id: "notif-002", user_id: "pat-001", title: "Lab Report Ready", body: "Your Blood Glucose & HbA1c report is ready for download.", is_read: false, created_at: "2026-06-09T16:00:00Z" },
  { id: "notif-003", user_id: "pat-001", title: "Prescription Dispensed", body: "Your prescription RX-001 has been dispensed. Pick up from pharmacy counter 3.", is_read: true, created_at: "2026-05-20T14:00:00Z" },
  { id: "notif-004", user_id: "pat-001", title: "Insurance Claim Settled", body: "Claim CLM-001 for ₹2,500 has been settled. ₹2,100 covered by insurance.", is_read: true, created_at: "2026-05-22T10:00:00Z" },
  { id: "notif-005", user_id: "pat-001", title: "Appointment Rejected", body: "Your Neurology appointment request for March 15 was not approved. Please reschedule.", is_read: true, created_at: "2026-03-13T09:00:00Z" },
  { id: "notif-006", user_id: "pat-001", title: "Upcoming Video Consultation", body: "You have a teleconsultation scheduled with Dr. Farid Hossain on June 18, 2026 at 3:00 PM.", is_read: false, created_at: "2026-06-08T10:00:00Z" },
];

export const mockPatientTeleSessions: TelemedicineSession[] = [
  { id: "ts-001", appointment_id: "apt-001", doctor_id: "doc-001", patient_id: "pat-001", scheduled_at: "2026-06-18T15:00:00Z", status: "SCHEDULED", recording_url: null, doctor_name: "Dr. Farid Hossain", patient_name: "Aisha Rahman" },
  { id: "ts-002", appointment_id: "apt-003", doctor_id: "doc-001", patient_id: "pat-001", scheduled_at: "2026-05-19T11:00:00Z", status: "COMPLETED", recording_url: "/recordings/ts-002.mp4", doctor_name: "Dr. Farid Hossain", patient_name: "Aisha Rahman" },
];
