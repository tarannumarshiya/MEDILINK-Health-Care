export type InsurancePolicy = {
  id: string;
  patient_id: string;
  policy_no: string;
  provider: string;
  coverage_amount: number;
  valid_until: string;
  /* Display */
  patient_name?: string;
};

export type InsuranceClaim = {
  id: string;
  patient_id: string;
  policy_id: string;
  appointment_id: string | null;
  amount: number;
  status: string; // "PENDING" | "APPROVED" | "REJECTED" | "SETTLED"
  decision_reason: string | null;
  settled_amount: number | null;
  created_at: string;
  /* Display */
  patient_name?: string;
  policy_no?: string;
};
