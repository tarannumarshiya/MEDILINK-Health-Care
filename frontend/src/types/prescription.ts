export type Prescription = {
  id: string;
  appointment_id: string;
  doctor_id: string;
  prescription_notes: string;
  status: string;
  created_at: string;
  /* Joined display fields */
  doctor_name?: string;
  patient_name?: string;
};

export type PrescriptionItem = {
  id: string;
  prescription_id: string;
  medicine_name: string;
  dosage: string;
  quantity: number;
  instructions: string;
};

export type PrescriptionWithItems = Prescription & {
  items: PrescriptionItem[];
};
