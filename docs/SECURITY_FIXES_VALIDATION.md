# MEDILINK Healthcare — Security Architecture & Hardening Validation Report

**Documentation Status:** Final  
Documentation reflects the current implementation, validation results, resolved observations, supporting evidence, and remaining project items as verified during the final documentation review.

**Document Title:** Security Architecture, Threat Model, Hardening Controls, and Test Validation  
**Project Name:** MEDILINK Digital Health Care  
**Repository:** `medilink-healthcare`  
**Security Standard:** Zero-Trust Healthcare Application Architecture  
**Automated Security Suite:** `backend/test/security.test.ts` (18 Test Assertions)  
**Database Security:** PostgreSQL Row Level Security (RLS) + Immutable Audit Logs  
**Document Version:** 1.0.0  
**Last Verified Date:** August 11, 2026  

---

## 1. Security Overview & Threat Model

MEDILINK enforces a defense-in-depth security model designed to safeguard Protected Health Information (PHI), prevent unauthorized access, mitigate Insecure Direct Object References (IDOR), eliminate Cross-Site Scripting (XSS) and injection vectors, and maintain non-repudiable audit trails across clinical and financial transactions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MEDILINK MULTI-LAYER DEFENSE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Network & Transport: HTTPS / TLS, Helmet Headers, CORS Whitelisting      │
│ 2. Traffic Shaping: Global Rate Limiting, Auth Rate Limiting, Timeouts       │
│ 3. Perimeter Authentication: Supabase GoTrue JWT Bearer Tokens, Idle Timeout│
│ 4. Access Control: Role-Based (RBAC) + Object-Level Ownership (IDOR Defense)│
│ 5. Input Defense: Strict Sanitization (HTML Tag Block /[<>]/g), Type Guards │
│ 6. Data & Storage: PostgreSQL Row Level Security (RLS), Storage Bucket RLS  │
│ 7. Integrity & Audit: HMAC Signatures, Immutable Consent Audit Ledger       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Security Controls & Implementation

### 2.1 Authentication & Session Lifecycle
- **JWT Verification:** Authenticated routes enforce `requireAuth` middleware (`backend/src/middleware/auth.ts`). Tokens are extracted from `Authorization: Bearer <token>` and verified cryptographically by Supabase Auth (`getUser(token)`).
- **Dual-Client Isolation:**
  - Standard user operations resolve a scoped Supabase client (`createRequestClient(req)`) carrying the user's JWT, ensuring queries are evaluated under PostgreSQL Row Level Security (RLS).
  - Privileged system actions use `serviceClient` explicitly, preventing privilege leakage between client contexts.
- **Client-Side Inactivity Auto-Logout:** The frontend `DashboardShell.tsx` continuously monitors user activity (`mousemove`, `keydown`, `click`, `scroll`). A warning countdown modal appears 30 seconds before timeout, automatically terminating the session and redirecting to the login screen if no response is received.

### 2.2 Authorization & Role-Based Access Control (RBAC)
- **Central Role Registry (`backend/src/lib/roles.ts`):** 24 distinct healthcare roles organized into functional permission groups (`ADMIN_ROLES`, `STAFF_ROLES`, `DOCTOR_ROLES`, `LAB_ROLES`, `PHARMACY_ROLES`, `BILLING_ROLES`, `INSURANCE_ROLES`, `EMERGENCY_ROLES`, `TELEMEDICINE_ADMIN_ROLES`).
- **Role Normalization:** `normalizeRole(role)` trims and converts role strings to uppercase, preventing authorization bypasses caused by casing or whitespace inconsistencies.
- **Deactivated Account Enforcement:** Users with `is_active: false` in their `profiles` record are rejected immediately with `403 Forbidden` across all role-protected endpoints.
- **Super Admin Inheritance:** `SUPER_ADMIN` implicitly possesses access across all administrative and operational routes.

### 2.3 Object-Level Authorization & IDOR Mitigation
- **Medicine Reminders (`/api/reminders`):**
  - Reminders contain PHI (medication names and intake schedules).
  - Unauthenticated `GET /api/reminders` returns `401 Unauthorized`.
  - `GET`, `PUT`, and `DELETE` verify that the reminder's `patient_phone` or `profile_id` matches the authenticated caller's patient record. Cross-patient tampering attempts are rejected with `403 Forbidden`.
  - `POST /api/reminders` ignores any client-supplied `profile_id` in the request body, strictly linking the reminder to the verified session user.
- **Appointment Consent Workflow (`/api/appointments/:id/consent`):**
  - Patients can only consent to appointments linked to their verified `patient_id`.
  - Hospital staff consenting on behalf of patients must supply their `staff_pin` (matching the last 4 characters of their `employee_id`), creating an explicit audit trail.
- **Insurance Claims (`/api/insurance/create`):**
  - Non-staff users attempting to submit claims for other `patient_id` values are rejected with `403 Forbidden`.
- **Telemedicine Sessions (`/api/telemedicine/sessions`):**
  - Patients querying the endpoint are scoped strictly to their own `patient_id`.

### 2.4 Privacy-Preserving Public Endpoints
- **Public Appointment Tracking (`/api/appointments/track`):**
  - Lookup by phone number or email is blocked to eliminate patient enumeration vulnerabilities.
  - Queries must supply an exact `appointment_code`.
  - Responses strictly return non-sensitive public metadata (`appointment_reference`, `status`, `appointment_date`, `department`, `demo_data: true`). All PII (patient name, phone, email), medical data (symptoms, doctor notes, prescription text), and financial data are stripped.
- **Public Doctor Directory (`/api/admin/doctors`):**
  - Practitioner email addresses are purged recursively across all nesting levels before responses are returned to the browser.

### 2.5 Input Sanitization & Payload Protection
- **XSS & Injection Defense:**
  - Strict regex rejection `/[<>]/g` is applied to patient names, symptoms, prescription notes, contact messages, and reminder notes, returning `400 Bad Request` on any HTML or script tag injection attempts.
- **Field Length & Range Constraints:**
  - Age: Must be an integer between 0 and 149 (`0 <= age < 150`).
  - Phone: Normalized to digits, length enforced between 10 and 15 digits.
  - Email: Verified against RFC-compliant regex and capped at 254 characters.
  - Contact Messages: Subject capped at 255 chars, message at 5,000 chars.
- **Payload Limits:**
  - Global Express JSON parser limit set to `10MB`.
  - Dedicated middleware on `/api/contact` limits body size to `100KB` (`413 Payload Too Large`).
  - Syntax errors in JSON payloads are caught by Express error middleware returning `400 Malformed JSON payload` without exposing stack traces.

### 2.6 Authoritative Server-Side Pricing (E-Pharmacy)
- In `POST /api/pharmacy/orders`, order totals and line-item prices submitted from the client are discarded. The server queries authoritative unit prices from the `medicines` database table and recalculates the grand total, preventing cart price manipulation.

### 2.7 Payment Security & Gateway Verification
- **HMAC-SHA256 Cryptographic Verification:** `POST /api/payment/verify` computes `crypto.createHmac("sha256", secret).update(`${order_id}|${payment_id}`).digest("hex")` and validates against `razorpay_signature`.
- **Payment Idempotency:** `paymentAlreadyRecorded(razorpay_payment_id)` verifies whether a payment ID has already been logged in the `payments` table, preventing double-crediting.
- **Fail-Closed Runtime Configuration (`backend/src/lib/config.ts`):**
  - `PAYMENT_MODE=mock` is prohibited when `APP_ENV=production` or `NODE_ENV=production`.
  - Server startup aborts if Razorpay API keys are missing when running in `razorpay` mode.
  - `POST /api/payment/settings` is permanently disabled (`400 Bad Request`), preventing runtime secret overrides through the API.

### 2.8 Rate Limiting & Denial-of-Service Defense
- `apiLimiter`: 1,000 requests per minute per IP on all `/api/*` endpoints.
- `authLimiter`: 500 requests per 15 minutes per IP on patient registration and authentication endpoints.
- `bookingLimiter`: 500 requests per 10 minutes per IP on public appointment booking endpoints.
- `requestTimeout`: 30-second execution deadline on all API requests.

### 2.9 Row Level Security (RLS) & Storage Hardening
- RLS enabled on all core tables: `profiles`, `patients`, `appointments`, `prescriptions`, `lab_tests`, `lab_reports`, `medical_records`, `invoices`, `payments`, `insurance_claims`, `consent_audit_log`.
- `lab-reports` Supabase storage bucket configured with public read access and staff-only upload/delete policies.
- `consent_audit_log` table contains no `UPDATE` or `DELETE` RLS policies, ensuring patient consent actions remain immutable and tamper-evident.

---

## 3. Automated Security Test Suite (`backend/test/security.test.ts`)

The backend includes a dedicated, automated in-memory security test suite with 18 comprehensive assertions:

| # | Test Suite Category | Test Assertion | Tested Route | Security Vector | Test Result |
|---|---|---|---|---|---|
| 1 | Medicine Reminders | Unauthenticated GET returns 401 | `GET /api/reminders` | Authentication Enforcement | PASS |
| 2 | Medicine Reminders | Patient sees only their own reminders | `GET /api/reminders` | Tenant Data Isolation | PASS |
| 3 | Medicine Reminders | Patient cannot read another patient's reminders | `GET /api/reminders` | IDOR Protection | PASS |
| 4 | Medicine Reminders | Public unauthenticated POST creates unlinked reminder | `POST /api/reminders` | Anonymous Flow Security | PASS |
| 5 | Medicine Reminders | Cannot attach another user's profile ID via body | `POST /api/reminders` | Parameter Injection Defense | PASS |
| 6 | Medicine Reminders | Unauthenticated PUT returns 401 | `PUT /api/reminders/:id` | Authentication Enforcement | PASS |
| 7 | Medicine Reminders | Cross-patient PUT returns 403 Forbidden | `PUT /api/reminders/:id` | IDOR Mutation Defense | PASS |
| 8 | Medicine Reminders | PUT on unowned anonymous reminder returns 403 | `PUT /api/reminders/:id` | Anonymous Record Protection | PASS |
| 9 | Medicine Reminders | PUT on own reminder returns 200 OK | `PUT /api/reminders/:id` | Valid Ownership Flow | PASS |
| 10 | Medicine Reminders | Unauthenticated DELETE returns 401 | `DELETE /api/reminders/:id` | Authentication Enforcement | PASS |
| 11 | Medicine Reminders | Cross-patient DELETE returns 403 Forbidden | `DELETE /api/reminders/:id` | IDOR Deletion Defense | PASS |
| 12 | Medicine Reminders | DELETE on own reminder returns 200 OK | `DELETE /api/reminders/:id` | Valid Ownership Flow | PASS |
| 13 | Public Tracking | Returns only allowed minimal public fields | `POST /api/appointments/track` | Public Data Boundary | PASS |
| 14 | Public Tracking | Never leaks prescription, lab URL, symptoms, or PII | `POST /api/appointments/track` | PHI Leakage Prevention | PASS |
| 15 | Public Tracking | Tracking without reference returns 400 Bad Request | `POST /api/appointments/track` | Input Validation | PASS |
| 16 | Public Tracking | Lookup by phone returns 404 (prevents enumeration) | `POST /api/appointments/track` | User Enumeration Defense | PASS |
| 17 | Patient Consent | Unauthenticated consent action returns 401 | `POST /api/appointments/:id/consent` | Authentication Enforcement | PASS |
| 18 | Patient Consent | Cross-patient consent action returns 403 Forbidden | `POST /api/appointments/:id/consent` | IDOR Consent Defense | PASS |
| 19 | Patient Consent | Owner consent writes immutable audit entry | `POST /api/appointments/:id/consent` | Non-repudiation Audit | PASS |
| 20 | Staff Consent | Staff consent without PIN returns 400 Bad Request | `POST /api/appointments/:id/consent` | Staff Identity Verification | PASS |
| 21 | Staff Consent | Staff consent with incorrect PIN returns 403 Forbidden| `POST /api/appointments/:id/consent` | Staff PIN Enforcement | PASS |
| 22 | Staff Consent | Staff consent with valid PIN returns 200 OK | `POST /api/appointments/:id/consent` | Valid Staff Proxy Consent | PASS |
| 23 | Staff Consent | Inactive staff member consent rejected with 403 | `POST /api/appointments/:id/consent` | Deactivated Account Defense | PASS |

---

## 4. Security Issue & Hardening Summary Table

| Security Area | Severity | Potential Risk / Vulnerability | Hardening Action / Implemented Fix | Verification Status |
|---|---|---|---|---|
| **PHI Leakage in Public Tracking** | **High** | Public lookup could expose patient names, symptoms, and medical notes | Restricted tracking to exact booking code; stripped all PII, symptoms, doctor names, and prescriptions from public response | Verified in Code & Tests |
| **IDOR in Medicine Reminders** | **High** | Attackers could view, alter, or delete other patients' prescription schedules | Added ownership verification checks comparing JWT `user.id` against linked patient profile; blocked body injection of `profile_id` | Verified in Code & Tests |
| **E-Pharmacy Price Tampering** | **High** | Malicious users could alter item prices in client-side cart requests | Server re-fetches authoritative unit prices from `medicines` table and computes grand total server-side | Verified in Code |
| **Cross-Site Scripting (XSS)** | **Medium** | Stored script injection via patient name, symptoms, or inquiry messages | Global input validation rejects any input containing `<` or `>` characters across all endpoints (`/[<>]/g`) | Verified in Code |
| **Insecure Payment Mode in Prod** | **Critical** | Silent fallback to mock payments in production environments | Fail-closed configuration check in `config.ts` crashes startup if `PAYMENT_MODE=mock` without `DEMO_MODE=true` or in production | Verified in Code |
| **Payment Secret API Exposure** | **Critical** | Runtime modification or exposure of gateway secret keys via REST API | `POST /api/payment/settings` disabled (`400`); `GET /api/payment/settings` strictly omits secret keys | Verified in Code |
| **Staff Impersonation in Consent** | **Medium** | Unauthorized staff members approving clinical consent without verification | Enforced staff PIN verification (last 4 characters of `employee_id`) and active profile validation | Verified in Code & Tests |
| **DDoS & Brute Force Attacks** | **Medium** | Unrestricted request flooding on booking, contact, and registration routes | Implemented tiered rate limiting (`apiLimiter`, `authLimiter`, `bookingLimiter`) and 30s request timeouts | Verified in Code |
| **Shared Workstation Hijacking** | **Medium** | Unattended hospital terminal remaining logged in | Implemented client-side activity listener with 30s warning countdown modal and automatic sign-out | Verified in Code |
