-- MEDILINK Healthcare Database Migration
-- Version: 002_align_with_application
-- Date: 2026-08-07
-- Description: Aligns the schema with the tables and columns the backend
-- (Express routes) and frontend (Next.js) actually read and write.
--
-- Adds the tables and columns that were missing from 001 and corrects the
-- status constraints so the CHECK tolerates every status the application sets.
-- Every statement is idempotent so this migration can also repair an existing DB.

-- ============================================================================
-- 1. LAB_REPORTS   (read by backend/src/routes/lab.ts & doctor.ts,
--                  and frontend/src/app/patient/dashboard/page.tsx)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lab_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_test_id UUID REFERENCES lab_tests(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  test_type TEXT,
  result_summary TEXT,
  file_url TEXT,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_reports_lab_test ON lab_reports(lab_test_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_patient ON lab_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_created ON lab_reports(created_at);

-- ============================================================================
-- 2. MEDICAL_RECORDS   (used by GET /api/doctor/patient-history)
-- ============================================================================
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'NOTE',
  title TEXT,
  notes TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. WALK_IN_QUEUE   (used by the reception module; supersedes the unused
--                     `walk_ins` table from 001)
-- ============================================================================
CREATE TABLE IF NOT EXISTS walk_in_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'WAITING',
  position INTEGER DEFAULT 0,
  arrived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP INDEX IF EXISTS idx_walk_in_queue_status_position;
CREATE INDEX idx_walk_in_queue_status_position ON walk_in_queue(status, position);

-- ============================================================================
-- 4. LAB_TESTS — add columns used by lab/doctor/pharmacy routes
-- ============================================================================
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL;
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS test_type TEXT;
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'ROUTINE';

CREATE INDEX IF NOT EXISTS idx_lab_tests_patient ON lab_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_doctor ON lab_tests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_test_type ON lab_tests(test_type);

-- ============================================================================
-- 5. MEDICINE_REMINDERS — ownership column used by /api/reminders
-- ============================================================================
ALTER TABLE medicine_reminders ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_medicine_reminders_profile ON medicine_reminders(profile_id);

-- ============================================================================
-- 6. INSURANCE_CLAIMS — frontend submits a `description` field
-- ============================================================================
ALTER TABLE insurance_claims ADD COLUMN IF NOT EXISTS description TEXT;

-- ============================================================================
-- 7. Fix status CHECK constraints (add lifecycle states the app writes)
-- ============================================================================

-- lab_tests: include VERIFIED
DO $$
BEGIN
  ALTER TABLE lab_tests DROP CONSTRAINT IF EXISTS lab_tests_status_check;
  ALTER TABLE lab_tests ADD CONSTRAINT lab_tests_status_check
    CHECK (status IN ('PENDING', 'COLLECTED', 'PROCESSING', 'COMPLETED', 'VERIFIED', 'CANCELLED'));
END $$;

-- appointments: include full lifecycle incl. LAB_PROCESSING / LAB_COMPLETED /
-- PHARMACY_PENDING / PHARMACY_FULFILLED
DO $$
BEGIN
  ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
  ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
    CHECK (status IN (
      'PENDING', 'APPROVED', 'REJECTED', 'PENDING_PATIENT_APPROVAL',
      'LAB_REQUESTED', 'LAB_PROCESSING', 'LAB_COMPLETED',
      'PRESCRIPTION_READY', 'PHARMACY_PENDING', 'PHARMACY_FULFILLED',
      'INVOICE_GENERATED', 'PAID', 'COMPLETED', 'CANCELLED', 'NO_SHOW',
      'IN_PROGRESS'
    ));
END $$;

-- ============================================================================
-- 8. RLS for the newly added patient-sensitive tables
-- ============================================================================
ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Lab reports: patients can view their own reports
DO $$
BEGIN
  DROP POLICY IF EXISTS "Patients can view own lab reports" ON lab_reports;
  CREATE POLICY "Patients can view own lab reports" ON lab_reports
    FOR SELECT USING (
      patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
    );
END $$;

-- Lab reports: lab / admin staff can view all
DO $$
BEGIN
  DROP POLICY IF EXISTS "Lab staff can view all lab reports" ON lab_reports;
  CREATE POLICY "Lab staff can view all lab reports" ON lab_reports
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('LAB_TECHNICIAN','LAB_ADMIN','TESTER','ADMIN','SUPER_ADMIN','DOCTOR'))
    );
END $$;

-- Medical records: patients can view their own records
DO $$
BEGIN
  DROP POLICY IF EXISTS "Patients can view own medical records" ON medical_records;
  CREATE POLICY "Patients can view own medical records" ON medical_records
    FOR SELECT USING (
      patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
    );
END $$;

-- Medical records: staff can view all
DO $$
BEGIN
  DROP POLICY IF EXISTS "Staff can view all medical records" ON medical_records;
  CREATE POLICY "Staff can view all medical records" ON medical_records
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'PATIENT')
    );
END $$;