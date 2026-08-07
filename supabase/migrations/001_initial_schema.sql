-- MEDILINK Healthcare Database Migration
-- Version: 001_initial_schema
-- Date: 2026-08-06
-- Description: Initial database schema with all required tables, constraints, indexes, and RLS policies

-- ============================================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'PATIENT',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'PATIENT', 'ADMIN', 'SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DEPARTMENT_ADMIN',
    'DOCTOR', 'RECEPTIONIST', 'RECEPTION_ADMIN', 'NURSE',
    'LAB_TECHNICIAN', 'LAB_ADMIN', 'TESTER',
    'PHARMACIST', 'PHARMACY_ADMIN',
    'BILLING', 'BILLING_STAFF', 'BILLING_ADMIN',
    'INSURANCE', 'INSURANCE_STAFF', 'INSURANCE_ADMIN',
    'EMERGENCY', 'EMERGENCY_STAFF', 'EMERGENCY_ADMIN',
    'TELEMEDICINE', 'TELEMEDICINE_ADMIN'
  ));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================================================
-- 2. DEPARTMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. DOCTORS
-- ============================================================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  qualification TEXT,
  experience_years INTEGER DEFAULT 0,
  consultation_fee NUMERIC(10,2) DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_doctors_profile ON doctors(profile_id);

-- ============================================================================
-- 4. PATIENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  patient_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  age INTEGER,
  phone TEXT,
  email TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patients_profile ON patients(profile_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(patient_code);

-- ============================================================================
-- 5. APPOINTMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_code TEXT NOT NULL UNIQUE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  patient_name TEXT,
  patient_phone TEXT,
  patient_email TEXT,
  department TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  preferred_date DATE,
  preferred_time TIME,
  symptoms TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  prescription_text TEXT,
  lab_report_url TEXT,
  lab_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN (
    'PENDING', 'APPROVED', 'REJECTED', 'PENDING_PATIENT_APPROVAL',
    'LAB_REQUESTED', 'PRESCRIPTION_READY', 'INVOICE_GENERATED',
    'PAID', 'COMPLETED', 'CANCELLED', 'NO_SHOW',
    'PHARMACY_FULFILLED', 'IN_PROGRESS'
  ));

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_code ON appointments(appointment_code);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(preferred_date);

-- ============================================================================
-- 6. PRESCRIPTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  prescription_notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  quantity INTEGER DEFAULT 1,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_appointment ON prescriptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_prescription ON prescription_items(prescription_id);

-- ============================================================================
-- 7. MEDICINES
-- ============================================================================
CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  requires_prescription BOOLEAN DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  reorder_level INTEGER DEFAULT 10,
  batch_no TEXT,
  expiry_date DATE,
  supplier_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE medicines ADD CONSTRAINT medicines_price_check CHECK (price >= 0);
ALTER TABLE medicines ADD CONSTRAINT medicines_quantity_check CHECK (quantity >= 0);

CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);

-- ============================================================================
-- 8. MEDICINE REMINDERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS medicine_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_phone TEXT NOT NULL,
  medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL,
  medicine_name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'every_15_days', 'monthly')),
  start_date DATE,
  next_reminder_date DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medicine_reminders_phone ON medicine_reminders(patient_phone);
CREATE INDEX IF NOT EXISTS idx_medicine_reminders_next_date ON medicine_reminders(next_reminder_date);

-- ============================================================================
-- 9. PHARMACY ORDERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS pharmacy_public_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  delivery_type TEXT DEFAULT 'pickup',
  notes TEXT,
  prescription_image TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  total NUMERIC(10,2) DEFAULT 0,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pharmacy_public_orders ADD CONSTRAINT pharmacy_orders_status_check
  CHECK (status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'));

CREATE INDEX IF NOT EXISTS idx_pharmacy_orders_phone ON pharmacy_public_orders(patient_phone);
CREATE INDEX IF NOT EXISTS idx_pharmacy_orders_status ON pharmacy_public_orders(status);

-- ============================================================================
-- 10. VENDORS
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 11. PHARMACY QUESTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS pharmacy_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  question TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 12. LAB TESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  result_summary TEXT,
  file_url TEXT,
  sample_collected_at TIMESTAMPTZ,
  verified_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE lab_tests ADD CONSTRAINT lab_tests_status_check
  CHECK (status IN ('PENDING', 'COLLECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED'));

CREATE INDEX IF NOT EXISTS idx_lab_tests_appointment ON lab_tests(appointment_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_status ON lab_tests(status);

-- ============================================================================
-- 13. INVOICES
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_code TEXT NOT NULL UNIQUE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  patient_name TEXT,
  consultation_charge NUMERIC(10,2) DEFAULT 0,
  lab_charge NUMERIC(10,2) DEFAULT 0,
  medicine_charge NUMERIC(10,2) DEFAULT 0,
  insurance_deduction NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'UNPAID',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('UNPAID', 'PARTIAL', 'PAID', 'CANCELLED', 'REFUNDED'));

CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_appointment ON invoices(appointment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_code ON invoices(invoice_code);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- ============================================================================
-- 14. PAYMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  invoice_code TEXT,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  method TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_id ON payments(razorpay_payment_id);

-- ============================================================================
-- 15. INSURANCE POLICIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_no TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  coverage_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  valid_until DATE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 16. INSURANCE CLAIMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  policy_id UUID REFERENCES insurance_policies(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING',
  decision_reason TEXT,
  settled_amount NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE insurance_claims ADD CONSTRAINT insurance_claims_status_check
  CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SETTLED'));

CREATE INDEX IF NOT EXISTS idx_insurance_claims_patient ON insurance_claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status);

-- ============================================================================
-- 17. EMERGENCY CASES
-- ============================================================================
CREATE TABLE IF NOT EXISTS emergency_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  phone TEXT,
  department TEXT,
  description TEXT,
  severity TEXT DEFAULT 'NORMAL',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  bed_id UUID,
  assigned_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE emergency_cases ADD CONSTRAINT emergency_cases_severity_check
  CHECK (severity IN ('NORMAL', 'URGENT', 'CRITICAL', 'IMMEDIATE'));

ALTER TABLE emergency_cases ADD CONSTRAINT emergency_cases_status_check
  CHECK (status IN ('ACTIVE', 'TREATING', 'DISCHARGED', 'TRANSFERRED', 'DECEASED'));

CREATE INDEX IF NOT EXISTS idx_emergency_cases_status ON emergency_cases(status);
CREATE INDEX IF NOT EXISTS idx_emergency_cases_severity ON emergency_cases(severity);

-- ============================================================================
-- 18. EMERGENCY SOS REQUESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS emergency_sos_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  emergency_type TEXT,
  description TEXT,
  age INTEGER,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE emergency_sos_requests ADD CONSTRAINT sos_requests_status_check
  CHECK (status IN ('PENDING', 'DISPATCHED', 'ARRIVED', 'RESOLVED', 'CANCELLED'));

-- ============================================================================
-- 19. BEDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_number TEXT NOT NULL UNIQUE,
  ward TEXT,
  is_occupied BOOLEAN DEFAULT false,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 20. TELEMEDICINE SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS telemedicine_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  recording_url TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE telemedicine_sessions ADD CONSTRAINT telemedicine_status_check
  CHECK (status IN ('PENDING', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'MISSED'));

CREATE INDEX IF NOT EXISTS idx_telemedicine_appointment ON telemedicine_sessions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_telemedicine_doctor ON telemedicine_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_telemedicine_patient ON telemedicine_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_telemedicine_status ON telemedicine_sessions(status);

-- ============================================================================
-- 21. NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'GENERAL',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  entity_id UUID,
  entity_table TEXT,
  priority TEXT DEFAULT 'NORMAL',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notifications ADD CONSTRAINT notifications_priority_check
  CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'));

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ============================================================================
-- 22. CONTACT MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'UNREAD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contact_messages ADD CONSTRAINT contact_messages_status_check
  CHECK (status IN ('UNREAD', 'READ', 'REPLIED', 'ARCHIVED'));

-- ============================================================================
-- 23. AUDIT LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  actor_id UUID,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================================
-- 24. WALK-INS (Reception)
-- ============================================================================
CREATE TABLE IF NOT EXISTS walk_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  department TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'WAITING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE walk_ins ADD CONSTRAINT walk_ins_status_check
  CHECK (status IN ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all user-sensitive tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemedicine_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_public_orders ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Profiles: admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN', 'HOSPITAL_ADMIN'))
  );

-- Patients: users can view their own patient record
CREATE POLICY "Users can view own patient record" ON patients
  FOR SELECT USING (profile_id = auth.uid());

-- Patients: staff can view all patients
CREATE POLICY "Staff can view all patients" ON patients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'PATIENT')
  );

-- Appointments: patients can view their own appointments
CREATE POLICY "Patients can view own appointments" ON appointments
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
  );

-- Appointments: staff can view all appointments
CREATE POLICY "Staff can view all appointments" ON appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'PATIENT')
  );

-- Medicine Reminders: patients can view their own reminders
CREATE POLICY "Patients can view own reminders" ON medicine_reminders
  FOR SELECT USING (
    patient_phone IN (SELECT phone FROM patients WHERE profile_id = auth.uid())
  );

-- Medicine Reminders: staff can view all reminders
CREATE POLICY "Staff can view all reminders" ON medicine_reminders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'PATIENT')
  );

-- Notifications: users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Invoices: patients can view their own invoices
CREATE POLICY "Patients can view own invoices" ON invoices
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
  );

-- Invoices: billing staff can view all invoices
CREATE POLICY "Billing staff can view all invoices" ON invoices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('BILLING', 'BILLING_STAFF', 'ADMIN', 'SUPER_ADMIN'))
  );

-- Payments: patients can view their own payments
CREATE POLICY "Patients can view own payments" ON payments
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE patient_id IN (
        SELECT id FROM patients WHERE profile_id = auth.uid()
      )
    )
  );

-- Insurance Claims: patients can view their own claims
CREATE POLICY "Patients can view own insurance claims" ON insurance_claims
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
  );

-- Insurance Claims: insurance staff can view all claims
CREATE POLICY "Insurance staff can view all claims" ON insurance_claims
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('INSURANCE', 'INSURANCE_STAFF', 'ADMIN', 'SUPER_ADMIN'))
  );

-- Telemedicine: patients can view their own sessions
CREATE POLICY "Patients can view own telemedicine sessions" ON telemedicine_sessions
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
  );

-- Telemedicine: doctors can view their assigned sessions
CREATE POLICY "Doctors can view assigned telemedicine sessions" ON telemedicine_sessions
  FOR SELECT USING (
    doctor_id IN (SELECT id FROM doctors WHERE profile_id = auth.uid())
  );

-- Lab Tests: patients can view their own lab tests
CREATE POLICY "Patients can view own lab tests" ON lab_tests
  FOR SELECT USING (
    appointment_id IN (
      SELECT id FROM appointments WHERE patient_id IN (
        SELECT id FROM patients WHERE profile_id = auth.uid()
      )
    )
  );

-- Emergency Cases: emergency staff can view all cases
CREATE POLICY "Emergency staff can view all cases" ON emergency_cases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('EMERGENCY', 'EMERGENCY_STAFF', 'ADMIN', 'SUPER_ADMIN', 'DOCTOR'))
  );

-- Pharmacy Orders: patients can view orders with their phone
CREATE POLICY "Patients can view own pharmacy orders" ON pharmacy_public_orders
  FOR SELECT USING (
    patient_phone IN (SELECT phone FROM patients WHERE profile_id = auth.uid())
  );

-- Pharmacy Orders: pharmacy staff can view all orders
CREATE POLICY "Pharmacy staff can view all orders" ON pharmacy_public_orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('PHARMACIST', 'PHARMACY_ADMIN', 'ADMIN', 'SUPER_ADMIN'))
  );

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON medicines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicine_reminders_updated_at BEFORE UPDATE ON medicine_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_tests_updated_at BEFORE UPDATE ON lab_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_cases_updated_at BEFORE UPDATE ON emergency_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pharmacy_orders_updated_at BEFORE UPDATE ON pharmacy_public_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
