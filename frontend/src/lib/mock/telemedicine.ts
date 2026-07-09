import type { TelemedicineSession } from "@/types/telemedicine";
import type { PrescriptionWithItems } from "@/types/prescription";

export const mockTeleSessions: TelemedicineSession[] = [
  { id: "ts-101", appointment_id: "apt-501", doctor_id: "doc-001", patient_id: "pat-001", scheduled_at: "2026-06-12T15:00:00Z", status: "SCHEDULED", recording_url: null, doctor_name: "Dr. Farid Hossain", patient_name: "Aisha Rahman" },
  { id: "ts-102", appointment_id: "apt-502", doctor_id: "doc-002", patient_id: "pat-010", scheduled_at: "2026-06-12T16:00:00Z", status: "SCHEDULED", recording_url: null, doctor_name: "Dr. Rashida Begum", patient_name: "Nasir Uddin" },
  { id: "ts-103", appointment_id: "apt-503", doctor_id: "doc-001", patient_id: "pat-012", scheduled_at: "2026-06-10T11:00:00Z", status: "ONGOING", recording_url: null, doctor_name: "Dr. Farid Hossain", patient_name: "Abul Kashem" },
  { id: "ts-104", appointment_id: "apt-504", doctor_id: "doc-003", patient_id: "pat-013", scheduled_at: "2026-06-09T14:00:00Z", status: "COMPLETED", recording_url: "/recordings/ts-104.mp4", doctor_name: "Dr. Nusrat Jahan", patient_name: "Shahana Parvin" },
  { id: "ts-105", appointment_id: "apt-505", doctor_id: "doc-004", patient_id: "pat-014", scheduled_at: "2026-06-08T10:00:00Z", status: "COMPLETED", recording_url: "/recordings/ts-105.mp4", doctor_name: "Dr. Shafiqul Alam", patient_name: "Rezaul Karim" },
  { id: "ts-106", appointment_id: "apt-506", doctor_id: "doc-002", patient_id: "pat-015", scheduled_at: "2026-06-07T09:00:00Z", status: "CANCELLED", recording_url: null, doctor_name: "Dr. Rashida Begum", patient_name: "Tahmina Akhter" },
];

export const mockRecordings: { id: string; session_id: string; doctor_name: string; patient_name: string; date: string; duration: string; url: string }[] = [
  { id: "rec-001", session_id: "ts-104", doctor_name: "Dr. Nusrat Jahan", patient_name: "Shahana Parvin", date: "2026-06-09", duration: "28 min", url: "/recordings/ts-104.mp4" },
  { id: "rec-002", session_id: "ts-105", doctor_name: "Dr. Shafiqul Alam", patient_name: "Rezaul Karim", date: "2026-06-08", duration: "35 min", url: "/recordings/ts-105.mp4" },
];

export const mockDigitalPrescriptions: PrescriptionWithItems[] = [
  {
    id: "rx-201", appointment_id: "apt-504", doctor_id: "doc-003", prescription_notes: "Teleconsult follow-up: Continue diabetes management. Adjust metformin dosage.", status: "DISPENSED", created_at: "2026-06-09T14:30:00Z", doctor_name: "Dr. Nusrat Jahan", patient_name: "Shahana Parvin",
    items: [
      { id: "rxi-201", prescription_id: "rx-201", medicine_name: "Metformin 1000mg", dosage: "1000mg", quantity: 30, instructions: "Once daily with dinner (dose increased from 500mg)" },
    ],
  },
  {
    id: "rx-202", appointment_id: "apt-505", doctor_id: "doc-004", prescription_notes: "Post-teleconsult: Childhood eczema management.", status: "PENDING", created_at: "2026-06-08T10:30:00Z", doctor_name: "Dr. Shafiqul Alam", patient_name: "Rezaul Karim",
    items: [
      { id: "rxi-202", prescription_id: "rx-202", medicine_name: "Hydrocortisone Cream 1%", dosage: "Apply thin layer", quantity: 1, instructions: "Twice daily on affected areas for 7 days" },
      { id: "rxi-203", prescription_id: "rx-202", medicine_name: "Cetirizine 10mg", dosage: "10mg", quantity: 14, instructions: "Once daily at bedtime" },
    ],
  },
];
