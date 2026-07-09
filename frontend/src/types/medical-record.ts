export type MedicalRecord = {
  id: string;
  patient_id: string;
  type: string; // "diagnosis" | "report" | "vaccination" | "document"
  title: string;
  file_url: string | null;
  notes: string | null;
  created_at: string;
};
