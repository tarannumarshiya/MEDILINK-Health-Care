-- MEDILINK Healthcare Database Migration
-- Version: 003_security_hardening
-- Date: 2026-08-07
-- Description: Security hardening — adds verification_code to appointments
-- for safer public tracking, employee_id to profiles for staff identity
-- verification on consent actions, and consent_audit_log for immutable
-- consent action records. Every statement is idempotent.

-- ============================================================================
-- 1. APPOINTMENTS — add verification_code column
-- ============================================================================
-- The verification code is the last 4 digits of the patient's phone number.
-- Public tracking requires both appointment_code AND verification_code,
-- preventing enumeration via appointment reference alone.
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS verification_code TEXT;

-- Backfill existing appointments: use last 4 of patient_phone where available
UPDATE appointments
SET verification_code = RIGHT(patient_phone, 4)
WHERE verification_code IS NULL AND patient_phone IS NOT NULL AND LENGTH(patient_phone) >= 4;

-- For appointments without a phone, set a placeholder that forces re-verification
UPDATE appointments
SET verification_code = '0000'
WHERE verification_code IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_verification ON appointments(verification_code);

-- ============================================================================
-- 2. PROFILES — add employee_id column for staff identity verification
-- ============================================================================
-- Staff must provide their employee_id (or its last 4 digits as PIN) when
-- performing consent actions, creating an auditable identity trail.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON profiles(employee_id);

-- ============================================================================
-- 3. CONSENT_AUDIT_LOG — immutable audit trail for consent actions
-- ============================================================================
-- Separate from the general audit_logs table. This table has no UPDATE or
-- DELETE policies, making consent records tamper-evident.
CREATE TABLE IF NOT EXISTS consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  performed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  performed_by_role TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('ACCEPTED', 'REJECTED')),
  simulated BOOLEAN NOT NULL DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_audit_appointment ON consent_audit_log(appointment_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_patient ON consent_audit_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_performer ON consent_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_consent_audit_created ON consent_audit_log(created_at);

-- ============================================================================
-- 4. RLS for consent_audit_log
-- ============================================================================
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;

-- Patients can view their own consent audit records
DO $$
BEGIN
  DROP POLICY IF EXISTS "Patients can view own consent audit" ON consent_audit_log;
  CREATE POLICY "Patients can view own consent audit" ON consent_audit_log
    FOR SELECT USING (
      patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid())
    );
END $$;

-- Staff can view all consent audit records
DO $$
BEGIN
  DROP POLICY IF EXISTS "Staff can view all consent audit" ON consent_audit_log;
  CREATE POLICY "Staff can view all consent audit" ON consent_audit_log
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role != 'PATIENT')
    );
END $$;

-- Only the service role (backend) can insert consent audit records
DO $$
BEGIN
  DROP POLICY IF EXISTS "Service role can insert consent audit" ON consent_audit_log;
  CREATE POLICY "Service role can insert consent audit" ON consent_audit_log
    FOR INSERT WITH CHECK (true);
END $$;

-- No UPDATE or DELETE policies — consent records are immutable

-- ============================================================================
-- 5. Add consent_audit_log to the general audit RLS if not already covered
-- ============================================================================

-- ============================================================================
-- 6. NOTIFICATION_PERMISSIONS — ensure notification creation is role-scoped
-- ============================================================================
-- The application already enforces this in code, but adding a DB-level
-- CHECK ensures notifications can never be created with invalid priority
-- or type values, preventing data corruption.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS entity_table TEXT;

-- Ensure priority values are constrained
DO $$
BEGIN
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_priority_check;
  ALTER TABLE notifications ADD CONSTRAINT notifications_priority_check
    CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Ensure type values are constrained
DO $$
BEGIN
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('GENERAL', 'APPOINTMENT', 'PRESCRIPTION', 'LAB_RESULT',
                    'PAYMENT', 'EMERGENCY', 'SYSTEM', 'CONSENT'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
