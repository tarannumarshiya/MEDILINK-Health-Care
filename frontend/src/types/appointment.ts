export type Appointment = {
  id: string;
  appointment_code: string;
  patient_id: string | null;
  patient_name: string;
  patient_phone: string;
  patient_email: string | null;
  department: string;
  preferred_date: string;
  preferred_time: string | null;
  symptoms: string | null;
  status: string;
  created_at: string;
};