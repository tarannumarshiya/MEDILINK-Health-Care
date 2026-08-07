-- MEDILINK Healthcare Seed Data for UAT
-- Version: 002_idempotent_with_demo_auth
-- Date: 2026-08-07
-- Description: Dummy data for controlled client UAT testing.
--              Every INSERT uses ON CONFLICT (id) DO NOTHING so the seed
--              is fully repeatable / idempotent.
--              Demo auth accounts are created so profiles.id FK → auth.users
--              is satisfied on a brand-new database.
--
-- Prerequisites:
--   1. Migration 001_initial_schema.sql has been applied.
--   2. Migration 002_align_backend_schema.sql has been applied.
--   3. pgcrypto extension is available (for password hashing).

-- ============================================================================
-- 0. CRYPTOGRAPHIC EXTENSION (for demo auth passwords)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. DEMO AUTH USERS (Supabase GoTrue / auth.users)
--    These rows make the profiles FK work on a fresh DB. Passwords match the
--    reset doc; they are NOT real production credentials.
-- ============================================================================
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'b1b2c3d4-e5f6-7890-abcd-ef1234567801', 'authenticated', 'authenticated', 'patient@demo.com',  crypt('Demo123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Demo Patient","role":"PATIENT"}', false, false),
  ('00000000-0000-0000-0000-000000000000', 'b1b2c3d4-e5f6-7890-abcd-ef1234567802', 'authenticated', 'authenticated', 'john@demo.com',      crypt('Demo123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"John Smith","role":"PATIENT"}',    false, false),
  ('00000000-0000-0000-0000-000000000000', 'b1b2c3d4-e5f6-7890-abcd-ef1234567803', 'authenticated', 'authenticated', 'sarah@demo.com',     crypt('Demo123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Wilson","role":"PATIENT"}',   false, false),
  ('00000000-0000-0000-0000-000000000000', 'c1b2c3d4-e5f6-7890-abcd-ef1234567801', 'authenticated', 'authenticated', 'admin@demo.com',     crypt('Admin123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin User","role":"ADMIN"}',       false, false),
  ('00000000-0000-0000-0000-000000000000', 'c1b2c3d4-e5f6-7890-abcd-ef1234567802', 'authenticated', 'authenticated', 'doctor@demo.com',    crypt('Doctor123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Rajesh Kumar","role":"DOCTOR"}', false, false),
  ('00000000-0000-0000-0000-000000000000', 'c1b2c3d4-e5f6-7890-abcd-ef1234567803', 'authenticated', 'authenticated', 'nurse@demo.com',     crypt('Nurse123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nurse Priya","role":"NURSE"}',      false, false),
  ('00000000-0000-0000-0000-000000000000', 'c1b2c3d4-e5f6-7890-abcd-ef1234567804', 'authenticated', 'authenticated', 'reception@demo.com', crypt('Reception123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Receptionist Amit","role":"RECEPTIONIST"}', false, false),
  ('00000000-0000-0000-0000-000000000000', 'c1b2c3d4-e5f6-7890-abcd-ef1234567805', 'authenticated', 'authenticated', 'pharmacist@demo.com', crypt('Pharm123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Pharmacist Meera","role":"PHARMACIST"}', false, false),
  ('00000000-0000-0000-0000-000000000000', 'c1b2c3d4-e5f6-7890-abcd-ef1234567806', 'authenticated', 'authenticated', 'lab@demo.com',       crypt('Lab123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Lab Tech Sanjay","role":"LAB_TECHNICIAN"}', false, false),
  ('00000000-0000-0000-0000-000000000000', 'c1b2c3d4-e5f6-7890-abcd-ef1234567807', 'authenticated', 'authenticated', 'billing@demo.com',   crypt('Billing123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Billing Staff","role":"BILLING"}',  false, false),
  ('00000000-0000-0000-0000-000000000000', 'c1b2c3d4-e5f6-7890-abcd-ef1234567808', 'authenticated', 'authenticated', 'insurance@demo.com', crypt('Insurance123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Insurance Staff","role":"INSURANCE_STAFF"}', false, false),
  ('00000000-0000-0000-0000-000000000000', 'c1b2c3d4-e5f6-7890-abcd-ef1234567809', 'authenticated', 'authenticated', 'emergency@demo.com', crypt('Emergency123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Emergency Staff","role":"EMERGENCY_STAFF"}', false, false),
  ('00000000-0000-0000-0000-000000000000', 'c1b2c3d4-e5f6-7890-abcd-ef1234567810', 'authenticated', 'authenticated', 'superadmin@demo.com', crypt('Super123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Super Admin","role":"SUPER_ADMIN"}', false, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. DEPARTMENTS
-- ============================================================================
INSERT INTO departments (id, name, description, is_active) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'General Medicine', 'Primary care and general health consultations', true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Cardiology',       'Heart and cardiovascular system',                 true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Orthopedics',      'Bones, joints, and musculoskeletal system',        true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Pediatrics',       'Children and adolescent medicine',                 true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567805', 'Dermatology',      'Skin, hair, and nail conditions',                  true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567806', 'Emergency',        'Emergency and trauma care',                        true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567807', 'Laboratory',       'Diagnostic tests and lab services',                true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567808', 'Pharmacy',         'Medicine dispensing and pharmaceutical care',       true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567809', 'Neurology',        'Brain and nervous system',                         true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567810', 'Gynecology',       'Women''s health and obstetrics',                   true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. PROFILES
-- ============================================================================
INSERT INTO profiles (id, full_name, email, role, is_active) VALUES
  -- Patients
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Demo Patient',   'patient@demo.com',   'PATIENT', true),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567802', 'John Smith',     'john@demo.com',      'PATIENT', true),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Sarah Wilson',   'sarah@demo.com',     'PATIENT', true),
  -- Staff
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Admin User',         'admin@demo.com',       'ADMIN',         true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Dr. Rajesh Kumar',   'doctor@demo.com',      'DOCTOR',        true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Nurse Priya',        'nurse@demo.com',       'NURSE',         true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Receptionist Amit',  'reception@demo.com',   'RECEPTIONIST',  true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567805', 'Pharmacist Meera',   'pharmacist@demo.com',  'PHARMACIST',    true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567806', 'Lab Tech Sanjay',    'lab@demo.com',         'LAB_TECHNICIAN',true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567807', 'Billing Staff',      'billing@demo.com',     'BILLING',       true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567808', 'Insurance Staff',    'insurance@demo.com',   'INSURANCE_STAFF', true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567809', 'Emergency Staff',    'emergency@demo.com',   'EMERGENCY_STAFF', true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567810', 'Super Admin',        'superadmin@demo.com',  'SUPER_ADMIN',   true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. PATIENTS
-- ============================================================================
INSERT INTO patients (id, profile_id, patient_code, full_name, age, phone, email) VALUES
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567801', 'b1b2c3d4-e5f6-7890-abcd-ef1234567801', 'PAT-001', 'Demo Patient', 35, '+8801712345678', 'patient@demo.com'),
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567802', 'b1b2c3d4-e5f6-7890-abcd-ef1234567802', 'PAT-002', 'John Smith',   28, '+8801712345679', 'john@demo.com'),
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567803', 'b1b2c3d4-e5f6-7890-abcd-ef1234567803', 'PAT-003', 'Sarah Wilson', 42, '+8801712345680', 'sarah@demo.com')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. DOCTORS
-- ============================================================================
INSERT INTO doctors (id, profile_id, name, email, department_id, qualification, experience_years, consultation_fee, is_available) VALUES
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567801', 'c1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Dr. Rajesh Kumar', 'doctor@demo.com', 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'MBBS, MD (Medicine)',  15, 500.00, true),
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567802', 'c1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Dr. Rajesh Kumar', 'doctor@demo.com', 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'MBBS, DM (Cardiology)', 20, 800.00, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. MEDICINES
-- ============================================================================
INSERT INTO medicines (id, name, description, category, price, quantity, requires_prescription, is_available) VALUES
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Paracetamol 500mg',  'Pain reliever and fever reducer',          'Analgesics',      25.00, 500, false, true),
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Amoxicillin 500mg',  'Antibiotic for bacterial infections',     'Antibiotics',    120.00, 200, true,  true),
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Omeprazole 20mg',    'Proton pump inhibitor for acid reflux',    'Gastrointestinal', 85.00, 300, false, true),
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Metformin 500mg',    'Diabetes medication',                      'Antidiabetics',   45.00, 400, true,  true),
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567805', 'Amlodipine 5mg',     'Blood pressure medication',               'Antihypertensives',65.00, 250, true,  true),
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567806', 'Cetirizine 10mg',    'Antihistamine for allergies',             'Antihistamines',  35.00, 600, false, true),
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567807', 'Ibuprofen 400mg',    'Nonsteroidal anti-inflammatory drug',     'NSAIDs',          30.00, 450, false, true),
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567808', 'Azithromycin 500mg', 'Macrolide antibiotic',                    'Antibiotics',    180.00, 150, true,  true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. VENDORS
-- ============================================================================
INSERT INTO vendors (id, name, contact, email) VALUES
  ('v1b2c3d4-e5f6-7890-abcd-ef1234567801', 'HealthPharma Ltd',  '+8801711111111', 'sales@healthpharma.com'),
  ('v1b2c3d4-e5f6-7890-abcd-ef1234567802', 'MediSource Corp',   '+8801722222222', 'orders@medisource.com')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. INSURANCE POLICIES
-- ============================================================================
INSERT INTO insurance_policies (id, policy_no, provider, coverage_amount, valid_until, patient_id) VALUES
  ('g1b2c3d4-e5f6-7890-abcd-ef1234567801', 'POL-001', 'HealthGuard Insurance', 500000.00, '2027-12-31', 'd1b2c3d4-e5f6-7890-abcd-ef1234567801'),
  ('g1b2c3d4-e5f6-7890-abcd-ef1234567802', 'POL-002', 'MediCare Plus',        300000.00, '2027-06-30', 'd1b2c3d4-e5f6-7890-abcd-ef1234567802')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. BEDS
-- ============================================================================
INSERT INTO beds (id, bed_number, ward, is_occupied) VALUES
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567801', 'ER-01',       'Emergency',      false),
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567802', 'ER-02',       'Emergency',      false),
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567803', 'ER-03',       'Emergency',      false),
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567804', 'ICU-01',      'ICU',            false),
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567805', 'ICU-02',      'ICU',            false),
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567806', 'WARD-A-01',   'General Ward A', false),
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567807', 'WARD-A-02',   'General Ward A', false),
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567808', 'WARD-B-01',   'General Ward B', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 10. APPOINTMENTS (cover a range of statuses for testing)
-- ============================================================================
INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, patient_name, patient_phone, department, department_id, preferred_date, preferred_time, symptoms, status, lab_required) VALUES
  ('i1b2c3d4-e5f6-7890-abcd-ef1234567801', 'APT-2026-001', 'd1b2c3d4-e5f6-7890-abcd-ef1234567801', 'e1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Demo Patient',  '+8801712345678', 'General Medicine', 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', '2026-08-10', '10:00', 'Fever and headache for 3 days', 'PENDING_PATIENT_APPROVAL', true),
  ('i1b2c3d4-e5f6-7890-abcd-ef1234567802', 'APT-2026-002', 'd1b2c3d4-e5f6-7890-abcd-ef1234567802', 'e1b2c3d4-e5f6-7890-abcd-ef1234567802', 'John Smith',    '+8801712345679', 'Cardiology',      'a1b2c3d4-e5f6-7890-abcd-ef1234567802', '2026-08-11', '14:00', 'Chest pain and shortness of breath', 'LAB_REQUESTED', true),
  ('i1b2c3d4-e5f6-7890-abcd-ef1234567803', 'APT-2026-003', 'd1b2c3d4-e5f6-7890-abcd-ef1234567803', NULL, 'Sarah Wilson', '+8801712345680', 'Dermatology',     'a1b2c3d4-e5f6-7890-abcd-ef1234567805', '2026-08-12', '11:00', 'Skin rash on arms', 'PENDING', false),
  ('i1b2c3d4-e5f6-7890-abcd-ef1234567804', 'APT-2026-004', 'd1b2c3d4-e5f6-7890-abcd-ef1234567801', 'e1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Demo Patient',  '+8801712345678', 'General Medicine', 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', '2026-08-14', '09:00', 'Follow-up checkup', 'COMPLETED', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 11. PRESCRIPTIONS + ITEMS
-- ============================================================================
INSERT INTO prescriptions (id, appointment_id, doctor_id, prescription_notes, status) VALUES
  ('r1b2c3d4-e5f6-7890-abcd-ef1234567801', 'i1b2c3d4-e5f6-7890-abcd-ef1234567801', 'e1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Take antibiotics and pain relief', 'ACTIVE'),
  ('r1b2c3d4-e5f6-7890-abcd-ef1234567802', 'i1b2c3d4-e5f6-7890-abcd-ef1234567802', 'e1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Cardiac medication course', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO prescription_items (id, prescription_id, medicine_name, dosage, quantity, instructions) VALUES
  ('r2b2c3d4-e5f6-7890-abcd-ef1234567801', 'r1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Amoxicillin 500mg', '500mg x3 daily', 21, 'Take after meals'),
  ('r2b2c3d4-e5f6-7890-abcd-ef1234567802', 'r1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Paracetamol 500mg', '500mg every 8h',  15, 'Take when fever > 100F'),
  ('r2b2c3d4-e5f6-7890-abcd-ef1234567803', 'r1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Amlodipine 5mg',    '5mg once daily',  30, 'Take in the morning')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 12. LAB TESTS
-- ============================================================================
INSERT INTO lab_tests (id, appointment_id, patient_id, doctor_id, test_type, test_name, status, priority, sample_collected_at) VALUES
  ('l1b2c3d4-e5f6-7890-abcd-ef1234567801', 'i1b2c3d4-e5f6-7890-abcd-ef1234567801', 'd1b2c3d4-e5f6-7890-abcd-ef1234567801', 'e1b2c3d4-e5f6-7890-abcd-ef1234567801', 'CBC',    'Complete Blood Count', 'COMPLETED',  'ROUTINE', now() - interval '2 days'),
  ('l1b2c3d4-e5f6-7890-abcd-ef1234567802', 'i1b2c3d4-e5f6-7890-abcd-ef1234567802', 'd1b2c3d4-e5f6-7890-abcd-ef1234567802', 'e1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Lipid Profile', 'Lipid Panel', 'VERIFIED', 'URGENT', now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 13. LAB REPORTS
-- ============================================================================
INSERT INTO lab_reports (id, lab_test_id, patient_id, test_type, result_summary, file_url, verified_by, verified_at) VALUES
  ('lr1b2c3d4-e5f6-7890-abcd-ef1234567801', 'l1b2c3d4-e5f6-7890-abcd-ef1234567801', 'd1b2c3d4-e5f6-7890-abcd-ef1234567801', 'CBC', 'WBC 11.2 (elevated), Hb 13.1 normal', '/reports/cbc-001.pdf', 'Dr. Pathologist', now() - interval '1 day'),
  ('lr1b2c3d4-e5f6-7890-abcd-ef1234567802', 'l1b2c3d4-e5f6-7890-abcd-ef1234567802', 'd1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Lipid Profile', 'Total cholesterol 240mg/dL (high)', '/reports/lipid-001.pdf', 'Dr. Pathologist', now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 14. MEDICAL RECORDS
-- ============================================================================
INSERT INTO medical_records (id, patient_id, type, title, notes, file_url) VALUES
  ('m1b2c3d4-e5f6-7890-abcd-ef1234567801', 'd1b2c3d4-e5f6-7890-abcd-ef1234567801', 'DISCHARGE_SUMMARY', 'Discharge - Aug 14', 'Patient recovered well from fever episode.', NULL),
  ('m1b2c3d4-e5f6-7890-abcd-ef1234567802', 'd1b2c3d4-e5f6-7890-abcd-ef1234567802', 'NOTE', 'Cardiology Consult', 'Patient advised ECG and lipid profile.', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 15. MEDICINE REMINDERS
-- ============================================================================
INSERT INTO medicine_reminders (id, patient_phone, medicine_id, medicine_name, frequency, start_date, next_reminder_date, notes, is_active, profile_id) VALUES
  ('rem1b2c3d4-e5f6-7890-abcd-ef1234567801', '+8801712345678', 'f1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Metformin 500mg', 'daily',    '2026-08-01', '2026-08-08', 'Take after breakfast',            true, 'b1b2c3d4-e5f6-7890-abcd-ef1234567801'),
  ('rem1b2c3d4-e5f6-7890-abcd-ef1234567802', '+8801712345679', 'f1b2c3d4-e5f6-7890-abcd-ef1234567805', 'Amlodipine 5mg',  'monthly', '2026-08-01', '2026-09-01', 'Monthly refill reminder',         true, 'b1b2c3d4-e5f6-7890-abcd-ef1234567802'),
  ('rem1b2c3d4-e5f6-7890-abcd-ef1234567803', '+8801712345680', NULL,                            'Cetirizine 10mg',  'weekly',  '2026-08-01', '2026-08-08', 'Seasonal allergy - order weekly', true, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 16. INVOICES
-- ============================================================================
INSERT INTO invoices (id, invoice_code, patient_id, appointment_id, patient_name, consultation_charge, lab_charge, medicine_charge, insurance_deduction, total, status) VALUES
  ('j1b2c3d4-e5f6-7890-abcd-ef1234567801', 'INV-2026-001', 'd1b2c3d4-e5f6-7890-abcd-ef1234567801', 'i1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Demo Patient', 500.00, 200.00, 120.00, 0.00,  820.00, 'UNPAID'),
  ('j1b2c3d4-e5f6-7890-abcd-ef1234567802', 'INV-2026-002', 'd1b2c3d4-e5f6-7890-abcd-ef1234567802', 'i1b2c3d4-e5f6-7890-abcd-ef1234567802', 'John Smith',   800.00, 500.00, 250.00, 300.00, 1250.00, 'PAID')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 17. PAYMENTS
-- ============================================================================
INSERT INTO payments (id, invoice_id, invoice_code, amount, method, status, razorpay_order_id, razorpay_payment_id) VALUES
  ('pay1b2c3d4-e5f6-7890-abcd-ef1234567801', 'j1b2c3d4-e5f6-7890-abcd-ef1234567802', 'INV-2026-002', 1250.00, 'razorpay', 'CAPTURED', 'order_demo_001', 'pay_demo_001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 18. INSURANCE CLAIMS
-- ============================================================================
INSERT INTO insurance_claims (id, patient_id, policy_id, appointment_id, amount, status, description, decision_reason, settled_amount) VALUES
  ('ic1b2c3d4-e5f6-7890-abcd-ef1234567801', 'd1b2c3d4-e5f6-7890-abcd-ef1234567801', 'g1b2c3d4-e5f6-7890-abcd-ef1234567801', 'i1b2c3d4-e5f6-7890-abcd-ef1234567801', 5000.00, 'APPROVED',  'Fever treatment claim',     'Approved per policy terms',  5000.00),
  ('ic1b2c3d4-e5f6-7890-abcd-ef1234567802', 'd1b2c3d4-e5f6-7890-abcd-ef1234567802', 'g1b2c3d4-e5f6-7890-abcd-ef1234567802', 'i1b2c3d4-e5f6-7890-abcd-ef1234567802', 8000.00, 'PENDING',   'Cardiology consultation',    NULL,                          0.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 19. EMERGENCY CASES
-- ============================================================================
INSERT INTO emergency_cases (id, patient_name, age, gender, phone, department, description, severity, status, bed_id, assigned_doctor_id) VALUES
  ('ec1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Rahim Uddin', 55, 'Male', '+8801719999001', 'Emergency', 'Chest pain, possible MI', 'CRITICAL', 'TREATING', 'h1b2c3d4-e5f6-7890-abcd-ef1234567804', 'e1b2c3d4-e5f6-7890-abcd-ef1234567802'),
  ('ec1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Fatima Begum', 23, 'Female', '+8801719999002', 'Emergency', 'Road accident - leg fracture', 'URGENT', 'ACTIVE', 'h1b2c3d4-e5f6-7890-abcd-ef1234567801', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 20. EMERGENCY SOS REQUESTS
-- ============================================================================
INSERT INTO emergency_sos_requests (id, patient_name, phone, location, emergency_type, description, age, status) VALUES
  ('sos1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Kamal Hossain', '+8801718888001', 'Banani, Dhaka', 'Cardiac',  'Severe chest pain at home', 60, 'DISPATCHED'),
  ('sos1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Nusrat Jahan',  '+8801718888002', 'Gulshan, Dhaka', 'Accident', 'Car accident on road',     35, 'RESOLVED')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 21. WALK-IN QUEUE
-- ============================================================================
INSERT INTO walk_in_queue (id, patient_name, phone, department, reason, status, position, arrived_at) VALUES
  ('w1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Tarek Rahman', '+8801717777001', 'General Medicine', 'Annual checkup',  'WAITING',      1, now() - interval '30 minutes'),
  ('w1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Ayesha Siddique', '+8801717777002', 'Dermatology',   'Skin rash',       'IN_PROGRESS',  2, now() - interval '15 minutes'),
  ('w1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Imran Khan',    '+8801717777003', 'Pediatrics',     'Child vaccination','COMPLETED', 3, now() - interval '1 hour')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 22. NOTIFICATIONS
-- ============================================================================
INSERT INTO notifications (id, user_id, type, title, body, priority, is_read) VALUES
  ('n1b2c3d4-e5f6-7890-abcd-ef1234567801', 'b1b2c3d4-e5f6-7890-abcd-ef1234567801', 'APPOINTMENT', 'Appointment Pending',      'Your appointment request has been received and is pending approval.', 'NORMAL', false),
  ('n1b2c3d4-e5f6-7890-abcd-ef1234567802', 'b1b2c3d4-e5f6-7890-abcd-ef1234567802', 'APPOINTMENT', 'Appointment Approved',     'Your appointment has been approved for Aug 11, 2026 at 2:00 PM.',   'HIGH',   false),
  ('n1b2c3d4-e5f6-7890-abcd-ef1234567803', 'b1b2c3d4-e5f6-7890-abcd-ef1234567801', 'BILLING',     'Invoice Generated',        'An invoice of Tk.820 has been generated for your appointment.',      'NORMAL', false),
  ('n1b2c3d4-e5f6-7890-abcd-ef1234567804', 'b1b2c3d4-e5f6-7890-abcd-ef1234567801', 'LAB',         'Lab Report Ready',         'Your CBC lab report is ready. Please check your patient portal.',    'NORMAL', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 23. AUDIT LOGS
-- ============================================================================
INSERT INTO audit_logs (id, action, entity, entity_id, actor_id, detail) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'APPOINTMENT_CREATED',  'appointments', 'i1b2c3d4-e5f6-7890-abcd-ef1234567801', 'b1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Appointment APT-2026-001 created'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'APPOINTMENT_APPROVED', 'appointments', 'i1b2c3d4-e5f6-7890-abcd-ef1234567802', 'c1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Appointment APT-2026-002 approved'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'INVOICE_GENERATED',    'invoices',     'j1b2c3d4-e5f6-7890-abcd-ef1234567801', 'c1b2c3d4-e5f6-7890-abcd-ef1234567807', 'Invoice INV-2026-001 generated, total 820'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'INVOICE_PAID',         'invoices',     'j1b2c3d4-e5f6-7890-abcd-ef1234567802', 'c1b2c3d4-e5f6-7890-abcd-ef1234567807', 'Invoice INV-2026-002 paid via razorpay')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
