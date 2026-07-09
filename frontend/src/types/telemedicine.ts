export type TelemedicineSession = {
  id: string;
  appointment_id: string | null;
  doctor_id: string;
  patient_id: string;
  scheduled_at: string;
  status: string; // "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED"
  recording_url: string | null;
  /* Display */
  doctor_name?: string;
  patient_name?: string;
};
