import type { Profile } from "@/types/profile";
import type { AuditLog } from "@/types/audit";

export const mockAllUsers: (Profile & { role_display: string })[] = [
  { id: "u-001", full_name: "Aisha Rahman", email: "aisha.rahman@email.com", role: "PATIENT", is_active: true, created_at: "2025-11-10T09:30:00Z", role_display: "Patient" },
  { id: "u-002", full_name: "Dr. Farid Hossain", email: "farid.h@medilink.com", role: "DOCTOR", is_active: true, created_at: "2024-01-15T08:00:00Z", role_display: "Doctor" },
  { id: "u-003", full_name: "Dr. Rashida Begum", email: "rashida.b@medilink.com", role: "DOCTOR", is_active: true, created_at: "2024-02-01T08:00:00Z", role_display: "Doctor" },
  { id: "u-004", full_name: "Sakib Al Hasan", email: "sakib.admin@medilink.com", role: "ADMIN", is_active: true, created_at: "2023-06-01T08:00:00Z", role_display: "Admin" },
  { id: "u-005", full_name: "Aminul Islam", email: "aminul.lab@medilink.com", role: "TESTER", is_active: true, created_at: "2024-03-01T08:00:00Z", role_display: "Lab Tester" },
  { id: "u-006", full_name: "Jahanara Begum", email: "jahanara.pharm@medilink.com", role: "PHARMACIST", is_active: true, created_at: "2024-04-01T08:00:00Z", role_display: "Pharmacist" },
  { id: "u-007", full_name: "Kamal Pasha", email: "kamal.emer@medilink.com", role: "EMERGENCY", is_active: true, created_at: "2024-05-01T08:00:00Z", role_display: "Emergency" },
  { id: "u-008", full_name: "Preetham VPD", email: "preetham@medilink.com", role: "SUPER_ADMIN", is_active: true, created_at: "2023-01-01T08:00:00Z", role_display: "Super Admin" },
  { id: "u-009", full_name: "Nasir Uddin", email: "nasir.u@email.com", role: "PATIENT", is_active: true, created_at: "2025-08-20T09:00:00Z", role_display: "Patient" },
  { id: "u-010", full_name: "Rezaul Karim", email: "rezaul.k@email.com", role: "PATIENT", is_active: false, created_at: "2025-06-15T09:00:00Z", role_display: "Patient" },
];

/* Role → Permission Matrix (source: PDF "System Roles & Access Matrix") */
export const mockRolePermissionMatrix: {
  module: string;
  SUPER_ADMIN: string;
  ADMIN: string;
  DOCTOR: string;
  TESTER: string;
  PHARMACIST: string;
  EMERGENCY: string;
  PATIENT: string;
}[] = [
  { module: "Dashboard", SUPER_ADMIN: "Manage", ADMIN: "Manage", DOCTOR: "View", TESTER: "View", PHARMACIST: "View", EMERGENCY: "View", PATIENT: "View" },
  { module: "Appointments", SUPER_ADMIN: "Manage", ADMIN: "Manage", DOCTOR: "View", TESTER: "✗", PHARMACIST: "✗", EMERGENCY: "View", PATIENT: "Manage" },
  { module: "Patient Records", SUPER_ADMIN: "Manage", ADMIN: "View", DOCTOR: "Manage", TESTER: "View", PHARMACIST: "View", EMERGENCY: "View", PATIENT: "View" },
  { module: "Prescriptions", SUPER_ADMIN: "Manage", ADMIN: "View", DOCTOR: "Manage", TESTER: "✗", PHARMACIST: "View", EMERGENCY: "✗", PATIENT: "View" },
  { module: "Lab Tests", SUPER_ADMIN: "Manage", ADMIN: "View", DOCTOR: "View", TESTER: "Manage", PHARMACIST: "✗", EMERGENCY: "✗", PATIENT: "View" },
  { module: "Pharmacy", SUPER_ADMIN: "Manage", ADMIN: "View", DOCTOR: "✗", TESTER: "✗", PHARMACIST: "Manage", EMERGENCY: "✗", PATIENT: "✗" },
  { module: "Billing", SUPER_ADMIN: "Manage", ADMIN: "Manage", DOCTOR: "✗", TESTER: "✗", PHARMACIST: "✗", EMERGENCY: "✗", PATIENT: "View" },
  { module: "Insurance", SUPER_ADMIN: "Manage", ADMIN: "View", DOCTOR: "✗", TESTER: "✗", PHARMACIST: "✗", EMERGENCY: "✗", PATIENT: "View" },
  { module: "User Management", SUPER_ADMIN: "Manage", ADMIN: "✗", DOCTOR: "✗", TESTER: "✗", PHARMACIST: "✗", EMERGENCY: "✗", PATIENT: "✗" },
  { module: "Departments", SUPER_ADMIN: "Manage", ADMIN: "Manage", DOCTOR: "View", TESTER: "✗", PHARMACIST: "✗", EMERGENCY: "✗", PATIENT: "✗" },
  { module: "Emergency Cases", SUPER_ADMIN: "Monitor", ADMIN: "Monitor", DOCTOR: "View", TESTER: "✗", PHARMACIST: "✗", EMERGENCY: "Manage", PATIENT: "✗" },
  { module: "Telemedicine", SUPER_ADMIN: "Manage", ADMIN: "View", DOCTOR: "Manage", TESTER: "✗", PHARMACIST: "✗", EMERGENCY: "✗", PATIENT: "View" },
  { module: "Audit Logs", SUPER_ADMIN: "Manage", ADMIN: "View", DOCTOR: "✗", TESTER: "✗", PHARMACIST: "✗", EMERGENCY: "✗", PATIENT: "✗" },
  { module: "Hospital Settings", SUPER_ADMIN: "Manage", ADMIN: "✗", DOCTOR: "✗", TESTER: "✗", PHARMACIST: "✗", EMERGENCY: "✗", PATIENT: "✗" },
];

export const mockAuditLogs: AuditLog[] = [
  { id: "al-001", actor_id: "u-004", action: "APPROVE_APPOINTMENT", entity: "appointments", detail: "Approved APT-2026-401001 for Aisha Rahman", created_at: "2026-06-10T08:15:00Z", actor_name: "Sakib Al Hasan" },
  { id: "al-002", actor_id: "u-002", action: "CREATE_PRESCRIPTION", entity: "prescriptions", detail: "Created prescription RX-101 for Rafiq Ahmed", created_at: "2026-06-10T09:00:00Z", actor_name: "Dr. Farid Hossain" },
  { id: "al-003", actor_id: "u-006", action: "DISPENSE_MEDICINE", entity: "pharmacy_orders", detail: "Dispensed order PO-001 — Paracetamol, Omeprazole", created_at: "2026-06-09T15:00:00Z", actor_name: "Jahanara Begum" },
  { id: "al-004", actor_id: "u-005", action: "VERIFY_REPORT", entity: "lab_reports", detail: "Verified lab report LR-102 — Serum Creatinine for Zahirul Islam", created_at: "2026-06-07T15:00:00Z", actor_name: "Aminul Islam" },
  { id: "al-005", actor_id: "u-008", action: "DEACTIVATE_USER", entity: "profiles", detail: "Deactivated user Rezaul Karim (u-010)", created_at: "2026-06-06T10:00:00Z", actor_name: "Preetham VPD" },
  { id: "al-006", actor_id: "u-004", action: "CREATE_DEPARTMENT", entity: "departments", detail: "Created department: Dermatology", created_at: "2026-06-05T11:00:00Z", actor_name: "Sakib Al Hasan" },
  { id: "al-007", actor_id: "u-008", action: "UPDATE_SETTINGS", entity: "hospital_settings", detail: "Updated hospital phone number", created_at: "2026-06-04T09:00:00Z", actor_name: "Preetham VPD" },
  { id: "al-008", actor_id: "u-003", action: "START_TELECONSULT", entity: "telemedicine_sessions", detail: "Started teleconsult TS-104 with Shahana Parvin", created_at: "2026-06-09T14:00:00Z", actor_name: "Dr. Rashida Begum" },
];

export const mockAnalytics = {
  totalAppointments: 1247,
  totalRevenue: 8450000,
  totalPatients: 892,
  totalDoctors: 24,
  appointmentsByDept: [
    { department: "General Medicine", count: 340 },
    { department: "Cardiology", count: 215 },
    { department: "Orthopedics", count: 180 },
    { department: "Pediatrics", count: 165 },
    { department: "Neurology", count: 142 },
    { department: "Gynecology / Obstetrics", count: 120 },
    { department: "Emergency / Trauma", count: 85 },
  ],
  revenueByMonth: [
    { month: "Jan", amount: 620000 },
    { month: "Feb", amount: 710000 },
    { month: "Mar", amount: 680000 },
    { month: "Apr", amount: 820000 },
    { month: "May", amount: 940000 },
    { month: "Jun", amount: 1050000 },
  ],
  doctorPerformance: [
    { name: "Dr. Farid Hossain", patients: 187, rating: 4.8 },
    { name: "Dr. Rashida Begum", patients: 156, rating: 4.9 },
    { name: "Dr. Nusrat Jahan", patients: 134, rating: 4.7 },
    { name: "Dr. Shafiqul Alam", patients: 112, rating: 4.6 },
    { name: "Dr. Mahbubul Haque", patients: 98, rating: 4.8 },
  ],
};
