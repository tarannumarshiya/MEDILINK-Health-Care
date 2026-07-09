export type ColumnDef = {
  name: string;
  type: string;
  nullable: boolean;
  pk?: boolean;
  fk?: string;          // "table.column"
  unique?: boolean;
  default?: string;
  note?: string;
};

export type TableDef = {
  name: string;
  label: string;
  module: string;
  color: string;        // tailwind gradient
  accentBg: string;
  accentText: string;
  description: string;
  rls: string;          // RLS policy summary
  columns: ColumnDef[];
  relations: string[];  // human-readable FK descriptions
  indexes?: string[];
};

export const schema: TableDef[] = [
  /* ──────────────────────────────────────
     1. USERS  (auth.users — Supabase managed)
  ────────────────────────────────────── */
  {
    name: "users",
    label: "Users",
    module: "Auth",
    color: "from-slate-600 to-slate-700",
    accentBg: "bg-slate-50",
    accentText: "text-slate-700",
    description: "Supabase-managed auth users. Every user in the platform — doctors, patients, admins, pharmacists — has an auth.users row created by Supabase Auth.",
    rls: "Managed by Supabase Auth. No direct RLS needed.",
    columns: [
      { name: "id",                 type: "uuid",        nullable: false, pk: true,  default: "gen_random_uuid()", note: "Supabase Auth UID" },
      { name: "email",              type: "text",        nullable: false, unique: true },
      { name: "phone",              type: "text",        nullable: true },
      { name: "encrypted_password", type: "text",        nullable: true,  note: "Managed by Supabase" },
      { name: "email_confirmed_at", type: "timestamptz", nullable: true },
      { name: "created_at",         type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at",         type: "timestamptz", nullable: false, default: "now()" },
      { name: "raw_user_meta_data", type: "jsonb",       nullable: true,  note: "Stores full_name, role on sign-up" },
    ],
    relations: ["Referenced by profiles.id (1:1)", "Referenced by audit_logs.actor_id"],
    indexes: ["PRIMARY KEY (id)", "UNIQUE (email)"],
  },

  /* ──────────────────────────────────────
     2. ROLES
  ────────────────────────────────────── */
  {
    name: "roles",
    label: "Roles",
    module: "Auth",
    color: "from-indigo-500 to-indigo-700",
    accentBg: "bg-indigo-50",
    accentText: "text-indigo-700",
    description: "Platform-level role registry. Defines all roles available in the system and their access tier. Used for RBAC enforcement in RLS policies.",
    rls: "SELECT: all authenticated users. INSERT/UPDATE/DELETE: SUPER_ADMIN only.",
    columns: [
      { name: "id",          type: "uuid",        nullable: false, pk: true, default: "gen_random_uuid()" },
      { name: "name",        type: "text",        nullable: false, unique: true, note: "SUPER_ADMIN | HOSPITAL_ADMIN | DOCTOR | PATIENT | ..." },
      { name: "label",       type: "text",        nullable: false, note: "Human-readable label e.g. 'Hospital Admin'" },
      { name: "tier",        type: "smallint",    nullable: false, note: "1=SUPER_ADMIN, 2=HOSPITAL, 3=DEPT, 4=STAFF, 5=PATIENT" },
      { name: "description", type: "text",        nullable: true },
      { name: "created_at",  type: "timestamptz", nullable: false, default: "now()" },
    ],
    relations: ["Referenced by profiles.role (FK as text enum)"],
    indexes: ["PRIMARY KEY (id)", "UNIQUE (name)"],
  },

  /* ──────────────────────────────────────
     3. HOSPITALS
  ────────────────────────────────────── */
  {
    name: "hospitals",
    label: "Hospitals",
    module: "Platform",
    color: "from-blue-500 to-blue-700",
    accentBg: "bg-blue-50",
    accentText: "text-blue-700",
    description: "Core multi-tenancy table. Every hospital, lab partner, or pharmacy network onboarded to Medilink SaaS has a row here. All other tables reference hospital_id for tenant isolation.",
    rls: "SELECT: users with hospital_id matching their profile. SUPER_ADMIN sees all. HOSPITAL_ADMIN manages their own.",
    columns: [
      { name: "id",            type: "uuid",        nullable: false, pk: true,  default: "gen_random_uuid()" },
      { name: "name",          type: "text",        nullable: false, note: "e.g. Medilink Dhaka Central" },
      { name: "slug",          type: "text",        nullable: false, unique: true, note: "URL-safe identifier" },
      { name: "type",          type: "text",        nullable: false, note: "HOSPITAL | LAB | PHARMACY | INSURANCE" },
      { name: "address",       type: "text",        nullable: true },
      { name: "city",          type: "text",        nullable: true },
      { name: "country",       type: "text",        nullable: false, default: "'BD'" },
      { name: "phone",         type: "text",        nullable: true },
      { name: "email",         type: "text",        nullable: true },
      { name: "logo_url",      type: "text",        nullable: true },
      { name: "is_active",     type: "boolean",     nullable: false, default: "true" },
      { name: "plan",          type: "text",        nullable: false, default: "'STARTER'", note: "STARTER | PRO | ENTERPRISE" },
      { name: "created_at",    type: "timestamptz", nullable: false, default: "now()" },
    ],
    relations: [
      "departments.hospital_id → hospitals.id",
      "doctors.hospital_id → hospitals.id",
      "patients.hospital_id → hospitals.id",
      "appointments.hospital_id → hospitals.id",
    ],
    indexes: ["PRIMARY KEY (id)", "UNIQUE (slug)", "INDEX (is_active)", "INDEX (type)"],
  },

  /* ──────────────────────────────────────
     4. PROFILES  (extends auth.users)
  ────────────────────────────────────── */
  {
    name: "profiles",
    label: "Profiles",
    module: "Auth",
    color: "from-violet-500 to-violet-700",
    accentBg: "bg-violet-50",
    accentText: "text-violet-700",
    description: "Extends auth.users with application-level attributes — full name, role, hospital assignment, and activation status. Created by trigger on auth.users INSERT.",
    rls: "SELECT: own row always. SUPER_ADMIN sees all. HOSPITAL_ADMIN sees profiles in their hospital.",
    columns: [
      { name: "id",          type: "uuid",        nullable: false, pk: true, fk: "auth.users.id", note: "Matches auth.users.id exactly" },
      { name: "full_name",   type: "text",        nullable: true },
      { name: "email",       type: "text",        nullable: false },
      { name: "role",        type: "text",        nullable: false, note: "Matches roles.name enum" },
      { name: "hospital_id", type: "uuid",        nullable: true,  fk: "hospitals.id", note: "null for SUPER_ADMIN" },
      { name: "is_active",   type: "boolean",     nullable: false, default: "true" },
      { name: "avatar_url",  type: "text",        nullable: true },
      { name: "phone",       type: "text",        nullable: true },
      { name: "created_at",  type: "timestamptz", nullable: false, default: "now()" },
    ],
    relations: [
      "profiles.id → auth.users.id (1:1)",
      "profiles.hospital_id → hospitals.id",
      "doctors.profile_id → profiles.id",
    ],
    indexes: ["PRIMARY KEY (id)", "INDEX (role)", "INDEX (hospital_id)", "INDEX (is_active)"],
  },

  /* ──────────────────────────────────────
     5. DEPARTMENTS
  ────────────────────────────────────── */
  {
    name: "departments",
    label: "Departments",
    module: "Hospital",
    color: "from-teal-500 to-teal-700",
    accentBg: "bg-teal-50",
    accentText: "text-teal-700",
    description: "Hospital departments scoped to a hospital. Each hospital defines its own set of active departments. Appointments and doctors are linked here.",
    rls: "SELECT: all authenticated. INSERT/UPDATE: HOSPITAL_ADMIN for their hospital_id. DELETE: SUPER_ADMIN.",
    columns: [
      { name: "id",          type: "uuid",    nullable: false, pk: true,  default: "gen_random_uuid()" },
      { name: "hospital_id", type: "uuid",    nullable: false, fk: "hospitals.id" },
      { name: "name",        type: "text",    nullable: false },
      { name: "description", type: "text",    nullable: true },
      { name: "head_doctor_id", type: "uuid", nullable: true,  fk: "doctors.id", note: "Department head" },
      { name: "is_active",   type: "boolean", nullable: false, default: "true" },
      { name: "created_at",  type: "timestamptz", nullable: false, default: "now()" },
    ],
    relations: [
      "departments.hospital_id → hospitals.id",
      "doctors.department_id → departments.id",
      "appointments.department_id → departments.id",
    ],
    indexes: ["PRIMARY KEY (id)", "INDEX (hospital_id)", "UNIQUE (hospital_id, name)"],
  },

  /* ──────────────────────────────────────
     6. DOCTORS
  ────────────────────────────────────── */
  {
    name: "doctors",
    label: "Doctors",
    module: "Hospital",
    color: "from-cyan-500 to-cyan-700",
    accentBg: "bg-cyan-50",
    accentText: "text-cyan-700",
    description: "Doctor profiles linked to their auth profile and assigned department. Stores clinical credentials, availability, and fee.",
    rls: "SELECT: all authenticated. UPDATE is_available: own row or HOSPITAL_ADMIN. SUPER_ADMIN manages all.",
    columns: [
      { name: "id",               type: "uuid",    nullable: false, pk: true,  default: "gen_random_uuid()" },
      { name: "profile_id",       type: "uuid",    nullable: false, fk: "profiles.id", unique: true },
      { name: "hospital_id",      type: "uuid",    nullable: false, fk: "hospitals.id" },
      { name: "department_id",    type: "uuid",    nullable: false, fk: "departments.id" },
      { name: "registration_no",  type: "text",    nullable: true,  unique: true, note: "Medical council registration" },
      { name: "qualification",    type: "text",    nullable: true,  note: "e.g. MBBS, MD Cardiology" },
      { name: "specialisation",   type: "text",    nullable: true },
      { name: "experience_years", type: "smallint",nullable: false, default: "0" },
      { name: "consultation_fee", type: "numeric", nullable: false, default: "0" },
      { name: "is_available",     type: "boolean", nullable: false, default: "true" },
      { name: "bio",              type: "text",    nullable: true },
      { name: "created_at",       type: "timestamptz", nullable: false, default: "now()" },
    ],
    relations: [
      "doctors.profile_id → profiles.id (1:1)",
      "doctors.hospital_id → hospitals.id",
      "doctors.department_id → departments.id",
      "appointments.doctor_id → doctors.id",
      "prescriptions.doctor_id → doctors.id",
      "lab_tests.doctor_id → doctors.id",
    ],
    indexes: ["PRIMARY KEY (id)", "UNIQUE (profile_id)", "UNIQUE (registration_no)", "INDEX (hospital_id)", "INDEX (department_id)"],
  },

  /* ──────────────────────────────────────
     7. PATIENTS
  ────────────────────────────────────── */
  {
    name: "patients",
    label: "Patients",
    module: "Patient",
    color: "from-emerald-500 to-emerald-700",
    accentBg: "bg-emerald-50",
    accentText: "text-emerald-700",
    description: "Patient master record. May be linked to an auth profile (registered users) or exist as an anonymous walk-in record. Supports multi-hospital visibility.",
    rls: "SELECT: own row (profile_id = auth.uid()). HOSPITAL_ADMIN sees patients in their hospital. DOCTOR sees patients with appointments in their dept.",
    columns: [
      { name: "id",                      type: "uuid",    nullable: false, pk: true,  default: "gen_random_uuid()" },
      { name: "profile_id",              type: "uuid",    nullable: true,  fk: "profiles.id", note: "null for walk-in / anonymous booking" },
      { name: "hospital_id",             type: "uuid",    nullable: true,  fk: "hospitals.id" },
      { name: "patient_code",            type: "text",    nullable: false, unique: true, note: "PAT-YYYY-NNNNNN" },
      { name: "full_name",               type: "text",    nullable: false },
      { name: "age",                     type: "smallint",nullable: true },
      { name: "gender",                  type: "text",    nullable: true,  note: "MALE | FEMALE | OTHER" },
      { name: "phone",                   type: "text",    nullable: false },
      { name: "email",                   type: "text",    nullable: true },
      { name: "address",                 type: "text",    nullable: true },
      { name: "blood_group",             type: "text",    nullable: true,  note: "A+ | B- | O+ ..." },
      { name: "emergency_contact",       type: "text",    nullable: true },
      { name: "insurance_provider",      type: "text",    nullable: true },
      { name: "insurance_policy_number", type: "text",    nullable: true },
      { name: "medical_history",         type: "text",    nullable: true },
      { name: "created_at",              type: "timestamptz", nullable: false, default: "now()" },
    ],
    relations: [
      "patients.profile_id → profiles.id (optional, 1:1)",
      "patients.hospital_id → hospitals.id",
      "appointments.patient_id → patients.id",
      "medical_records.patient_id → patients.id",
      "prescriptions.patient_id → patients.id (via appointment)",
    ],
    indexes: ["PRIMARY KEY (id)", "UNIQUE (patient_code)", "INDEX (profile_id)", "INDEX (phone)", "INDEX (hospital_id)"],
  },

  /* ──────────────────────────────────────
     8. APPOINTMENTS
  ────────────────────────────────────── */
  {
    name: "appointments",
    label: "Appointments",
    module: "Scheduling",
    color: "from-amber-500 to-amber-700",
    accentBg: "bg-amber-50",
    accentText: "text-amber-700",
    description: "Core scheduling table. Tracks the complete lifecycle of every appointment from PENDING through to COMPLETED. Status drives the entire patient journey.",
    rls: "SELECT: patients see own, doctors see dept appointments, HOSPITAL_ADMIN sees all in hospital. INSERT: public (no login) or PATIENT.",
    columns: [
      { name: "id",               type: "uuid",    nullable: false, pk: true,  default: "gen_random_uuid()" },
      { name: "hospital_id",      type: "uuid",    nullable: true,  fk: "hospitals.id" },
      { name: "appointment_code", type: "text",    nullable: false, unique: true, note: "APT-YYYY-NNNNNN" },
      { name: "patient_id",       type: "uuid",    nullable: true,  fk: "patients.id" },
      { name: "patient_name",     type: "text",    nullable: false, note: "Denormalised for quick display" },
      { name: "patient_phone",    type: "text",    nullable: false },
      { name: "patient_email",    type: "text",    nullable: true },
      { name: "doctor_id",        type: "uuid",    nullable: true,  fk: "doctors.id" },
      { name: "department_id",    type: "uuid",    nullable: true,  fk: "departments.id" },
      { name: "department",       type: "text",    nullable: false, note: "Denormalised dept name" },
      { name: "preferred_date",   type: "date",    nullable: false },
      { name: "preferred_time",   type: "time",    nullable: true },
      { name: "symptoms",         type: "text",    nullable: true },
      { name: "status",           type: "text",    nullable: false, default: "'PENDING'",
        note: "PENDING→APPROVED→IN_PROGRESS→PRESCRIPTION_READY→LAB_REQUESTED→LAB_PROCESSING→LAB_COMPLETED→PHARMACY_PENDING→PHARMACY_FULFILLED→INVOICE_GENERATED→COMPLETED | REJECTED | cancelled" },
      { name: "lab_required",     type: "boolean", nullable: true,  default: "false" },
      { name: "prescription_text",type: "text",    nullable: true },
      { name: "lab_report_url",   type: "text",    nullable: true },
      { name: "created_at",       type: "timestamptz", nullable: false, default: "now()" },
      { name: "updated_at",       type: "timestamptz", nullable: false, default: "now()" },
    ],
    relations: [
      "appointments.hospital_id → hospitals.id",
      "appointments.patient_id → patients.id",
      "appointments.doctor_id → doctors.id",
      "appointments.department_id → departments.id",
      "prescriptions.appointment_id → appointments.id",
      "lab_tests.appointment_id → appointments.id",
      "invoices.appointment_id → appointments.id",
    ],
    indexes: ["PRIMARY KEY (id)", "UNIQUE (appointment_code)", "INDEX (patient_id)", "INDEX (doctor_id)", "INDEX (status)", "INDEX (preferred_date)", "INDEX (hospital_id)"],
  },

  /* ──────────────────────────────────────
     9. MEDICAL RECORDS
  ────────────────────────────────────── */
  {
    name: "medical_records",
    label: "Medical Records",
    module: "Clinical",
    color: "from-pink-500 to-pink-700",
    accentBg: "bg-pink-50",
    accentText: "text-pink-700",
    description: "Longitudinal patient health records — diagnoses, uploaded reports, vaccination records, and clinical documents. Attached to a patient and optionally to an appointment.",
    rls: "SELECT: patient sees own. DOCTOR sees records of patients under their care. HOSPITAL_ADMIN sees all in hospital.",
    columns: [
      { name: "id",             type: "uuid",    nullable: false, pk: true, default: "gen_random_uuid()" },
      { name: "hospital_id",    type: "uuid",    nullable: true,  fk: "hospitals.id" },
      { name: "patient_id",     type: "uuid",    nullable: false, fk: "patients.id" },
      { name: "appointment_id", type: "uuid",    nullable: true,  fk: "appointments.id" },
      { name: "doctor_id",      type: "uuid",    nullable: true,  fk: "doctors.id" },
      { name: "type",           type: "text",    nullable: false, note: "diagnosis | report | vaccination | document | imaging" },
      { name: "title",          type: "text",    nullable: false },
      { name: "notes",          type: "text",    nullable: true },
      { name: "file_url",       type: "text",    nullable: true,  note: "Supabase Storage URL" },
      { name: "is_confidential",type: "boolean", nullable: false, default: "false" },
      { name: "created_at",     type: "timestamptz", nullable: false, default: "now()" },
    ],
    relations: [
      "medical_records.patient_id → patients.id",
      "medical_records.appointment_id → appointments.id",
      "medical_records.doctor_id → doctors.id",
    ],
    indexes: ["PRIMARY KEY (id)", "INDEX (patient_id)", "INDEX (appointment_id)", "INDEX (type)"],
  },

  /* ──────────────────────────────────────
     10. PRESCRIPTIONS
  ────────────────────────────────────── */
  {
    name: "prescriptions",
    label: "Prescriptions",
    module: "Clinical",
    color: "from-green-500 to-green-700",
    accentBg: "bg-green-50",
    accentText: "text-green-700",
    description: "Digital prescriptions created by doctors after consultation. Each prescription has multiple medicine items in prescription_items. Status drives the pharmacy workflow.",
    rls: "SELECT: patient sees own prescriptions. DOCTOR sees prescriptions they created. PHARMACIST sees ACTIVE prescriptions.",
    columns: [
      { name: "id",                  type: "uuid",    nullable: false, pk: true, default: "gen_random_uuid()" },
      { name: "hospital_id",         type: "uuid",    nullable: true,  fk: "hospitals.id" },
      { name: "appointment_id",      type: "uuid",    nullable: false, fk: "appointments.id" },
      { name: "doctor_id",           type: "uuid",    nullable: false, fk: "doctors.id" },
      { name: "patient_id",          type: "uuid",    nullable: true,  fk: "patients.id" },
      { name: "prescription_notes",  type: "text",    nullable: true,  note: "Diagnosis notes, clinical advice" },
      { name: "status",              type: "text",    nullable: false, default: "'ACTIVE'", note: "ACTIVE | DISPENSED | EXPIRED" },
      { name: "lab_required",        type: "boolean", nullable: false, default: "false" },
      { name: "created_at",          type: "timestamptz", nullable: false, default: "now()" },
    ],
    relations: [
      "prescriptions.appointment_id → appointments.id",
      "prescriptions.doctor_id → doctors.id",
      "prescriptions.patient_id → patients.id",
      "prescription_items.prescription_id → prescriptions.id",
      "pharmacy_orders.prescription_id → prescriptions.id",
    ],
    indexes: ["PRIMARY KEY (id)", "INDEX (appointment_id)", "INDEX (doctor_id)", "INDEX (status)"],
  },

  /* ──────────────────────────────────────
     11. LAB TESTS
  ────────────────────────────────────── */
  {
    name: "lab_tests",
    label: "Lab Tests",
    module: "Laboratory",
    color: "from-indigo-500 to-indigo-700",
    accentBg: "bg-indigo-50",
    accentText: "text-indigo-700",
    description: "Lab test orders created by doctors. Each row tracks the lifecycle of a single test from order through collection, processing, and verification.",
    rls: "SELECT: patient sees own tests. LAB_TECHNICIAN and LAB_ADMIN see all in their hospital. DOCTOR sees tests they ordered.",
    columns: [
      { name: "id",                   type: "uuid",    nullable: false, pk: true, default: "gen_random_uuid()" },
      { name: "hospital_id",          type: "uuid",    nullable: true,  fk: "hospitals.id" },
      { name: "appointment_id",       type: "uuid",    nullable: false, fk: "appointments.id" },
      { name: "patient_id",           type: "uuid",    nullable: false, fk: "patients.id" },
      { name: "doctor_id",            type: "uuid",    nullable: false, fk: "doctors.id" },
      { name: "technician_id",        type: "uuid",    nullable: true,  fk: "profiles.id", note: "Assigned lab technician" },
      { name: "test_type",            type: "text",    nullable: false, note: "CBC | LFT | RFT | ECG | MRI | Culture ..." },
      { name: "status",               type: "text",    nullable: false, default: "'PENDING'",
        note: "PENDING | COLLECTED | PROCESSING | COMPLETED | VERIFIED" },
      { name: "priority",             type: "text",    nullable: false, default: "'ROUTINE'", note: "ROUTINE | URGENT | STAT" },
      { name: "sample_collected_at",  type: "timestamptz", nullable: true },
      { name: "created_at",           type: "timestamptz", nullable: false, default: "now()" },
    ],
    relations: [
      "lab_tests.appointment_id → appointments.id",
      "lab_tests.patient_id → patients.id",
      "lab_tests.doctor_id → doctors.id",
      "lab_reports.lab_test_id → lab_tests.id",
    ],
    indexes: ["PRIMARY KEY (id)", "INDEX (appointment_id)", "INDEX (patient_id)", "INDEX (status)", "INDEX (priority)"],
  },

  /* ──────────────────────────────────────
     12. LAB REPORTS
  ────────────────────────────────────── */
  {
    name: "lab_reports",
    label: "Lab Reports",
    module: "Laboratory",
    color: "from-blue-500 to-blue-700",
    accentBg: "bg-blue-50",
    accentText: "text-blue-700",
    description: "Completed lab reports uploaded by technicians and verified by pathologists. Linked to both the lab test order and directly to the patient for portal access.",
    rls: "SELECT: patient sees own. DOCTOR sees reports for their patients. LAB staff sees all in hospital.",
    columns: [
      { name: "id",              type: "uuid",    nullable: false, pk: true, default: "gen_random_uuid()" },
      { name: "hospital_id",     type: "uuid",    nullable: true,  fk: "hospitals.id" },
      { name: "lab_test_id",     type: "uuid",    nullable: true,  fk: "lab_tests.id" },
      { name: "patient_id",      type: "uuid",    nullable: true,  fk: "patients.id" },
      { name: "result_summary",  type: "text",    nullable: true },
      { name: "file_url",        type: "text",    nullable: true,  note: "Supabase Storage — PDF/image" },
      { name: "test_type",       type: "text",    nullable: true,  note: "Denormalised from lab_tests.test_type" },
      { name: "reference_range", type: "text",    nullable: true },
      { name: "is_abnormal",     type: "boolean", nullable: false, default: "false" },
      { name: "verified_by",     type: "text",    nullable: true,  note: "Pathologist name string" },
      { name: "verified_at",     type: "timestamptz", nullable: true },
      { name: "created_at",      type: "timestamptz", nullable: false, default: "now()" },
    ],
    relations: [
      "lab_reports.lab_test_id → lab_tests.id",
      "lab_reports.patient_id → patients.id",
    ],
    indexes: ["PRIMARY KEY (id)", "INDEX (lab_test_id)", "INDEX (patient_id)", "INDEX (verified_at)"],
  },

  /* ──────────────────────────────────────
     13. PHARMACY ORDERS
  ────────────────────────────────────── */
  {
    name: "pharmacy_orders",
    label: "Pharmacy Orders",
    module: "Pharmacy",
    color: "from-emerald-500 to-green-700",
    accentBg: "bg-emerald-50",
    accentText: "text-emerald-700",
    description: "Tracks medicine dispensing orders linked to prescriptions. Supports both in-hospital pickup and home delivery. Status drives the pharmacy workflow queue.",
    rls: "SELECT: patient sees own orders. PHARMACIST and PHARMACY_ADMIN see all in hospital.",
    columns: [
      { name: "id",              type: "uuid",    nullable: false, pk: true, default: "gen_random_uuid()" },
      { name: "hospital_id",     type: "uuid",    nullable: true,  fk: "hospitals.id" },
      { name: "prescription_id", type: "uuid",    nullable: true,  fk: "prescriptions.id" },
      { name: "patient_id",      type: "uuid",    nullable: true,  fk: "patients.id" },
      { name: "pharmacist_id",   type: "uuid",    nullable: true,  fk: "profiles.id" },
      { name: "status",          type: "text",    nullable: false, default: "'PENDING'",
        note: "PENDING | VERIFIED | DISPENSING | DELIVERED | CANCELLED" },
      { name: "delivery_type",   type: "text",    nullable: true,  note: "PICKUP | HOME_DELIVERY" },
      { name: "delivery_address",type: "text",    nullable: true },
      { name: "total",           type: "numeric", nullable: true },
      { name: "notes",           type: "text",    nullable: true },
      { name: "created_at",      type: "timestamptz", nullable: false, default: "now()" },
    ],
    relations: [
      "pharmacy_orders.prescription_id → prescriptions.id",
      "pharmacy_orders.patient_id → patients.id",
    ],
    indexes: ["PRIMARY KEY (id)", "INDEX (prescription_id)", "INDEX (patient_id)", "INDEX (status)"],
  },

  /* ──────────────────────────────────────
     14. INSURANCE CLAIMS
  ────────────────────────────────────── */
  {
    name: "insurance_claims",
    label: "Insurance Claims",
    module: "Insurance",
    color: "from-sky-500 to-sky-700",
    accentBg: "bg-sky-50",
    accentText: "text-sky-700",
    description: "Insurance claim submissions and processing records. Linked to patient, appointment, and invoice. Tracks the full claim lifecycle from submission to settlement.",
    rls: "SELECT: patient sees own claims. INSURANCE_ADMIN sees all. HOSPITAL_ADMIN sees claims for their hospital.",
    columns: [
      { name: "id",               type: "uuid",    nullable: false, pk: true, default: "gen_random_uuid()" },
      { name: "hospital_id",      type: "uuid",    nullable: true,  fk: "hospitals.id" },
      { name: "patient_id",       type: "uuid",    nullable: false, fk: "patients.id" },
      { name: "appointment_id",   type: "uuid",    nullable: true,  fk: "appointments.id" },
      { name: "invoice_id",       type: "uuid",    nullable: true,  fk: "invoices.id" },
      { name: "policy_id",        type: "uuid",    nullable: true,  fk: "insurance_policies.id" },
      { name: "provider_name",    type: "text",    nullable: true,  note: "e.g. Star Health, BRAC Insurance" },
      { name: "policy_number",    type: "text",    nullable: true },
      { name: "amount",           type: "numeric", nullable: false },
      { name: "status",           type: "text",    nullable: false, default: "'PENDING'",
        note: "PENDING | UNDER_REVIEW | APPROVED | REJECTED | SETTLED" },
      { name: "description",      type: "text",    nullable: true },
      { name: "decision_reason",  type: "text",    nullable: true },
      { name: "settled_amount",   type: "numeric", nullable: true },
      { name: "processed_by",     type: "uuid",    nullable: true,  fk: "profiles.id" },
      { name: "created_at",       type: "timestamptz", nullable: false, default: "now()" },
    ],
    relations: [
      "insurance_claims.patient_id → patients.id",
      "insurance_claims.appointment_id → appointments.id",
      "insurance_claims.invoice_id → invoices.id",
    ],
    indexes: ["PRIMARY KEY (id)", "INDEX (patient_id)", "INDEX (status)", "INDEX (hospital_id)"],
  },

  /* ──────────────────────────────────────
     15. BEDS
  ────────────────────────────────────── */
  {
    name: "beds",
    label: "Beds",
    module: "Emergency",
    color: "from-red-500 to-red-700",
    accentBg: "bg-red-50",
    accentText: "text-red-700",
    description: "Hospital bed inventory per ward. Tracks real-time occupancy. Used by emergency, reception, and admission modules to manage bed allocation.",
    rls: "SELECT: HOSPITAL_ADMIN, DOCTOR, RECEPTIONIST, EMERGENCY staff for their hospital. PATIENT: read-only own admission.",
    columns: [
      { name: "id",              type: "uuid",    nullable: false, pk: true, default: "gen_random_uuid()" },
      { name: "hospital_id",     type: "uuid",    nullable: false, fk: "hospitals.id" },
      { name: "ward",            type: "text",    nullable: false, note: "GENERAL | ICU | HDU | MATERNITY | PAEDIATRIC | EMERGENCY" },
      { name: "bed_no",          type: "text",    nullable: false },
      { name: "floor",           type: "text",    nullable: true },
      { name: "bed_type",        type: "text",    nullable: false, default: "'STANDARD'", note: "STANDARD | ELECTRIC | ICU_EQUIPPED" },
      { name: "is_occupied",     type: "boolean", nullable: false, default: "false" },
      { name: "patient_id",      type: "uuid",    nullable: true,  fk: "patients.id" },
      { name: "admission_date",  type: "date",    nullable: true },
      { name: "expected_discharge", type: "date", nullable: true },
      { name: "notes",           type: "text",    nullable: true },
      { name: "created_at",      type: "timestamptz", nullable: false, default: "now()" },
    ],
    relations: [
      "beds.hospital_id → hospitals.id",
      "beds.patient_id → patients.id (when occupied)",
    ],
    indexes: ["PRIMARY KEY (id)", "UNIQUE (hospital_id, bed_no)", "INDEX (is_occupied)", "INDEX (ward)"],
  },

  /* ──────────────────────────────────────
     16. BILLING  (invoices table)
  ────────────────────────────────────── */
  {
    name: "invoices",
    label: "Billing / Invoices",
    module: "Billing",
    color: "from-rose-500 to-rose-700",
    accentBg: "bg-rose-50",
    accentText: "text-rose-700",
    description: "Financial invoices for each patient encounter. Breaks down charges by category. Linked to payments and insurance claims. Drives the billing workflow.",
    rls: "SELECT: patient sees own invoices. BILLING and HOSPITAL_ADMIN see all. SUPER_ADMIN sees all.",
    columns: [
      { name: "id",                   type: "uuid",    nullable: false, pk: true, default: "gen_random_uuid()" },
      { name: "hospital_id",          type: "uuid",    nullable: true,  fk: "hospitals.id" },
      { name: "invoice_code",         type: "text",    nullable: false, unique: true, note: "INV-YYYY-NNNNNN" },
      { name: "patient_id",           type: "uuid",    nullable: true,  fk: "patients.id" },
      { name: "appointment_id",       type: "uuid",    nullable: true,  fk: "appointments.id" },
      { name: "patient_name",         type: "text",    nullable: true,  note: "Denormalised" },
      { name: "consultation_charge",  type: "numeric", nullable: false, default: "0" },
      { name: "lab_charge",           type: "numeric", nullable: false, default: "0" },
      { name: "medicine_charge",      type: "numeric", nullable: false, default: "0" },
      { name: "bed_charge",           type: "numeric", nullable: false, default: "0" },
      { name: "procedure_charge",     type: "numeric", nullable: false, default: "0" },
      { name: "insurance_deduction",  type: "numeric", nullable: false, default: "0" },
      { name: "discount",             type: "numeric", nullable: false, default: "0" },
      { name: "total",                type: "numeric", nullable: false, default: "0" },
      { name: "status",               type: "text",    nullable: false, default: "'UNPAID'",
        note: "UNPAID | PARTIAL | PAID | REFUNDED | CANCELLED" },
      { name: "due_date",             type: "date",    nullable: true },
      { name: "created_at",           type: "timestamptz", nullable: false, default: "now()" },
    ],
    relations: [
      "invoices.patient_id → patients.id",
      "invoices.appointment_id → appointments.id",
      "payments.invoice_id → invoices.id",
      "refunds.invoice_id → invoices.id",
      "insurance_claims.invoice_id → invoices.id",
    ],
    indexes: ["PRIMARY KEY (id)", "UNIQUE (invoice_code)", "INDEX (patient_id)", "INDEX (status)", "INDEX (hospital_id)"],
  },

  /* ──────────────────────────────────────
     17. NOTIFICATIONS
  ────────────────────────────────────── */
  {
    name: "notifications",
    label: "Notifications",
    module: "System",
    color: "from-orange-500 to-orange-700",
    accentBg: "bg-orange-50",
    accentText: "text-orange-700",
    description: "In-app notification delivery to any user. Triggered by system events — appointment approved, prescription ready, lab report uploaded, invoice generated. Supports priority levels.",
    rls: "SELECT: user sees only their own (user_id = auth.uid()). INSERT: system/server-side only. UPDATE is_read: own rows only.",
    columns: [
      { name: "id",           type: "uuid",    nullable: false, pk: true, default: "gen_random_uuid()" },
      { name: "hospital_id",  type: "uuid",    nullable: true,  fk: "hospitals.id" },
      { name: "user_id",      type: "uuid",    nullable: false, fk: "auth.users.id" },
      { name: "type",         type: "text",    nullable: false, note: "APPOINTMENT | LAB | PRESCRIPTION | BILLING | EMERGENCY | GENERAL" },
      { name: "title",        type: "text",    nullable: false },
      { name: "body",         type: "text",    nullable: false },
      { name: "entity_id",    type: "uuid",    nullable: true,  note: "Related record id (appointment, invoice etc.)" },
      { name: "entity_table", type: "text",    nullable: true,  note: "e.g. appointments, invoices" },
      { name: "priority",     type: "text",    nullable: false, default: "'NORMAL'", note: "LOW | NORMAL | HIGH | CRITICAL" },
      { name: "is_read",      type: "boolean", nullable: false, default: "false" },
      { name: "read_at",      type: "timestamptz", nullable: true },
      { name: "created_at",   type: "timestamptz", nullable: false, default: "now()" },
    ],
    relations: [
      "notifications.user_id → auth.users.id",
      "notifications.hospital_id → hospitals.id",
    ],
    indexes: ["PRIMARY KEY (id)", "INDEX (user_id)", "INDEX (is_read)", "INDEX (created_at DESC)"],
  },

  /* ──────────────────────────────────────
     18. AUDIT LOGS
  ────────────────────────────────────── */
  {
    name: "audit_logs",
    label: "Audit Logs",
    module: "System",
    color: "from-slate-500 to-slate-700",
    accentBg: "bg-slate-50",
    accentText: "text-slate-700",
    description: "Immutable audit trail for all critical actions across the platform. Inserted via DB triggers or server-side functions. Never updated or deleted. GDPR compliance.",
    rls: "SELECT: SUPER_ADMIN and HOSPITAL_ADMIN (own hospital). INSERT: service_role / triggers only. No UPDATE or DELETE allowed.",
    columns: [
      { name: "id",           type: "uuid",    nullable: false, pk: true, default: "gen_random_uuid()" },
      { name: "hospital_id",  type: "uuid",    nullable: true,  fk: "hospitals.id" },
      { name: "actor_id",     type: "uuid",    nullable: true,  fk: "auth.users.id", note: "null for system-triggered events" },
      { name: "actor_name",   type: "text",    nullable: true,  note: "Denormalised at insert time" },
      { name: "actor_role",   type: "text",    nullable: true,  note: "Role at time of action" },
      { name: "action",       type: "text",    nullable: false, note: "CREATED | UPDATED | DELETED | APPROVED | REJECTED | LOGIN | LOGOUT ..." },
      { name: "entity",       type: "text",    nullable: false, note: "Table name e.g. appointments, patients" },
      { name: "entity_id",    type: "uuid",    nullable: true },
      { name: "detail",       type: "text",    nullable: true,  note: "Human-readable description" },
      { name: "old_value",    type: "jsonb",   nullable: true,  note: "Previous state (for UPDATE)" },
      { name: "new_value",    type: "jsonb",   nullable: true,  note: "New state (for UPDATE/INSERT)" },
      { name: "ip_address",   type: "inet",    nullable: true },
      { name: "user_agent",   type: "text",    nullable: true },
      { name: "created_at",   type: "timestamptz", nullable: false, default: "now()" },
    ],
    relations: [
      "audit_logs.actor_id → auth.users.id",
      "audit_logs.hospital_id → hospitals.id",
    ],
    indexes: ["PRIMARY KEY (id)", "INDEX (actor_id)", "INDEX (entity)", "INDEX (entity_id)", "INDEX (created_at DESC)", "INDEX (hospital_id)"],
  },
];

/* ── Module groupings for sidebar navigation ── */
export const MODULE_GROUPS: Record<string, string[]> = {
  Auth:       ["users", "roles", "profiles"],
  Platform:   ["hospitals"],
  Hospital:   ["departments", "doctors"],
  Patient:    ["patients"],
  Scheduling: ["appointments"],
  Clinical:   ["medical_records", "prescriptions"],
  Laboratory: ["lab_tests", "lab_reports"],
  Pharmacy:   ["pharmacy_orders"],
  Insurance:  ["insurance_claims"],
  Emergency:  ["beds"],
  Billing:    ["invoices"],
  System:     ["notifications", "audit_logs"],
};

export const MODULE_COLORS: Record<string, string> = {
  Auth:       "bg-slate-100 text-slate-700",
  Platform:   "bg-blue-100 text-blue-700",
  Hospital:   "bg-teal-100 text-teal-700",
  Patient:    "bg-emerald-100 text-emerald-700",
  Scheduling: "bg-amber-100 text-amber-700",
  Clinical:   "bg-pink-100 text-pink-700",
  Laboratory: "bg-indigo-100 text-indigo-700",
  Pharmacy:   "bg-green-100 text-green-700",
  Insurance:  "bg-sky-100 text-sky-700",
  Emergency:  "bg-red-100 text-red-700",
  Billing:    "bg-rose-100 text-rose-700",
  System:     "bg-orange-100 text-orange-700",
};
