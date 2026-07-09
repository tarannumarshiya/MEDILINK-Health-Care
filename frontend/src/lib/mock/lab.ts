import type { LabTest, LabReport } from "@/types/lab";

export const mockTestRequests: LabTest[] = [
  { id: "lt-101", appointment_id: "apt-301", patient_id: "pat-010", doctor_id: "doc-001", test_type: "Complete Blood Count (CBC)", status: "PENDING", sample_collected_at: null, created_at: "2026-06-10T08:00:00Z", patient_name: "Nasir Uddin", doctor_name: "Dr. Farid Hossain" },
  { id: "lt-102", appointment_id: "apt-302", patient_id: "pat-011", doctor_id: "doc-002", test_type: "Liver Function Test (LFT)", status: "PENDING", sample_collected_at: null, created_at: "2026-06-10T08:30:00Z", patient_name: "Meherun Nessa", doctor_name: "Dr. Rashida Begum" },
  { id: "lt-103", appointment_id: "apt-303", patient_id: "pat-012", doctor_id: "doc-003", test_type: "Thyroid Function Test (TFT)", status: "COLLECTED", sample_collected_at: "2026-06-10T09:00:00Z", created_at: "2026-06-10T07:30:00Z", patient_name: "Abul Kashem", doctor_name: "Dr. Nusrat Jahan" },
  { id: "lt-104", appointment_id: "apt-304", patient_id: "pat-013", doctor_id: "doc-001", test_type: "HbA1c", status: "PROCESSING", sample_collected_at: "2026-06-09T14:00:00Z", created_at: "2026-06-09T10:00:00Z", patient_name: "Shahana Parvin", doctor_name: "Dr. Farid Hossain" },
  { id: "lt-105", appointment_id: "apt-305", patient_id: "pat-014", doctor_id: "doc-004", test_type: "Urinalysis", status: "PROCESSING", sample_collected_at: "2026-06-09T15:00:00Z", created_at: "2026-06-09T11:00:00Z", patient_name: "Rezaul Karim", doctor_name: "Dr. Shafiqul Alam" },
  { id: "lt-106", appointment_id: "apt-306", patient_id: "pat-015", doctor_id: "doc-002", test_type: "Lipid Profile", status: "COMPLETED", sample_collected_at: "2026-06-08T10:00:00Z", created_at: "2026-06-08T08:00:00Z", patient_name: "Tahmina Akhter", doctor_name: "Dr. Rashida Begum" },
  { id: "lt-107", appointment_id: "apt-307", patient_id: "pat-016", doctor_id: "doc-003", test_type: "Serum Creatinine", status: "VERIFIED", sample_collected_at: "2026-06-07T09:00:00Z", created_at: "2026-06-07T07:00:00Z", patient_name: "Zahirul Islam", doctor_name: "Dr. Nusrat Jahan" },
];

export const mockLabReports: LabReport[] = [
  { id: "lr-101", lab_test_id: "lt-106", result_summary: "Total Cholesterol: 210 mg/dL (borderline high), HDL: 48 mg/dL, LDL: 138 mg/dL, Triglycerides: 165 mg/dL", file_url: "/reports/lipid-2026-06.pdf", verified_by: null, verified_at: null, test_type: "Lipid Profile", patient_name: "Tahmina Akhter" },
  { id: "lr-102", lab_test_id: "lt-107", result_summary: "Serum Creatinine: 0.9 mg/dL (Normal), eGFR: 98 mL/min (Normal kidney function)", file_url: "/reports/creatinine-2026-06.pdf", verified_by: "Dr. Aminul Islam", verified_at: "2026-06-07T15:00:00Z", test_type: "Serum Creatinine", patient_name: "Zahirul Islam" },
];
