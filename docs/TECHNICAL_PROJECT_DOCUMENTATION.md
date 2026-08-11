# MEDILINK Healthcare — Comprehensive Technical Project Documentation

**Project Name:** MEDILINK Digital Health Care  
**Repository Name:** `medilink-healthcare`  
**System Architecture:** Decoupled Modern Web Application (Next.js 16 Frontend + Express.js 4 REST API + Supabase PostgreSQL)  
**Primary Language:** TypeScript 5.x (Frontend & Backend)  
**Document Version:** 1.0.0  
**Last Verified Date:** August 2026  

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
│   PostgreSQL (DB)   │      │   External APIs     │     │   Supabase Storage  │
│ • Profiles & Roles  │      │ • Razorpay Gateway  │     │ • lab-reports bucket│
│ • Clinical Data     │      │ • Brevo Email API   │     │ • Pathologist PDFs  │
│ • Invoices & Claims │      │ • Meta WhatsApp API │     └─────────────────────┘
│ • Audit Logs        │      │ • Twilio SMS API    │
└─────────────────────┘      └─────────────────────┘
```

### 4.1 Frontend Architecture
- **Route Groups:**
  - `app/(public)/`: Public marketing and service pages sharing standard `PublicNavbar` and `PublicFooter`.
  - `app/patient/`: Patient authentication, registration, journey timeline, tracking, and dashboard.
  - `app/admin/` & `app/super-admin/`: Administrative control centers.
  - `app/doctor/`, `app/lab/`, `app/pharmacy/`, `app/reception/`, `app/billing/`, `app/insurance/`, `app/emergency/`, `app/telemedicine/`: Role-specialized clinical and operational dashboards.
- **Shared Dashboard Shell (`DashboardShell.tsx`):**
  - Configurable idle session timeout with countdown modal warning and automatic sign-out.
  - Responsive collapsible sidebar navigation with badge counts.
  - Profile header with user avatar initials, active role display, notification bell, and one-click logout.
  - Standardized UI components: `DataTable`, `MetricCard`, `Panel`, `SkeletonLoader`, `StatusBadge`, `SuccessBanner`, `EmptyState`, `ErrorState`.

### 4.2 Backend Architecture
- **Fail-Closed Configuration (`backend/src/lib/config.ts`):**
  - Application environment detection (`development`, `trial`, `production`).
  - Strict payment mode guard: `PAYMENT_MODE=mock` is rejected in production and requires `DEMO_MODE=true`. Refuses to boot if required Supabase keys or Razorpay secrets are missing.
- **Dual Supabase Client Architecture (`backend/src/lib/supabase.ts`):**
  - `createRequestClient(req)`: Session-aware client configured with the caller's JWT, respecting PostgreSQL Row Level Security (RLS) policies.
  - `serviceClient`: Privileged service-role client bypassing RLS for administrative background updates, audit log creation, and notification queuing.
- **Error Mapping (`dbErrorStatus`):**
  - Translates PostgreSQL/PostgREST error codes (e.g., `23505` unique violation, `23514` check constraint violation, `PGRST116` single row not found) into appropriate `400`/`404` client responses rather than leaking `500` server errors.

---

## 5. Project Directory Structure

```
Medilink/
├── medilink/                          # Main Application Root (Git Repository)
│   ├── backend/                       # Express.js REST API Server
│   │   ├── Dockerfile                 # Backend container definition
│   │   ├── MIGRATION.md               # Express migration notes
│   │   ├── package.json               # Backend dependencies & npm scripts
│   │   ├── tsconfig.json              # TypeScript compiler configuration
│   │   ├── src/
│   │   │   ├── index.ts               # Express server entry point & middleware pipeline
│   │   │   ├── openapi.json           # Interactive Swagger OpenAPI 3.0 specification
│   │   │   ├── lib/                   # Shared backend utility libraries
│   │   │   │   ├── billing.ts         # Automatic invoice generation algorithms
│   │   │   │   ├── config.ts          # Centralized fail-closed environment configuration
│   │   │   │   ├── dates.ts           # ISO/YMD calendar date validation
│   │   │   │   ├── email.ts           # Brevo transactional email sender
│   │   │   │   ├── errors.ts          # Custom Application Error classes
│   │   │   │   ├── ids.ts             # ID generators (APT-, PAT-, INV-)
│   │   │   │   ├── logger.ts          # Request and error logging wrapper
│   │   │   │   ├── roles.ts           # Central role registry and permission helper groups
│   │   │   │   ├── sms.ts             # Twilio SMS delivery service
│   │   │   │   ├── supabase.ts        # Supabase client factory and PostgREST error mapper
│   │   │   │   └── whatsapp.ts        # Meta WhatsApp Business Cloud API client
│   │   │   ├── middleware/            # Express middleware handlers
│   │   │   │   ├── auth.ts            # requireAuth & requireRole RBAC guards
│   │   │   │   ├── errorHandler.ts    # Global error interceptor and response formatter
│   │   │   │   ├── idempotency.ts     # Header-based Idempotency-Key caching
│   │   │   │   ├── logger.ts          # HTTP request profiling logger
│   │   │   │   ├── security.ts        # Rate limiters (apiLimiter, authLimiter, bookingLimiter)
│   │   │   │   ├── timeout.ts         # Request timeout guard (30 seconds)
│   │   │   │   └── validate.ts        # Body & query required field validators
│   │   │   └── routes/                # 16 Modular REST Route Controllers
│   │   │       ├── admin.ts           # Departments, doctors, appointment approvals
│   │   │       ├── appointments.ts    # Booking, privacy-preserving tracking, consent
│   │   │       ├── audit.ts           # Administrative audit log retrieval
│   │   │       ├── billing.ts         # Invoicing, payments, revenue analytics
│   │   │       ├── contact.ts         # Public contact message handling
│   │   │       ├── doctor.ts          # Clinical queue, prescriptions, patient history
│   │   │       ├── emergency.ts       # Public bed status, SOS dispatch, emergency cases
│   │   │       ├── insurance.ts       # Policy management & claims processing
│   │   │       ├── lab.ts             # Diagnostic test queue & report uploading
│   │   │       ├── notifications.ts   # In-app notification creation & read status
│   │   │       ├── patients.ts        # Patient registration
│   │   │       ├── payment.ts         # Razorpay orders, UPI QR, HMAC verification
│   │   │       ├── pharmacy.ts        # Medicine inventory, orders, dispensing queue
│   │   │       ├── reception.ts       # Walk-in triage, check-in, doctor roster
│   │   │       ├── reminders.ts       # Automated medication dosage reminders
│   │   │       └── telemedicine.ts    # Video consultation session management
│   │   └── test/
│   │       └── security.test.ts       # In-memory mock automated security test suite (18 tests)
│   ├── frontend/                      # Next.js 16 React Web Application
│   │   ├── Dockerfile                 # Frontend container definition
│   │   ├── next.config.ts             # Next.js rewrites, image remote patterns, optimizations
│   │   ├── package.json               # Frontend dependencies & npm scripts
│   │   ├── postcss.config.mjs         # PostCSS configuration for Tailwind v4
│   │   ├── tsconfig.json              # Frontend TypeScript configuration
│   │   ├── public/                    # Static assets, branding logos, icons
│   │   └── src/
│   │       ├── app/                   # App Router pages and layouts (28 routes)
│   │       │   ├── globals.css        # Core design system tokens (OKLCH & legacy variables)
│   │       │   ├── layout.tsx         # Root layout with fonts, theme provider, toasts
│   │       │   ├── page.tsx           # Home landing page
│   │       │   ├── (public)/          # Public marketing layouts
│   │       │   ├── about/             # About Medilink page
│   │       │   ├── admin/             # Hospital Admin portal
│   │       │   ├── appointment/       # Online appointment booking page
│   │       │   ├── billing/           # Billing & revenue management portal
│   │       │   ├── contact/           # Contact & inquiry form page
│   │       │   ├── departments/       # Medical specialty departments catalog
│   │       │   ├── doctor/            # Doctor workstation & queue portal
│   │       │   ├── doctors/           # Public doctor directory
│   │       │   ├── emergency/         # Emergency SOS & triage portal
│   │       │   ├── insurance/         # Health insurance portal
│   │       │   ├── lab/               # Diagnostic laboratory portal
│   │       │   ├── login/             # Centralized staff login page
│   │       │   ├── medicine-remainders/# Public medicine reminder interface
│   │       │   ├── packages/          # Health checkup packages
│   │       │   ├── patient/           # Patient dashboard, tracking, journey, auth
│   │       │   ├── pharmacy/          # E-pharmacy catalog, cart, tracking, portal
│   │       │   ├── reception/         # Reception desk & walk-in queue portal
│   │       │   ├── services/          # Hospital clinical services catalog
│   │       │   ├── super-admin/       # Platform superuser administration portal
│   │       │   ├── telemedicine/      # Telemedicine video consultation portal
│   │       │   └── terms/             # Legal, privacy, and refund policies
│   │       ├── components/            # Reusable UI component library
│   │       │   ├── BrandLogo.tsx      # Responsive SVG branding logo
│   │       │   ├── dashboard/         # Dashboard shell, tables, metrics, banners
│   │       │   ├── payment/           # Razorpay checkout, UPI QR modal, hospital bills
│   │       │   ├── pharmacy/          # Cart drawer, reminder modals, medicine cards
│   │       │   ├── public/            # Public navbar, footer, interactive chatbot, pickers
│   │       │   └── sections/          # Landing page modular marketing sections
│   │       ├── context/               # React Context providers (PharmacyCartContext)
│   │       ├── hooks/                 # Custom React hooks
│   │       ├── lib/                   # Frontend helpers (apiFetch, redirects, roles, supabase)
│   │       └── types/                 # TypeScript entity definitions (17 type files)
│   ├── supabase/                      # Database Migrations, Seeds & Scripts
│   │   ├── DATABASE_SETUP.md          # Step-by-step database setup documentation
│   │   ├── reset-db.ps1               # Automated PowerShell database wipe & seed script
│   │   ├── reset-db.sh                # Automated Bash database wipe & seed script
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql # Core tables, constraints, foreign keys, RLS
│   │   │   ├── 002_align_backend_schema.sql # Alignments (lab_reports, medical_records, status checks)
│   │   │   └── 003_security_hardening.sql # Consent audit log, employee_id, storage bucket
│   │   └── seed/
│   │       └── uat_seed_data.sql      # Idempotent UAT seed records with 13 demo accounts
│   ├── docs/                          # Comprehensive technical documentation folder
│   ├── package.json                   # Root monorepo workspace orchestration
│   ├── render.yaml                    # Cloud deployment specification for Render
│   └── vercel.json                    # Frontend deployment specification for Vercel
```

---

## 6. User Roles & Role-Wise Access Matrix

| Role Constant | Human-Readable Label | Default Dashboard Route | Primary Accessible Modules & Permissions |
|---|---|---|---|
| `SUPER_ADMIN` | Super Admin | `/super-admin/dashboard` | Unrestricted global access; system settings; audit logs; user role management |
| `HOSPITAL_ADMIN` / `ADMIN` | Hospital Admin | `/admin/dashboard` | Department & doctor management; appointment approvals; staff rosters; contact messages |
| `DEPARTMENT_ADMIN` | Department Admin | `/admin/dashboard` | Department-specific clinician management and appointment oversight |
| `DOCTOR` | Doctor | `/doctor/queue` | Clinical consultation queue; prescription writing; lab ordering; patient medical history |
| `NURSE` | Nurse | `/reception/dashboard` | Patient vital signs recording; reception support; inpatient care assistance |
| `RECEPTIONIST` / `RECEPTION_ADMIN` | Receptionist | `/reception/dashboard` | Walk-in queue; appointment check-in; doctor availability toggling; invoice initiation |
| `LAB_TECHNICIAN` / `LAB_ADMIN` / `TESTER` | Lab Staff | `/lab/queue` | Diagnostic test queue; status progression; report uploading; pathologist verification |
| `PHARMACIST` / `PHARMACY_ADMIN` | Pharmacist | `/pharmacy/queue` | Prescription dispensing; public order fulfillment; inventory stock control; vendors |
| `BILLING` / `BILLING_STAFF` / `BILLING_ADMIN` | Billing Staff | `/billing/dashboard` | Invoice generation; payment reconciliation; revenue analytics; cash receipts |
| `INSURANCE` / `INSURANCE_STAFF` / `INSURANCE_ADMIN` | Insurance Staff | `/insurance/dashboard` | Insurance policy tracking; claim approval/rejection; invoice deduction updates |
| `EMERGENCY` / `EMERGENCY_STAFF` / `EMERGENCY_ADMIN` | Emergency Staff | `/emergency/dashboard` | SOS dispatch management; emergency case triage; ward bed assignments |
| `TELEMEDICINE` / `TELEMEDICINE_ADMIN` | Telemedicine Staff | `/telemedicine/dashboard` | Remote video session scheduling; session monitoring; recording management |
| `PATIENT` | Patient | `/patient/dashboard` | Personal appointment booking; track status; view prescriptions, lab reports, & bills |

---

## 7. Major System Workflows & Data Flows

### 7.1 Outpatient Care Lifecycle (Booking to Discharge)
```
1. Patient books appointment on web portal (/appointment)
   ↳ POST /api/appointments/create -> Status: PENDING (Code generated: APT-XXXX)
   ↳ Brevo Email + Meta WhatsApp + Twilio SMS confirmation dispatched

2. Admin / Doctor approves appointment (/admin/dashboard)
   ↳ POST /api/admin/appointments/approve -> Status: APPROVED (Doctor assigned)
   ↳ In-app notification created for patient

3. Patient checks in at Reception (/reception/dashboard)
   ↳ POST /api/reception/check-in -> Status: APPROVED / IN_PROGRESS
   ↳ Initial consultation invoice record created (Status: UNPAID)

4. Doctor conducts consultation (/doctor/queue)
   ↳ PATCH /api/doctor/start-consultation -> Status: IN_PROGRESS
   ↳ POST /api/doctor/prescription -> Prescriptions saved, Lab test created (Status: LAB_REQUESTED)
   ↳ Auto-invoice generated with consultation + lab + medicine charges

5. Patient confirms consent (/patient/dashboard or staff PIN assisted)
   ↳ POST /api/appointments/:id/consent -> Status: LAB_REQUESTED or PRESCRIPTION_READY
   ↳ Immutable record written to consent_audit_log

6. Lab technician processes diagnostic test (/lab/queue)
   ↳ PATCH /api/lab/update-status -> Status: LAB_PROCESSING -> COMPLETED
   ↳ POST /api/lab/upload-report -> PDF stored in Supabase, report notified to patient

7. Pharmacist dispenses medications (/pharmacy/queue)
   ↳ PATCH /api/pharmacy/queue -> Status: PHARMACY_FULFILLED
   ↳ Medicine stock decremented in medicines table, patient notified

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
