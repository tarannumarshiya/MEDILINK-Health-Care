export type Patient = {
  id: string;
  patient_code: string;
  full_name: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  phone: string;
  email: string | null;
  address: string | null;
  description: string | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  medical_history: string | null;
  created_at: string;
};