export type Doctor = {
  id: string;
  profile_id: string;
  department_id: string;
  qualification: string | null;
  experience_years: number;
  consultation_fee: number;
  is_available: boolean;
  created_at: string;
  /* Joined fields for display */
  full_name?: string;
  email?: string;
  department_name?: string;
};
