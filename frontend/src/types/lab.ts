export type LabTest = {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  test_type: string;
  status: string; // "PENDING" | "COLLECTED" | "PROCESSING" | "COMPLETED" | "VERIFIED"
  sample_collected_at: string | null;
  created_at: string;
  /* Display */
  patient_name?: string;
  doctor_name?: string;
};

export type LabReport = {
  id: string;
  lab_test_id: string;
  result_summary: string;
  file_url: string | null;
  verified_by: string | null;
  verified_at: string | null;
  /* Display */
  test_type?: string;
  patient_name?: string;
};
