import type { Appointment, Doctor } from "@/types";

export const mockTodayAppointments: Appointment[] = [
  { id: "apt-401", appointment_code: "APT-2026-401001", patient_id: "pat-001", patient_name: "Aisha Rahman", patient_phone: "+880 1712 334455", patient_email: "aisha.rahman@email.com", department: "General Medicine", preferred_date: "2026-06-10", preferred_time: "10:00 AM", symptoms: "Persistent headache and fatigue", status: "APPROVED", created_at: "2026-06-09T08:00:00Z" },
  { id: "apt-402", appointment_code: "APT-2026-402002", patient_id: "pat-010", patient_name: "Nasir Uddin", patient_phone: "+880 1712 112233", patient_email: "nasir.uddin@email.com", department: "Cardiology", preferred_date: "2026-06-10", preferred_time: "10:30 AM", symptoms: "Chest discomfort during exercise", status: "APPROVED", created_at: "2026-06-08T14:00:00Z" },
  { id: "apt-403", appointment_code: "APT-2026-403003", patient_id: "pat-011", patient_name: "Meherun Nessa", patient_phone: "+880 1712 445566", patient_email: null, department: "Neurology", preferred_date: "2026-06-10", preferred_time: "11:00 AM", symptoms: "Recurring migraine episodes", status: "IN_PROGRESS", created_at: "2026-06-07T10:00:00Z" },
  { id: "apt-404", appointment_code: "APT-2026-404004", patient_id: "pat-012", patient_name: "Abul Kashem", patient_phone: "+880 1712 778899", patient_email: "abul.k@email.com", department: "Orthopedics", preferred_date: "2026-06-10", preferred_time: "02:00 PM", symptoms: "Lower back pain for 2 weeks", status: "PENDING", created_at: "2026-06-10T06:00:00Z" },
  { id: "apt-405", appointment_code: "APT-2026-405005", patient_id: "pat-013", patient_name: "Shahana Parvin", patient_phone: "+880 1712 990011", patient_email: "shahana.p@email.com", department: "General Medicine", preferred_date: "2026-06-10", preferred_time: "03:00 PM", symptoms: "Diabetes follow-up", status: "COMPLETED", created_at: "2026-06-05T09:00:00Z" },
  { id: "apt-406", appointment_code: "APT-2026-406006", patient_id: "pat-020", patient_name: "Habibur Rahman", patient_phone: "+880 1712 223311", patient_email: null, department: "Pediatrics", preferred_date: "2026-06-10", preferred_time: "04:00 PM", symptoms: "Child has high fever since yesterday", status: "PENDING", created_at: "2026-06-10T07:00:00Z" },
];

export const mockWalkIns: { id: string; patient_name: string; phone: string; department: string; reason: string; arrival_time: string; status: string }[] = [
  { id: "wi-001", patient_name: "Momin Haque", phone: "+880 1712 111222", department: "Emergency / Trauma", reason: "Cut wound on left hand", arrival_time: "2026-06-10T08:45:00Z", status: "IN_QUEUE" },
  { id: "wi-002", patient_name: "Rima Sultana", phone: "+880 1712 333444", department: "General Medicine", reason: "Severe stomach pain", arrival_time: "2026-06-10T09:10:00Z", status: "IN_QUEUE" },
  { id: "wi-003", patient_name: "Sumon Das", phone: "+880 1712 555666", department: "Orthopedics", reason: "Twisted ankle — sports injury", arrival_time: "2026-06-10T09:30:00Z", status: "SEEN" },
];

export const mockQueueItems: { id: string; patient_name: string; department: string; type: string; position: number; status: string; check_in_time: string }[] = [
  { id: "q-001", patient_name: "Aisha Rahman", department: "General Medicine", type: "appointment", position: 1, status: "WAITING", check_in_time: "2026-06-10T09:50:00Z" },
  { id: "q-002", patient_name: "Rima Sultana", department: "General Medicine", type: "walk-in", position: 2, status: "WAITING", check_in_time: "2026-06-10T09:15:00Z" },
  { id: "q-003", patient_name: "Nasir Uddin", department: "Cardiology", type: "appointment", position: 1, status: "WAITING", check_in_time: "2026-06-10T10:00:00Z" },
  { id: "q-004", patient_name: "Meherun Nessa", department: "Neurology", type: "appointment", position: 1, status: "WITH_DOCTOR", check_in_time: "2026-06-10T10:45:00Z" },
  { id: "q-005", patient_name: "Momin Haque", department: "Emergency / Trauma", type: "walk-in", position: 1, status: "WAITING", check_in_time: "2026-06-10T08:50:00Z" },
  { id: "q-006", patient_name: "Abul Kashem", department: "Orthopedics", type: "appointment", position: 1, status: "WAITING", check_in_time: "2026-06-10T13:45:00Z" },
];

export const mockDoctorAvailability: (Doctor & { full_name: string; department_name: string })[] = [
  { id: "doc-001", profile_id: "prof-001", department_id: "dept-001", qualification: "MBBS, FCPS (Medicine)", experience_years: 12, consultation_fee: 800, is_available: true, created_at: "2024-01-01T00:00:00Z", full_name: "Dr. Farid Hossain", department_name: "General Medicine" },
  { id: "doc-002", profile_id: "prof-002", department_id: "dept-002", qualification: "MBBS, MD (Cardiology)", experience_years: 18, consultation_fee: 1500, is_available: true, created_at: "2024-01-01T00:00:00Z", full_name: "Dr. Rashida Begum", department_name: "Cardiology" },
  { id: "doc-003", profile_id: "prof-003", department_id: "dept-003", qualification: "MBBS, FCPS (Gynae)", experience_years: 15, consultation_fee: 1200, is_available: false, created_at: "2024-01-01T00:00:00Z", full_name: "Dr. Nusrat Jahan", department_name: "Gynecology / Obstetrics" },
  { id: "doc-004", profile_id: "prof-004", department_id: "dept-004", qualification: "MBBS, DCH (Pediatrics)", experience_years: 8, consultation_fee: 700, is_available: true, created_at: "2024-01-01T00:00:00Z", full_name: "Dr. Shafiqul Alam", department_name: "Pediatrics" },
  { id: "doc-005", profile_id: "prof-005", department_id: "dept-005", qualification: "MBBS, MS (Ortho)", experience_years: 20, consultation_fee: 1800, is_available: true, created_at: "2024-01-01T00:00:00Z", full_name: "Dr. Mahbubul Haque", department_name: "Orthopedics" },
  { id: "doc-006", profile_id: "prof-006", department_id: "dept-006", qualification: "MBBS, MD (Neurology)", experience_years: 14, consultation_fee: 1600, is_available: true, created_at: "2024-01-01T00:00:00Z", full_name: "Dr. Farzana Ahmed", department_name: "Neurology" },
];
