import type { InsuranceClaim, InsurancePolicy } from "@/types/insurance";

export const mockInsurancePolicies: InsurancePolicy[] = [
  { id: "pol-001", patient_id: "pat-001", policy_no: "MED-POL-2026-8837", provider: "Guardian Life Insurance", coverage_amount: 500000, valid_until: "2027-03-31", patient_name: "Aisha Rahman" },
  { id: "pol-002", patient_id: "pat-010", policy_no: "MED-POL-2026-7723", provider: "Delta Life Insurance", coverage_amount: 300000, valid_until: "2026-12-31", patient_name: "Nasir Uddin" },
  { id: "pol-003", patient_id: "pat-011", policy_no: "MED-POL-2025-5511", provider: "MetLife Bangladesh", coverage_amount: 750000, valid_until: "2027-06-30", patient_name: "Meherun Nessa" },
  { id: "pol-004", patient_id: "pat-012", policy_no: "MED-POL-2026-9945", provider: "National Life Insurance", coverage_amount: 200000, valid_until: "2026-09-15", patient_name: "Abul Kashem" },
  { id: "pol-005", patient_id: "pat-013", policy_no: "MED-POL-2026-3312", provider: "Guardian Life Insurance", coverage_amount: 1000000, valid_until: "2027-12-31", patient_name: "Shahana Parvin" },
  { id: "pol-006", patient_id: "pat-014", policy_no: "MED-POL-2026-6678", provider: "Delta Life Insurance", coverage_amount: 400000, valid_until: "2027-01-31", patient_name: "Rezaul Karim" },
];

export const mockInsuranceClaims: InsuranceClaim[] = [
  { id: "clm-101", patient_id: "pat-001", policy_id: "pol-001", appointment_id: "apt-003", amount: 2500, status: "SETTLED", decision_reason: "Covered under outpatient benefit", settled_amount: 2100, created_at: "2026-05-21T10:00:00Z", patient_name: "Aisha Rahman", policy_no: "MED-POL-2026-8837" },
  { id: "clm-102", patient_id: "pat-010", policy_id: "pol-002", appointment_id: "apt-301", amount: 8500, status: "PENDING", decision_reason: null, settled_amount: null, created_at: "2026-06-10T08:30:00Z", patient_name: "Nasir Uddin", policy_no: "MED-POL-2026-7723" },
  { id: "clm-103", patient_id: "pat-011", policy_id: "pol-003", appointment_id: "apt-302", amount: 12000, status: "PENDING", decision_reason: null, settled_amount: null, created_at: "2026-06-10T09:00:00Z", patient_name: "Meherun Nessa", policy_no: "MED-POL-2025-5511" },
  { id: "clm-104", patient_id: "pat-013", policy_id: "pol-005", appointment_id: "apt-304", amount: 5200, status: "APPROVED", decision_reason: "Eligible under comprehensive plan", settled_amount: 5000, created_at: "2026-06-09T14:00:00Z", patient_name: "Shahana Parvin", policy_no: "MED-POL-2026-3312" },
  { id: "clm-105", patient_id: "pat-014", policy_id: "pol-006", appointment_id: "apt-305", amount: 3800, status: "REJECTED", decision_reason: "Pre-existing condition exclusion period not met", settled_amount: null, created_at: "2026-06-08T11:00:00Z", patient_name: "Rezaul Karim", policy_no: "MED-POL-2026-6678" },
  { id: "clm-106", patient_id: "pat-012", policy_id: "pol-004", appointment_id: "apt-303", amount: 6700, status: "APPROVED", decision_reason: "Covered under diagnostic benefit", settled_amount: 6200, created_at: "2026-06-07T10:00:00Z", patient_name: "Abul Kashem", policy_no: "MED-POL-2026-9945" },
];
