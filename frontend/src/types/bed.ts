export type Bed = {
  id: string;
  ward: string;
  bed_no: string;
  is_occupied: boolean;
  patient_id: string | null;
  /* Display */
  patient_name?: string;
};
