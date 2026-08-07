export type Doctor = {
  id: string;
  profile_id: string;
  name: string | null;
  email: string | null;
  department_id: string;
  qualification: string | null;
  experience_years: number;
  consultation_fee: number;
  is_available: boolean;
  created_at: string;
  /* Joined fields for display */
  full_name?: string;
  department_name?: string;
};
