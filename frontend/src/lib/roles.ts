export const ROLES = {
  // ── Platform ──
  SUPER_ADMIN:       "SUPER_ADMIN",

  // ── Hospital Administration ──
  HOSPITAL_ADMIN:    "HOSPITAL_ADMIN",
  DEPARTMENT_ADMIN:  "DEPARTMENT_ADMIN",
  DOCTOR:            "DOCTOR",
  NURSE:             "NURSE",
  RECEPTIONIST:      "RECEPTIONIST",

  // ── Laboratory ──
  LAB_ADMIN:         "LAB_ADMIN",
  LAB_TECHNICIAN:    "LAB_TECHNICIAN",

  // ── Pharmacy ──
  PHARMACY_ADMIN:    "PHARMACY_ADMIN",
  PHARMACIST:        "PHARMACIST",

  // ── Insurance ──
  INSURANCE_ADMIN:   "INSURANCE_ADMIN",

  // ── Support ──
  SUPPORT_EXECUTIVE: "SUPPORT_EXECUTIVE",

  // ── Patient ──
  PATIENT:           "PATIENT",

  // ── Portal-specific (retained for existing dashboards) ──
  BILLING:           "BILLING",
  EMERGENCY:         "EMERGENCY",
  TELEMEDICINE:      "TELEMEDICINE",
} as const;

export type UserRole = keyof typeof ROLES;

/** Human-readable labels for every role */
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:       "Super Admin",
  HOSPITAL_ADMIN:    "Hospital Admin",
  DEPARTMENT_ADMIN:  "Department Admin",
  DOCTOR:            "Doctor",
  NURSE:             "Nurse",
  RECEPTIONIST:      "Receptionist",
  LAB_ADMIN:         "Lab Admin",
  LAB_TECHNICIAN:    "Lab Technician",
  PHARMACY_ADMIN:    "Pharmacy Admin",
  PHARMACIST:        "Pharmacist",
  INSURANCE_ADMIN:   "Insurance Admin",
  SUPPORT_EXECUTIVE: "Support Executive",
  PATIENT:           "Patient",
  BILLING:           "Billing",
  EMERGENCY:         "Emergency",
  TELEMEDICINE:      "Telemedicine",
};