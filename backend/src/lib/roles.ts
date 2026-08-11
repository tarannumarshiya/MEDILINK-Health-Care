// Centralized role constants for MEDILINK Healthcare
// This file is the single source of truth for all role definitions

export const ROLES = {
  // Patient roles
  PATIENT: 'PATIENT',
  
  // Admin roles
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
  DEPARTMENT_ADMIN: 'DEPARTMENT_ADMIN',
  
  // Medical staff roles
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  RECEPTIONIST: 'RECEPTIONIST',
  RECEPTION_ADMIN: 'RECEPTION_ADMIN',
  
  // Lab roles
  LAB_TECHNICIAN: 'LAB_TECHNICIAN',
  LAB_ADMIN: 'LAB_ADMIN',
  TESTER: 'TESTER',
  
  // Pharmacy roles
  PHARMACIST: 'PHARMACIST',
  PHARMACY_ADMIN: 'PHARMACY_ADMIN',
  
  // Billing roles
  BILLING: 'BILLING',
  BILLING_STAFF: 'BILLING_STAFF',
  BILLING_ADMIN: 'BILLING_ADMIN',
  
  // Insurance roles
  INSURANCE: 'INSURANCE',
  INSURANCE_STAFF: 'INSURANCE_STAFF',
  INSURANCE_ADMIN: 'INSURANCE_ADMIN',
  
  // Emergency roles
  EMERGENCY: 'EMERGENCY',
  EMERGENCY_STAFF: 'EMERGENCY_STAFF',
  EMERGENCY_ADMIN: 'EMERGENCY_ADMIN',
  
  // Telemedicine roles
  TELEMEDICINE: 'TELEMEDICINE',
  TELEMEDICINE_ADMIN: 'TELEMEDICINE_ADMIN',
} as const;

// Role groups for common permission checks
export const ADMIN_ROLES = [
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
  ROLES.HOSPITAL_ADMIN,
  ROLES.DEPARTMENT_ADMIN,
];

export const STAFF_ROLES = [
  ...ADMIN_ROLES,
  ROLES.DOCTOR,
  ROLES.NURSE,
  ROLES.RECEPTIONIST,
  ROLES.RECEPTION_ADMIN,
  ROLES.LAB_TECHNICIAN,
  ROLES.LAB_ADMIN,
  ROLES.TESTER,
  ROLES.PHARMACIST,
  ROLES.PHARMACY_ADMIN,
  ROLES.BILLING,
  ROLES.BILLING_STAFF,
  ROLES.BILLING_ADMIN,
  ROLES.INSURANCE,
  ROLES.INSURANCE_STAFF,
  ROLES.INSURANCE_ADMIN,
  ROLES.EMERGENCY,
  ROLES.EMERGENCY_STAFF,
  ROLES.EMERGENCY_ADMIN,
  ROLES.TELEMEDICINE,
  ROLES.TELEMEDICINE_ADMIN,
];

export const DOCTOR_ROLES = [ROLES.DOCTOR];

export const LAB_ROLES = [
  ROLES.LAB_TECHNICIAN,
  ROLES.LAB_ADMIN,
  ROLES.TESTER,
  ...ADMIN_ROLES,
];

export const PHARMACY_ROLES = [
  ROLES.PHARMACIST,
  ROLES.PHARMACY_ADMIN,
  ...ADMIN_ROLES,
];

export const BILLING_ROLES = [
  ROLES.BILLING,
  ROLES.BILLING_STAFF,
  ROLES.BILLING_ADMIN,
  ...ADMIN_ROLES,
];

export const INSURANCE_ROLES = [
  ROLES.INSURANCE,
  ROLES.INSURANCE_STAFF,
  ROLES.INSURANCE_ADMIN,
  ...ADMIN_ROLES,
];

export const EMERGENCY_ROLES = [
  ROLES.EMERGENCY,
  ROLES.EMERGENCY_STAFF,
  ROLES.EMERGENCY_ADMIN,
  ROLES.DOCTOR,
  ...ADMIN_ROLES,
];

export const TELEMEDICINE_ADMIN_ROLES = [
  ROLES.TELEMEDICINE,
  ROLES.TELEMEDICINE_ADMIN,
  ROLES.DOCTOR,
  ...ADMIN_ROLES,
];

export const NOTIFICATION_ADMIN_ROLES = [
  ...STAFF_ROLES,
];

// Canonicalise a role value from any source (DB profile, JWT metadata, body)
// before comparing it against the constants above. Guards against case and
// whitespace drift between profile values and the canonical role registry.
export function normalizeRole(role?: string | null): string {
  if (typeof role !== "string") return "";
  return role.trim().toUpperCase();
}

// Helper function to check if a user role is in a allowed list
export function hasRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(normalizeRole(userRole));
}

// Helper function to check if user is any type of admin
export function isAdmin(userRole: string): boolean {
  return hasRole(userRole, ADMIN_ROLES);
}

// Helper function to check if user is staff (non-patient)
export function isStaff(userRole: string): boolean {
  return hasRole(userRole, STAFF_ROLES);
}
