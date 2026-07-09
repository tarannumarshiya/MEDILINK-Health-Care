export type Invoice = {
  id: string;
  invoice_code: string;
  patient_id: string;
  appointment_id: string | null;
  consultation_charge: number;
  lab_charge: number;
  medicine_charge: number;
  insurance_deduction: number;
  total: number;
  status: string; // "UNPAID" | "PAID" | "PARTIAL" | "REFUNDED"
  created_at: string;
  /* Display */
  patient_name?: string;
};

export type Payment = {
  id: string;
  invoice_id: string;
  amount: number;
  method: string; // "cash" | "card" | "upi" | "insurance"
  status: string; // "COMPLETED" | "PENDING" | "FAILED"
  created_at: string;
  /* Display */
  invoice_code?: string;
  patient_name?: string;
};

export type Refund = {
  id: string;
  invoice_id: string;
  amount: number;
  reason: string;
  status: string; // "PENDING" | "APPROVED" | "COMPLETED"
  created_at: string;
  invoice_code?: string;
  patient_name?: string;
};
