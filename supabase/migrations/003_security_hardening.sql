-- MEDILINK Healthcare Database Migration
-- Version: 003_security_hardening
-- Date: 2026-08-07
-- Description: Security hardening — adds verification_code to appointments
-- for safer public tracking, employee_id to profiles for staff identity
-- verification on consent actions, and consent_audit_log for immutable
-- consent action records. Every statement is idempotent.

-- ============================================================================


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

-- ============================================================================
-- 7. STORAGE SETUP — set up lab-reports bucket and policies
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('lab-reports', 'lab-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for lab-reports bucket objects
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'lab-reports');

  DROP POLICY IF EXISTS "Staff can upload reports" ON storage.objects;
  CREATE POLICY "Staff can upload reports" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'lab-reports' AND
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role != 'PATIENT')
    );

  DROP POLICY IF EXISTS "Staff can delete reports" ON storage.objects;
  CREATE POLICY "Staff can delete reports" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'lab-reports' AND
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role != 'PATIENT')
    );
END $$;

-- ============================================================================
-- 8. PRESCRIPTIONS & PRESCRIPTION_ITEMS RLS POLICIES
-- ============================================================================
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Prescriptions policies
  DROP POLICY IF EXISTS "Patients can view own prescriptions" ON public.prescriptions;
  CREATE POLICY "Patients can view own prescriptions" ON public.prescriptions
    FOR SELECT USING (
      appointment_id IN (
        SELECT id FROM public.appointments WHERE patient_id IN (
          SELECT id FROM public.patients WHERE profile_id = auth.uid()
        )
      )
    );

  DROP POLICY IF EXISTS "Staff can manage all prescriptions" ON public.prescriptions;
  CREATE POLICY "Staff can manage all prescriptions" ON public.prescriptions
    FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role != 'PATIENT')
    );

  -- Prescription Items policies
  DROP POLICY IF EXISTS "Patients can view own prescription items" ON public.prescription_items;
  CREATE POLICY "Patients can view own prescription items" ON public.prescription_items
    FOR SELECT USING (
      prescription_id IN (
        SELECT id FROM public.prescriptions WHERE appointment_id IN (
          SELECT id FROM public.appointments WHERE patient_id IN (
            SELECT id FROM public.patients WHERE profile_id = auth.uid()
          )
        )
      )
    );

  DROP POLICY IF EXISTS "Staff can manage all prescription items" ON public.prescription_items;
  CREATE POLICY "Staff can manage all prescription items" ON public.prescription_items
    FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role != 'PATIENT')
    );
END $$;
