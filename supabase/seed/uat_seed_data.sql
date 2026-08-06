-- MEDILINK Healthcare Seed Data for UAT
-- Version: 001_uat_seed
-- Date: 2026-08-06
-- Description: Dummy data for controlled client UAT testing

-- ============================================================================
-- DEPARTMENTS
-- ============================================================================
INSERT INTO departments (id, name, description, is_active) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'General Medicine', 'Primary care and general health consultations', true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Cardiology', 'Heart and cardiovascular system', true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Orthopedics', 'Bones, joints, and musculoskeletal system', true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Pediatrics', 'Children and adolescent medicine', true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567805', 'Dermatology', 'Skin, hair, and nail conditions', true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567806', 'Emergency', 'Emergency and trauma care', true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567807', 'Laboratory', 'Diagnostic tests and lab services', true),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567808', 'Pharmacy', 'Medicine dispensing and pharmaceutical care', true);

-- ============================================================================
-- PROFILES (Demo users for each role)
-- ============================================================================
-- Note: In production, profiles are created via Supabase Auth.
-- For UAT, these are placeholder profiles that would be linked to auth users.
-- The actual auth users must be created via Supabase Auth API.

-- Patient profiles (will be linked to auth users)
INSERT INTO profiles (id, full_name, email, role, is_active) VALUES
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Demo Patient', 'patient@demo.com', 'PATIENT', true),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567802', 'John Smith', 'john@demo.com', 'PATIENT', true),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Sarah Wilson', 'sarah@demo.com', 'PATIENT', true);

-- Staff profiles
INSERT INTO profiles (id, full_name, email, role, is_active) VALUES
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Admin User', 'admin@demo.com', 'ADMIN', true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Dr. Rajesh Kumar', 'doctor@demo.com', 'DOCTOR', true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Nurse Priya', 'nurse@demo.com', 'NURSE', true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Receptionist Amit', 'reception@demo.com', 'RECEPTIONIST', true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567805', 'Pharmacist Meera', 'pharmacist@demo.com', 'PHARMACIST', true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567806', 'Lab Tech Sanjay', 'lab@demo.com', 'LAB_TECHNICIAN', true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567807', 'Billing Staff', 'billing@demo.com', 'BILLING', true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567808', 'Insurance Staff', 'insurance@demo.com', 'INSURANCE_STAFF', true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567809', 'Emergency Staff', 'emergency@demo.com', 'EMERGENCY_STAFF', true),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567810', 'Super Admin', 'superadmin@demo.com', 'SUPER_ADMIN', true);

-- ============================================================================
-- PATIENTS
-- ============================================================================
INSERT INTO patients (id, profile_id, patient_code, full_name, age, phone, email) VALUES
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567801', 'b1b2c3d4-e5f6-7890-abcd-ef1234567801', 'PAT-001', 'Demo Patient', 35, '+8801712345678', 'patient@demo.com'),
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567802', 'b1b2c3d4-e5f6-7890-abcd-ef1234567802', 'PAT-002', 'John Smith', 28, '+8801712345679', 'john@demo.com'),
  ('d1b2c3d4-e5f6-7890-abcd-ef1234567803', 'b1b2c3d4-e5f6-7890-abcd-ef1234567803', 'PAT-003', 'Sarah Wilson', 42, '+8801712345680', 'sarah@demo.com');

-- ============================================================================
-- DOCTORS
-- ============================================================================
INSERT INTO doctors (id, profile_id, name, email, department_id, qualification, experience_years, consultation_fee, is_available) VALUES
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567801', 'c1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Dr. Rajesh Kumar', 'doctor@demo.com', 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'MBBS, MD (Medicine)', 15, 500.00, true),
  ('e1b2c3d4-e5f6-7890-abcd-ef1234567802', 'c1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Dr. Rajesh Kumar', 'doctor@demo.com', 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'MBBS, DM (Cardiology)', 20, 800.00, true);

-- ============================================================================
-- MEDICINES
-- ============================================================================
INSERT INTO medicines (id, name, description, category, price, quantity, requires_prescription, is_available) VALUES
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Paracetamol 500mg', 'Pain reliever and fever reducer', 'Analgesics', 25.00, 500, false, true),
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Amoxicillin 500mg', 'Antibiotic for bacterial infections', 'Antibiotics', 120.00, 200, true, true),
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Omeprazole 20mg', 'Proton pump inhibitor for acid reflux', 'Gastrointestinal', 85.00, 300, false, true),
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Metformin 500mg', 'Diabetes medication', 'Antidiabetics', 45.00, 400, true, true),
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567805', 'Amlodipine 5mg', 'Blood pressure medication', 'Antihypertensives', 65.00, 250, true, true),
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567806', 'Cetirizine 10mg', 'Antihistamine for allergies', 'Antihistamines', 35.00, 600, false, true),
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567807', 'Ibuprofen 400mg', 'Nonsteroidal anti-inflammatory drug', 'NSAIDs', 30.00, 450, false, true),
  ('f1b2c3d4-e5f6-7890-abcd-ef1234567808', 'Azithromycin 500mg', 'Macrolide antibiotic', 'Antibiotics', 180.00, 150, true, true);

-- ============================================================================
-- INSURANCE POLICIES
-- ============================================================================
INSERT INTO insurance_policies (id, policy_no, provider, coverage_amount, valid_until, patient_id) VALUES
  ('g1b2c3d4-e5f6-7890-abcd-ef1234567801', 'POL-001', 'HealthGuard Insurance', 500000.00, '2027-12-31', 'd1b2c3d4-e5f6-7890-abcd-ef1234567801'),
  ('g1b2c3d4-e5f6-7890-abcd-ef1234567802', 'POL-002', 'MediCare Plus', 300000.00, '2027-06-30', 'd1b2c3d4-e5f6-7890-abcd-ef1234567802');

-- ============================================================================
-- BEDS (for emergency module)
-- ============================================================================
INSERT INTO beds (id, bed_number, ward, is_occupied) VALUES
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567801', 'ER-01', 'Emergency', false),
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567802', 'ER-02', 'Emergency', false),
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567803', 'ER-03', 'Emergency', false),
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567804', 'ICU-01', 'ICU', false),
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567805', 'ICU-02', 'ICU', false),
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567806', 'WARD-A-01', 'General Ward A', false),
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567807', 'WARD-A-02', 'General Ward A', false),
  ('h1b2c3d4-e5f6-7890-abcd-ef1234567808', 'WARD-B-01', 'General Ward B', false);

-- ============================================================================
-- SAMPLE APPOINTMENTS (for testing flow)
-- ============================================================================
INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, patient_name, patient_phone, department, department_id, preferred_date, preferred_time, symptoms, status) VALUES
  ('i1b2c3d4-e5f6-7890-abcd-ef1234567801', 'APT-2026-001', 'd1b2c3d4-e5f6-7890-abcd-ef1234567801', 'e1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Demo Patient', '+8801712345678', 'General Medicine', 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', '2026-08-10', '10:00', 'Fever and headache for 3 days', 'PENDING'),
  ('i1b2c3d4-e5f6-7890-abcd-ef1234567802', 'APT-2026-002', 'd1b2c3d4-e5f6-7890-abcd-ef1234567802', 'e1b2c3d4-e5f6-7890-abcd-ef1234567802', 'John Smith', '+8801712345679', 'Cardiology', 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', '2026-08-11', '14:00', 'Chest pain and shortness of breath', 'APPROVED'),
  ('i1b2c3d4-e5f6-7890-abcd-ef1234567803', 'APT-2026-003', 'd1b2c3d4-e5f6-7890-abcd-ef1234567803', NULL, 'Sarah Wilson', '+8801712345680', 'Dermatology', 'a1b2c3d4-e5f6-7890-abcd-ef1234567805', '2026-08-12', '11:00', 'Skin rash on arms', 'PENDING');

-- ============================================================================
-- SAMPLE INVOICES
-- ============================================================================
INSERT INTO invoices (id, invoice_code, patient_id, appointment_id, patient_name, consultation_charge, lab_charge, medicine_charge, insurance_deduction, total, status) VALUES
  ('j1b2c3d4-e5f6-7890-abcd-ef1234567801', 'INV-2026-001', 'd1b2c3d4-e5f6-7890-abcd-ef1234567801', 'i1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Demo Patient', 500.00, 200.00, 120.00, 0.00, 820.00, 'UNPAID'),
  ('j1b2c3d4-e5f6-7890-abcd-ef1234567802', 'INV-2026-002', 'd1b2c3d4-e5f6-7890-abcd-ef1234567802', 'i1b2c3d4-e5f6-7890-abcd-ef1234567802', 'John Smith', 800.00, 500.00, 250.00, 300.00, 1250.00, 'PAID');

-- ============================================================================
-- SAMPLE NOTIFICATIONS
-- ============================================================================
INSERT INTO notifications (user_id, type, title, body, priority, is_read) VALUES
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567801', 'APPOINTMENT', 'Appointment Pending', 'Your appointment request has been received and is pending approval.', 'NORMAL', false),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567802', 'APPOINTMENT', 'Appointment Approved', 'Your appointment has been approved for August 11, 2026 at 2:00 PM.', 'HIGH', false),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567801', 'BILLING', 'Invoice Generated', 'An invoice of ৳820 has been generated for your appointment.', 'NORMAL', false);

-- ============================================================================
-- SAMPLE AUDIT LOGS
-- ============================================================================
INSERT INTO audit_logs (action, entity, entity_id, actor_id, detail) VALUES
  ('APPOINTMENT_CREATED', 'appointments', 'i1b2c3d4-e5f6-7890-abcd-ef1234567801', 'b1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Appointment APT-2026-001 created'),
  ('APPOINTMENT_APPROVED', 'appointments', 'i1b2c3d4-e5f6-7890-abcd-ef1234567802', 'c1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Appointment APT-2026-002 approved'),
  ('INVOICE_GENERATED', 'invoices', 'j1b2c3d4-e5f6-7890-abcd-ef1234567801', 'c1b2c3d4-e5f6-7890-abcd-ef1234567807', 'Invoice INV-2026-001 generated, total 820'),
  ('INVOICE_PAID', 'invoices', 'j1b2c3d4-e5f6-7890-abcd-ef1234567802', 'c1b2c3d4-e5f6-7890-abcd-ef1234567807', 'Invoice INV-2026-002 paid via cash');

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
