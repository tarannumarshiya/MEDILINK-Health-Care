# MEDILINK Healthcare — Testing Supporting Artifacts Report

**Documentation Status:** Final  
Documentation reflects the current implementation, validation results, resolved observations, supporting evidence, and remaining project items as verified during the final documentation review.

**Document Title:** Testing Supporting Artifacts & Evidence Directory  
**Project Name:** MEDILINK Digital Health Care  
**Repository:** `medilink-healthcare`  
**Document Version:** 1.0.0  
**Date of Documentation:** August 11, 2026  

---

## 1. Evidence Overview

This document indexes all verifiable technical artifacts, automated test suites, API specifications, database migration scripts, configuration manifests, and validation records supporting the resolution of HPE observations and functional testing results.

### Available Evidence Categories
1. **Automated Security Regression Test Suite:** `backend/test/security.test.ts` (18 in-memory assertions covering IDOR, PII leakage, staff consent PINs, and RBAC).
2. **Interactive OpenAPI 3.0 Specification:** `backend/src/openapi.json` (Swagger documentation covering 50+ REST endpoints).
3. **Database Schema Migrations & Seed Data:** `supabase/migrations/` (001, 002, 003) and `supabase/seed/uat_seed_data.sql` (13 idempotent demo user accounts).
4. **Database Automation Tooling:** `supabase/reset-db.ps1` and `supabase/reset-db.sh` with production safety guardrails.
5. **Container & Deployment Manifests:** `backend/Dockerfile`, `frontend/Dockerfile`, `render.yaml`, `vercel.json`.
6. **Technical Documentation Suite:** Complete 9-document technical and audit documentation library in `docs/`.

---

## 2. Screenshot Evidence

| Evidence ID | Module / Screen | Description | File Path | Related HPE Observation / Test | Status |
|---|---|---|---|---|---|
| N/A | Global UI | Visual screenshot capture | Not Available | Global UI Testing | Not available in the repository. |

Screenshot binary image files are not stored directly within the repository. Visual validation was conducted via comprehensive React/Next.js TSX component code inspection, JSX layout structure analysis, Tailwind CSS design token verification, and prop contract auditing.

---

## 3. Automated Test Evidence

| Test Suite / Script | Location | Type | Test Cases / Assertions | Execution Command | Result / Status |
|---|---|---|---|---|---|
| **Security Regression Suite** | `backend/test/security.test.ts` | In-memory Automated Suite | 18 Assertions (IDOR, PHI Leakage, Consent PIN, RBAC) | `npm run test:security` | 18 Passed, 0 Failed (Verified) |
| **API Contract Validation** | `backend/src/openapi.json` | OpenAPI 3.0 Schema | 50+ REST Endpoints across 16 Routers | Swagger UI at `/api-docs` | Verified |
| **Database Schema Alignment** | `supabase/migrations/` | PostgreSQL DDL Migrations | 28 Tables, Foreign Keys, Indexes, Check Constraints | `reset-db.ps1` / `reset-db.sh` | Verified |
| **UAT Seed Dataset** | `supabase/seed/uat_seed_data.sql` | SQL Idempotent Seed Data | 13 Demo User Accounts across All Roles | `psql -f uat_seed_data.sql` | Verified |

---

## 4. API Testing Evidence

| Endpoint | Method | Test Vector | Expected Output | Observed Output | Result |
|---|---|---|---|---|---|
| `/health` | `GET` | System Health Check | HTTP 200 `{ status: "ok" }` | Returns status ok and uptime | Passed |
| `/api/appointments/create` | `POST` | Public Patient Booking | HTTP 200 with generated APT code | Generated APT-XXXX code returned | Passed |
| `/api/appointments/track` | `POST` | Public Code Tracking | HTTP 200 with non-sensitive fields | PII stripped, minimal status returned | Passed |
| `/api/appointments/track` | `POST` | Phone Number Lookup | HTTP 404 Not Found | 404 returned (enumeration blocked) | Passed |
| `/api/reminders` | `GET` | Unauthenticated Request | HTTP 401 Unauthorized | 401 Unauthorized returned | Passed |
| `/api/reminders/:id` | `PUT` | Cross-tenant IDOR Update | HTTP 403 Forbidden | 403 Forbidden returned | Passed |
| `/api/appointments/:id/consent` | `POST` | Staff Consent with PIN | HTTP 200 with audit entry | Consent approved and logged in DB | Passed |
| `/api/pharmacy/orders` | `POST` | Cart Checkout (Price Check) | HTTP 200 with DB recalculated total | Server-side unit prices enforced | Passed |
| `/api/admin/doctors` | `GET` | Public Doctor Directory | HTTP 200 without email fields | Doctor list returned with emails stripped | Passed |
| `/api/payment/verify` | `POST` | Razorpay HMAC Verification | HTTP 200 with invoice marked PAID | HMAC validated, payment recorded | Passed |

---

## 5. Build, Lint & Type-Check Verification

| Validation Step | Target Workspace | Command | Purpose | Verification Result |
|---|---|---|---|---|
| **TypeScript Compilation** | Backend & Frontend | `npm run typecheck` | Validates TypeScript types across the monorepo | Clean Type Definitions (Verified) |
| **ESLint Static Analysis** | Backend & Frontend | `npm run lint` | Checks code formatting, unused variables, and imports | Code Quality Validated (Verified) |
| **Production Build** | Monorepo Root | `npm run build` | Builds Express backend & Next.js production bundle | Production Bundle Ready (Verified) |
| **Dependency Manifests** | Root, Backend, Frontend | `package.json` & `package-lock.json` | Lockfile dependency resolution integrity | Consistent Lockfiles (Verified) |

---

## 6. Supporting Project Artifacts Directory

| Artifact Category | Relative Path | Purpose | Integrity Status |
|---|---|---|---|
| **Backend Entrypoint** | `backend/src/index.ts` | Express server setup, middleware pipeline, route registration | Verified |
| **Backend Configuration** | `backend/src/lib/config.ts` | Environment variables, fail-closed runtime safety guards | Verified |
| **Role Registry** | `backend/src/lib/roles.ts` | 24 role definitions, role groupings, uppercase normalization | Verified |
| **Auth Middleware** | `backend/src/middleware/auth.ts` | JWT bearer token verification, inactive account blocking | Verified |
| **Idempotency Middleware** | `backend/src/middleware/idempotency.ts` | Request deduplication cache by `Idempotency-Key` header | Verified |
| **OpenAPI Specification** | `backend/src/openapi.json` | Complete Swagger 3.0 API documentation | Verified |
| **Automated Test Suite** | `backend/test/security.test.ts` | 18 in-memory automated security regression assertions | Verified |
| **Initial Migration** | `supabase/migrations/001_initial_schema.sql` | Base PostgreSQL schema definitions | Verified |
| **Schema Alignment** | `supabase/migrations/002_fix_schema_drift.sql` | Fixes missing tables, constraints, consent audit log | Verified |
| **Storage Hardening** | `supabase/migrations/003_storage_buckets.sql` | `lab-reports` bucket and RLS policies | Verified |
| **UAT Seed Script** | `supabase/seed/uat_seed_data.sql` | 13 idempotent demo user accounts | Verified |
| **PowerShell Reset Tool** | `supabase/reset-db.ps1` | Database rebuild automation with production safety check | Verified |
| **Bash Reset Tool** | `supabase/reset-db.sh` | Linux/macOS database rebuild automation | Verified |
| **Frontend Shell** | `frontend/src/components/DashboardShell.tsx` | Role dashboard layout, mobile drawer, idle auto-logout | Verified |
| **Payment UI Modal** | `frontend/src/components/payment/PaymentModal.tsx` | Razorpay checkout and dynamic UPI QR code modal | Verified |
| **Design Tokens** | `frontend/src/app/globals.css` | OKLCH colors, theme tokens, typography, glassmorphism | Verified |
| **Cloud Deployment (API)**| `render.yaml` | Render cloud deployment manifest for Express API | Verified |
| **Cloud Deployment (UI)** | `vercel.json` | Vercel cloud deployment manifest for Next.js frontend | Verified |

---

## 7. Evidence Gaps & Non-Repository Items

The following items are external and not stored directly as static repository files:
- **Screenshots:** Visual UI validation was performed via component TSX inspection.
- **Live Carrier SMS / WhatsApp Delivery Receipts:** Handled via simulated logger in trial mode; pending live carrier provisioning.
- **Real-Money Banking Settlement Slips:** Validated via HMAC-SHA256 mock simulator; live payment capture pending merchant KYC.
