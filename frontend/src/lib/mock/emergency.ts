import type { Bed } from "@/types/bed";

export const mockActiveCases: {
  id: string;
  patient_name: string;
  age: number;
  severity: string;
  description: string;
  arrival_time: string;
  department: string;
  status: string;
}[] = [
  { id: "ec-001", patient_name: "Mohammad Ali", age: 58, severity: "CRITICAL", description: "Acute myocardial infarction — chest pain, shortness of breath, diaphoresis", arrival_time: "2026-06-10T08:15:00Z", department: "Cardiology", status: "IN_TREATMENT" },
  { id: "ec-002", patient_name: "Rubina Khatun", age: 32, severity: "URGENT", description: "Severe allergic reaction (anaphylaxis) — bee sting, swelling, difficulty breathing", arrival_time: "2026-06-10T09:00:00Z", department: "Emergency / Trauma", status: "IN_TREATMENT" },
  { id: "ec-003", patient_name: "Farhan Khan", age: 22, severity: "URGENT", description: "Road traffic accident — left leg fracture, head laceration", arrival_time: "2026-06-10T09:30:00Z", department: "Orthopedics", status: "AWAITING_TRIAGE" },
  { id: "ec-004", patient_name: "Monira Begum", age: 67, severity: "CRITICAL", description: "Suspected stroke — sudden onset left-side weakness, slurred speech", arrival_time: "2026-06-10T10:00:00Z", department: "Neurology", status: "IN_TREATMENT" },
  { id: "ec-005", patient_name: "Sajid Rahman", age: 8, severity: "NORMAL", description: "High fever (104°F), vomiting, dehydration", arrival_time: "2026-06-10T10:15:00Z", department: "Pediatrics", status: "AWAITING_TRIAGE" },
  { id: "ec-006", patient_name: "Hasina Akter", age: 45, severity: "LOW", description: "Deep cut on right forearm — kitchen accident, bleeding controlled", arrival_time: "2026-06-10T10:30:00Z", department: "General Medicine", status: "STABLE" },
];

export const mockBeds: Bed[] = [
  { id: "bed-001", ward: "ICU", bed_no: "ICU-01", is_occupied: true, patient_id: "ec-001", patient_name: "Mohammad Ali" },
  { id: "bed-002", ward: "ICU", bed_no: "ICU-02", is_occupied: true, patient_id: "ec-004", patient_name: "Monira Begum" },
  { id: "bed-003", ward: "ICU", bed_no: "ICU-03", is_occupied: false, patient_id: null },
  { id: "bed-004", ward: "ICU", bed_no: "ICU-04", is_occupied: false, patient_id: null },
  { id: "bed-005", ward: "Emergency", bed_no: "ER-01", is_occupied: true, patient_id: "ec-002", patient_name: "Rubina Khatun" },
  { id: "bed-006", ward: "Emergency", bed_no: "ER-02", is_occupied: true, patient_id: "ec-003", patient_name: "Farhan Khan" },
  { id: "bed-007", ward: "Emergency", bed_no: "ER-03", is_occupied: false, patient_id: null },
  { id: "bed-008", ward: "Emergency", bed_no: "ER-04", is_occupied: false, patient_id: null },
  { id: "bed-009", ward: "General", bed_no: "GEN-01", is_occupied: true, patient_id: "ec-006", patient_name: "Hasina Akter" },
  { id: "bed-010", ward: "General", bed_no: "GEN-02", is_occupied: false, patient_id: null },
  { id: "bed-011", ward: "General", bed_no: "GEN-03", is_occupied: false, patient_id: null },
  { id: "bed-012", ward: "General", bed_no: "GEN-04", is_occupied: false, patient_id: null },
  { id: "bed-013", ward: "Pediatric", bed_no: "PED-01", is_occupied: true, patient_id: "ec-005", patient_name: "Sajid Rahman" },
  { id: "bed-014", ward: "Pediatric", bed_no: "PED-02", is_occupied: false, patient_id: null },
  { id: "bed-015", ward: "Pediatric", bed_no: "PED-03", is_occupied: false, patient_id: null },
  { id: "bed-016", ward: "Cardiac", bed_no: "CARD-01", is_occupied: false, patient_id: null },
  { id: "bed-017", ward: "Cardiac", bed_no: "CARD-02", is_occupied: false, patient_id: null },
  { id: "bed-018", ward: "Cardiac", bed_no: "CARD-03", is_occupied: false, patient_id: null },
];
