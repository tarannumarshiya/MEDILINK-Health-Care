# MEDILINK Healthcare — Comprehensive Technical Project Documentation

**Documentation Status:** Final  
Documentation reflects the current implementation, validation results, resolved observations, supporting evidence, and remaining project items as verified during the final documentation review.

**Document Title:** System Architecture, Workflows, Configuration, and Engineering Reference  
**Project Name:** MEDILINK Digital Health Care  
**Repository Name:** `medilink-healthcare`  
**System Architecture:** Decoupled Modern Web Application (Next.js 16 Frontend + Express.js 4 REST API + Supabase PostgreSQL)  
**Primary Language:** TypeScript 5.x (Frontend & Backend)  
**Document Version:** 1.0.0  
**Last Verified Date:** August 11, 2026  

---

## 1. Project Overview & Purpose

### 1.1 Executive Summary
**MEDILINK Digital Health Care** is an enterprise-grade, full-stack digital hospital and healthcare management platform. It unites public patient services, multi-specialty clinical workflows, diagnostic laboratory operations, pharmacy inventory & fulfillment, hospital billing, health insurance processing, emergency triage with SOS response, and telemedicine consultations into a single, cohesive, role-governed healthcare operating system.

### 1.2 Core Objectives
- **Patient Empowerment:** Enable seamless appointment booking, live appointment status tracking without exposing private medical data, digital prescription access, automated medicine dosage reminders, and e-pharmacy ordering.
- **Clinical Efficiency:** Provide doctors with consolidated patient medical histories, rapid queue management, structured prescription generation, and instant digital lab report verification.
- **Operational Integration:** Unify diagnostic laboratories, hospital reception desks, inpatient ward beds, emergency triage units, and pharmacy inventory under synchronized status lifecycles.
- **Financial Transparency & Governance:** Automate itemized billing based on clinical encounters, verify payment gateway transactions (Razorpay) with cryptographic signatures and idempotency, reconcile health insurance claim deductions, and maintain an immutable audit trail.

---

## 2. Major Modules & Functional Capabilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MEDILINK PLATFORM MODULES                          │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│   Public & Patient   │   Clinical Care      │    Operations & Finance       │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ • Public Hospital Web│ • Doctor Workstation │ • Inpatient Bed Tracking      │
│ • Online Booking     │ • Prescription Gen   │ • Diagnostic Lab Queue        │
│ • Public Order Track │ • Medical Records    │ • E-Pharmacy & Inventory      │
│ • Secure Code Track  │ • Lab Integration    │ • Itemized Billing & Revenue  │
│ • Medicine Reminders │ • Telemedicine Video │ • Insurance Claims Lifecycle  │
│ • Emergency SOS Call │ • Clinical Consent   │ • Reception Check-in & Queue  │
│ • Multi-channel Comms│ • Patient History    │ • Role-Based Access Control   │
└──────────────────────┴──────────────────────┴───────────────────────────────┘
```

1. **Public Web Portal & Patient Portal:**
   - Modern marketing pages (`/about`, `/services`, `/departments`, `/doctors`, `/packages`, `/contact`).
   - Interactive appointment scheduling (`/appointment`) with auto-generation of unique tracking codes.
   - Zero-leakage public appointment tracking (`/patient/track`) stripping private health information (PHI).
   - E-pharmacy catalog (`/pharmacy`) with interactive shopping cart, checkout, and prescription image attachment.
   - Emergency SOS dispatching interface (`/emergency`) with live hospital bed availability metrics.
   - Public and authenticated medication reminder management (`/medicine-remainders`).
   - Patient dashboard (`/patient/dashboard`) for reviewing active appointments, lab test results, prescriptions, and invoices.
2. **Doctor Workstation & Consultation Queue (`/doctor/queue`):**
   - Department-filtered appointment queue with real-time consultation start actions.
   - Structured digital prescription composer with medicine quantity, dosage, and intake instructions.
   - Automatic lab test ordering trigger during consultation.
   - Consolidated patient medical history viewer (`GET /api/doctor/patient-history`) aggregating appointments, past prescriptions, diagnostic reports, and medical notes.
3. **Diagnostic Laboratory Management (`/lab/queue`):**
   - End-to-end sample collection, processing, completion, and pathologist verification lifecycle.
   - PDF lab report upload and cloud storage integration (`storage.buckets/lab-reports`).
   - Instant patient notification delivery via Email (Brevo), WhatsApp (Meta Cloud API), and SMS (Twilio).
4. **Pharmacy Operations & Stock Control (`/pharmacy/queue`):**
   - Dual-channel fulfillment: In-hospital prescription dispensing queue + public e-commerce order processing.
   - Authoritative server-side price validation preventing client-side cart tampering.
   - Real-time stock decrementing, batch number tracking, expiry date auditing, and low-stock reorder warnings.
   - Vendor and supplier management.
5. **Hospital Billing & Revenue Analytics (`/billing/dashboard`):**
   - Itemized invoice auto-generation combining doctor consultation fees, diagnostic test charges, and dispensed medicine totals.
   - Automatic insurance deduction reconciliation.
   - Multi-mode payment recording: Razorpay online checkout, UPI dynamic QR code verification, and manual cash receipts.
   - Real-time executive revenue dashboards with breakdowns by payment method and departmental charges.
6. **Health Insurance Claims Processing (`/insurance/dashboard`):**
   - Policy enrollment tracking and patient claim submission.
   - Staff claim adjudication (Approve with settled amount / Reject with reason).
   - Automatic recalculation of patient invoice balances upon claim approval.
7. **Emergency Department & Trauma Triage (`/emergency/dashboard`):**
   - Public emergency SOS intake queue with phone dispatch tracking.
   - Emergency case creation with 4-level triage severity categorization (`NORMAL`, `URGENT`, `CRITICAL`, `IMMEDIATE`).
   - Hospital ward bed allocation (`beds` table) with real-time occupancy updates.
8. **Telemedicine Remote Consultations (`/telemedicine/dashboard`):**
   - Video session scheduling linked to doctor and patient profiles.
   - Automated expiration handling for missed sessions (60-minute cutoff).
   - Session recording URL storage.
9. **Hospital Reception & Walk-In Desk (`/reception/dashboard`):**
   - Today's appointment roster review and fast-track patient check-in.
   - Walk-in queue position management with automated consultation invoice generation.
   - Real-time doctor availability toggling.
10. **Platform Administration & Security Governance (`/super-admin/dashboard`, `/admin/dashboard`):**
    - Hospital staff user management, role assignment, and account activation/deactivation.
    - Department configuration and doctor roster management.
    - Immutable audit trail viewer (`/api/audit-logs`) and simulated patient consent verification records.

---

## 3. Technology Stack & Dependencies

### 3.1 Frontend Stack
- **Framework:** Next.js 16.2.7 (React 19.2.4) utilizing the App Router architecture.
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`, PostCSS 8.4) with custom `globals.css` design tokens and OKLCH color spaces.
- **Component Libraries & Utilities:**
  - `clsx` (2.1.1) & `tailwind-merge` (3.6.0) for conditional class composing.
  - `lucide-react` (1.17.0) for healthcare iconography.
  - `motion` (12.40.0) for fluid page transitions, spring animations, and micro-interactions.
  - `next-themes` (0.4.6) for theme switching support.
- **Authentication & Backend Communication:**
  - `@supabase/ssr` (0.10.3) & `@supabase/supabase-js` (2.108.0).
  - Client-side helper `apiFetch.ts` automatically injecting active Supabase JWT Bearer tokens.
  - Next.js rewrite proxy forwarding `/api/*` and `/health` requests to `http://localhost:4000`.

### 3.2 Backend Stack
- **Server Framework:** Express.js 4.21.2 on Node.js 20+ (TypeScript 5.x).
- **Security & Middleware Packages:**
  - `helmet` (8.0.0) for HTTP security headers.
  - `cors` (2.8.5) with strict domain whitelisting.
  - `compression` (1.7.4) for Gzip/Brotli payload compression.
  - `express-rate-limit` (7.4.1) for DDoS and brute-force mitigation (`apiLimiter`, `authLimiter`, `bookingLimiter`).
  - `swagger-ui-express` (5.0.1) for interactive API documentation.
  - `dotenv` (16.5.0) for environment variable parsing.
- **Development Tooling:**
  - `ts-node` (10.9.0) & `ts-node-dev` (2.0.0) with hot reload.
  - `typescript` (5.0.0) & `typescript-eslint` (8.0.0).

### 3.3 Database & Cloud Infrastructure
- **Database:** PostgreSQL 15+ hosted on Supabase.
- **Authentication Service:** Supabase GoTrue Auth (Session tokens, bcrypt password encryption).
- **Object Storage:** Supabase Storage (`lab-reports` bucket).
- **Payment Gateways:** Razorpay API (Orders API, UPI QR Codes API, Webhook HMAC-SHA256 signature verification) + Fail-Closed Mock Payment Simulator.
- **Communication Gateways:**
  - Brevo (Sendinblue) Transactional REST API for transactional HTML emails.
  - Meta WhatsApp Business Cloud API for instant appointment and lab test notifications.
  - Twilio REST API for SMS alerts.

---

## 4. System Architecture & Component Interactions

```
                          ┌──────────────────────────┐
                          │    Next.js 16 Client     │
                          │ (Browser / App Router)   │
                          └─────────────┬────────────┘
                                        │
                         HTTP Proxy via next.config.ts
                         (/api/* -> http://localhost:4000)
                                        │
                          ┌─────────────▼────────────┐
                          │    Express.js Backend    │
                          └─────────────┬────────────┘
                                        │
           ┌────────────────────────────┼───────────────────────────┐
           │                            │                           │
┌──────────▼──────────┐      ┌──────────▼──────────┐     ┌──────────▼──────────┐
│   Authentication    │      │  PostgreSQL Store   │     │ Notification / Pay  │
│  (Supabase GoTrue)  │      │ (28 Tables / RLS)   │     │ (Razorpay / Comms)  │
└─────────────────────┘      └─────────────────────┘     └─────────────────────┘
```

---

## 5. Security & Access Control Architecture

### 5.1 RBAC Role Matrix (24 Roles)
The system defines 24 canonical uppercase user roles in `backend/src/lib/roles.ts`:
1. `SUPER_ADMIN`: Superuser access across all hospital branches and modules.
2. `ADMIN` / `HOSPITAL_ADMIN`: General administrative and hospital management.
3. `DEPARTMENT_ADMIN`: Departmental specialty oversight.
4. `DOCTOR`: Clinical consultation, prescription authoring, lab test ordering.
5. `NURSE`: Ward observation and patient care.
6. `RECEPTIONIST` / `RECEPTION_ADMIN`: Walk-in intake, check-in, doctor roster.
7. `LAB_TECHNICIAN` / `LAB_ADMIN` / `TESTER`: Specimen collection, lab reports, pathology verification.
8. `PHARMACIST` / `PHARMACY_ADMIN`: Medicine inventory, prescription dispensing, public order fulfillment.
9. `BILLING` / `BILLING_STAFF` / `BILLING_ADMIN`: Invoice generation, payments, revenue reports.
10. `INSURANCE` / `INSURANCE_STAFF` / `INSURANCE_ADMIN`: Claims adjudication and policy verification.
11. `EMERGENCY` / `EMERGENCY_STAFF` / `EMERGENCY_ADMIN`: Emergency SOS dispatch and triage ward beds.
12. `TELEMEDICINE` / `TELEMEDICINE_ADMIN`: Video consultation scheduling and management.
13. `PATIENT`: Patient self-service portal (own records only).

### 5.2 Access Control & IDOR Mitigations
- Token parsing via `requireAuth` (`backend/src/middleware/auth.ts`).
- Role authorization via `requireRole(...)`.
- Ownership verification on reminders, consent, insurance claims, and telemedicine sessions.
- Inactive user blocking (`is_active === false` returns `403 Forbidden`).

---

## 6. Database Entity Overview (28 Tables)

| # | Table Name | Purpose | Primary Key | Key Relations |
|---|---|---|---|---|
| 1 | `profiles` | User profiles and role attributes | `id UUID` | FK to `auth.users(id)` |
| 2 | `departments` | Medical specialty departments | `id UUID` | - |
| 3 | `doctors` | Practitioner qualifications and fees | `id UUID` | FK `profile_id`, `department_id` |
| 4 | `patients` | Patient demographic records | `id UUID` | FK `profile_id` |
| 5 | `appointments` | Central clinical care encounters | `id UUID` | FK `patient_id`, `doctor_id`, `department_id` |
| 6 | `prescriptions` | Doctor consultation prescriptions | `id UUID` | FK `appointment_id`, `doctor_id` |
| 7 | `prescription_items` | Prescribed medicine line items | `id UUID` | FK `prescription_id` |
| 8 | `medicines` | Pharmacy catalog and inventory | `id UUID` | - |
| 9 | `medicine_reminders` | Dosage schedule alerts | `id UUID` | FK `profile_id`, `medicine_id` |
| 10 | `pharmacy_public_orders`| E-commerce patient medicine orders | `id UUID` | - |
| 11 | `lab_tests` | Diagnostic lab test orders | `id UUID` | FK `appointment_id`, `patient_id` |
| 12 | `lab_reports` | Digital pathology test reports | `id UUID` | FK `lab_test_id` |
| 13 | `invoices` | Patient hospital invoices | `id UUID` | FK `appointment_id` |
| 14 | `payments` | Financial payment transactions | `id UUID` | FK `invoice_id` |
| 15 | `insurance_policies` | Health insurance coverage policies | `id UUID` | FK `patient_id` |
| 16 | `insurance_claims` | Insurance deduction claims | `id UUID` | FK `policy_id`, `appointment_id` |
| 17 | `emergency_cases` | Trauma and emergency triage cases | `id UUID` | FK `bed_id` |
| 18 | `emergency_sos_requests`| Public SOS dispatch requests | `id UUID` | FK `case_id` |
| 19 | `beds` | Hospital ward bed allocation | `id UUID` | - |
| 20 | `telemedicine_sessions`| Video consultation records | `id UUID` | FK `appointment_id` |
| 21 | `medical_records` | Historical clinical documents | `id UUID` | FK `patient_id` |
| 22 | `notifications` | User in-app notifications | `id UUID` | FK `user_id` |
| 23 | `contact_messages` | Public contact submissions | `id UUID` | - |
| 24 | `audit_logs` | System activity audit trails | `id UUID` | FK `actor_id` |
| 25 | `consent_audit_log` | Immutable patient consent ledger | `id UUID` | FK `appointment_id`, `actor_id` |
| 26 | `walk_in_queue` | Reception triage queue | `id UUID` | FK `patient_id` |
| 27 | `medicine_vendors` | Pharmacy suppliers | `id UUID` | - |
| 28 | `packages` | Health checkup packages | `id UUID` | - |

---

## 7. End-to-End Clinical Lifecycle Workflow

```
1. Patient books appointment (/appointment or public API)
   ↳ POST /api/appointments/create -> Status: PENDING (APT-XXXX)
   ↳ Patient notified via SMS / WhatsApp / Email

2. Hospital Admin reviews & assigns Doctor (/admin/dashboard)
   ↳ POST /api/admin/appointments/approve -> Status: APPROVED

3. Patient / Staff records Consent (/patient/dashboard or /reception/dashboard)
   ↳ POST /api/appointments/:id/consent -> Status: PENDING_PATIENT_APPROVAL -> APPROVED
   ↳ Immutable record written to consent_audit_log

4. Doctor starts consultation (/doctor/queue)
   ↳ PATCH /api/doctor/start-consultation -> Status: IN_PROGRESS

5. Doctor orders diagnostic tests & issues prescription (/doctor/queue)
   ↳ POST /api/doctor/prescription -> Prescriptions recorded
   ↳ If lab required: Status: LAB_REQUESTED -> Diagnostic test created

6. Laboratory collects specimen & verifies report (/lab/queue)
   ↳ PATCH /api/lab/update-status -> Status: LAB_PROCESSING -> LAB_COMPLETED
   ↳ POST /api/lab/upload-report -> PDF uploaded to lab-reports bucket
   ↳ PATCH /api/lab/verify-report -> Status: VERIFIED

7. Pharmacy dispenses prescribed medicines (/pharmacy/queue)
   ↳ PATCH /api/pharmacy/queue -> Status: PHARMACY_FULFILLED
   ↳ Stock decremented in medicines table, invoice auto-generated

8. Billing staff / Patient completes payment (/billing/dashboard or online Razorpay)
   ↳ POST /api/payment/verify or PATCH /api/billing/pay -> Status: PAID -> COMPLETED
   ↳ Appointment marked COMPLETED, payment transaction logged in payments table
```

---

## 8. Development Setup & Execution Guide

### 8.1 Prerequisites
- **Node.js:** v20.x or v22.x LTS
- **Package Manager:** `npm` (v10+)
- **PostgreSQL Client:** `psql` command-line utility (required for direct database seeding scripts)
- **Supabase Account:** Active Supabase project with database connection string

### 8.2 Environment Configuration

#### Backend Environment (`backend/.env`)
```env
PORT=4000
APP_ENV=development
NODE_ENV=development
DEMO_MODE=true
PAYMENT_MODE=mock
CORS_ORIGINS=http://localhost:3000

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# Optional External Keys (Required only for live third-party integrations)
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
BREVO_API_KEY=xkeysib-xxxx
BREVO_SENDER_EMAIL=noreply@medilink.io
BREVO_SENDER_NAME="Medilink Digital Health Care"
META_WA_PHONE_NUMBER_ID=xxxx
META_WA_ACCESS_TOKEN=xxxx
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_PHONE_NUMBER=+1xxxx
```

#### Frontend Environment (`frontend/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxx
NEXT_PUBLIC_PAYMENTS_MODE=mock
EXPRESS_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_APP_ENV=development
```

### 8.3 CLI Commands

| Command | Working Directory | Purpose |
|---|---|---|
| `npm run install:all` | Monorepo Root | Installs all dependencies for both backend and frontend via `npm ci` |
| `npm run reset-db` | Monorepo Root | Executes PowerShell database reset script (applies migrations 001, 002, 003 & seeds UAT data) |
| `npm run reset-db:bash` | Monorepo Root | Executes Bash database reset script for Linux / macOS |
| `npm run dev` | `backend/` | Starts Express backend server with hot reload on `http://localhost:4000` |
| `npm run dev` | `frontend/` | Starts Next.js development server on `http://localhost:3000` |
| `npm run build` | Monorepo Root | Runs production TypeScript compile and Next.js bundle builds for both apps |
| `npm run typecheck` | Monorepo Root | Runs TypeScript `tsc --noEmit` validation across backend and frontend |
| `npm run lint` | Monorepo Root | Runs ESLint analysis across backend and frontend codebases |
| `npm run test:security` | Monorepo Root | Runs the 18 automated in-memory security regression test suite |

---

## 9. Important Technical Decisions & Architecture Rationale

1. **Decoupled Express API with Next.js Rewrite Proxy:**
   - *Rationale:* Separating the backend Express server from the Next.js frontend preserves independent scalability (e.g., deploying backend on Render and frontend on Vercel) while the Next.js rewrite configuration (`next.config.ts`) allows seamless single-origin frontend development without complex CORS pre-flight configurations.
2. **Fail-Closed Configuration Architecture:**
   - *Rationale:* In `backend/src/lib/config.ts`, the backend refuses to start if `PAYMENT_MODE=mock` is detected in a production environment, or if required API keys are missing. This prevents accidental real-world deployment of mock payments or insecure defaults.
3. **Session-Aware Request Client vs. Privileged Service Client:**
   - *Rationale:* Standard patient read operations utilize `createRequestClient(req)` with the caller's JWT to leverage PostgreSQL Row Level Security (RLS) policies. Automated background tasks and administrative actions explicitly use `serviceClient` with the service-role key to prevent permission deadlocks while maintaining an explicit audit trail.
4. **Authoritative Server-Side Pricing in E-Pharmacy:**
   - *Rationale:* Rather than trusting order totals passed from the frontend React cart, `POST /api/pharmacy/orders` fetches authoritative item unit prices directly from the `medicines` database table and recalculates the grand total on the server, completely eliminating client-side price tampering vulnerabilities.
5. **In-Memory Mock Automated Security Regression Test Suite:**
   - *Rationale:* `backend/test/security.test.ts` implements an in-memory fluent mock of Supabase, allowing 18 comprehensive security test cases (IDOR, PII leakage, consent verification, and inactive user rejection) to execute in milliseconds without requiring an active database connection or risking test data pollution.

---

## 10. Known Technical Limitations

1. **In-Memory Idempotency Cache:**
   - *Detail:* The `idempotency` middleware caches request tokens in a local Node.js `Map`. In a multi-instance container cluster behind a load balancer, instances do not share cache state without Redis.
2. **Third-Party Service Key Dependency for Live Communications:**
   - *Detail:* Live email, SMS, and WhatsApp notifications require valid external API credentials (Brevo, Twilio, Meta Cloud API). In development and demo environments without keys, fallback handlers log warnings gracefully without breaking transaction flows.
3. **Local psql Dependency for Database Reset Scripts:**
   - *Detail:* `reset-db.ps1` and `reset-db.sh` require PostgreSQL CLI client tools installed locally to connect and apply migrations.
