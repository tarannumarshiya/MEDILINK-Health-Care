<#
.SYNOPSIS
  Resets the MEDILINK UAT database to a clean state.

.DESCRIPTION
  1. Truncates all application tables (preserving auth.users).
  2. Re-runs the migration files (idempotent).
  3. Re-runs the seed data (idempotent).
  4. Prints a summary.

.PARAMETER DatabaseUrl
  Supabase Postgres connection string (postgresql://...).
  Falls back to NEXT_PUBLIC_SUPABASE_URL from .env.

.PARAMETER DryRun
  Show the SQL commands without executing them.

.EXAMPLE
  .\reset-db.ps1
  .\reset-db.ps1 -DatabaseUrl "postgresql://postgres:password@db.xyz.supabase.co:5432/postgres"
#>

param(
  [string]$DatabaseUrl,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

# ---------------------------------------------------------------------------
# Resolve connection string
# ---------------------------------------------------------------------------
if (-not $DatabaseUrl) {
  $envFile = Join-Path $root "backend\.env"
  if (-not (Test-Path $envFile)) {
    Write-Error "No -DatabaseUrl provided and backend\.env not found. Supply the connection string."
    exit 1
  }
  $envContent = Get-Content $envFile -Raw
  # Try NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_URL
  if ($envContent -match 'SUPABASE_DB_URL\s*=\s*(.+?)\s*') {
    $DatabaseUrl = $matches[1]
  } elseif ($envContent -match 'NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+?)\s*') {
    # Convert Supabase project URL to Postgres connection string
    $projectUrl = $matches[1] -replace 'https://', '' -replace '\.supabase\.co.*', ''
    Write-Warning "NEXT_PUBLIC_SUPABASE_URL found but SUPABASE_DB_URL is needed."
    Write-Warning "Set SUPABASE_DB_URL in backend\.env or pass -DatabaseUrl."
    exit 1
  } else {
    Write-Error "SUPABASE_DB_URL not found in backend\.env. Set it or pass -DatabaseUrl."
    exit 1
  }
}

# Validate psql is available
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  Write-Error "psql not found in PATH. Install PostgreSQL client or add it to PATH."
  exit 1
}

# ---------------------------------------------------------------------------
# SQL fragments
# ---------------------------------------------------------------------------

# All application tables (order respects FKs)
$truncateTables = @(
  "audit_logs",
  "notifications",
  "payments",
  "insurance_claims",
  "insurance_policies",
  "lab_reports",
  "lab_tests",
  "prescription_items",
  "prescriptions",
  "medicine_reminders",
  "pharmacy_public_orders",
  "pharmacy_questions",
  "telemedicine_sessions",
  "emergency_sos_requests",
  "emergency_cases",
  "beds",
  "medical_records",
  "walk_in_queue",
  "walk_ins",
  "contact_messages",
  "appointments",
  "doctors",
  "medicines",
  "vendors",
  "patients",
  "departments",
  "profiles"
) -join ", "

$truncateSql = @"
SET session_replication_role = 'replica';
TRUNCATE TABLE $truncateTables RESTART IDENTITY CASCADE;
SET session_replication_role = 'origin';
"@

# ---------------------------------------------------------------------------
# Execute helper
# ---------------------------------------------------------------------------
function Invoke-Sql($sql, $description) {
  Write-Host "  >> $description" -ForegroundColor Cyan
  if ($DryRun) {
    Write-Host "     [DRY RUN - not executed]" -ForegroundColor Yellow
    return
  }
  $result = $sql | psql $DatabaseUrl 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "  !! SQL command returned exit code $LASTEXITCODE"
    Write-Host $result
  }
}

# ---------------------------------------------------------------------------
# Step 1: Truncate
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "  MEDILINK Database Reset (UAT)" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "[1/4] Truncating application tables..." -ForegroundColor Yellow
Invoke-Sql $truncateSql "Truncate all application data (preserving auth.users)"

# ---------------------------------------------------------------------------
# Step 2: Migration 001
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "[2/4] Applying migration 001_initial_schema.sql ..." -ForegroundColor Yellow
$migration1 = Get-Content (Join-Path $PSScriptRoot "migrations\001_initial_schema.sql") -Raw
Invoke-Sql $migration1 "001_initial_schema"

# ---------------------------------------------------------------------------
# Step 3: Migration 002
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "[3/4] Applying migration 002_align_backend_schema.sql ..." -ForegroundColor Yellow
$migration2 = Get-Content (Join-Path $PSScriptRoot "migrations\002_align_backend_schema.sql") -Raw
Invoke-Sql $migration2 "002_align_backend_schema"

# ---------------------------------------------------------------------------
# Step 4: Seed
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "[4/4] Loading seed data (uat_seed_data.sql) ..." -ForegroundColor Yellow
$seed = Get-Content (Join-Path $PSScriptRoot "seed\uat_seed_data.sql") -Raw
Invoke-Sql $seed "Seed data"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "  Reset complete!" -ForegroundColor Green
Write-Host ""
Write-Host "  Demo accounts (email / password):"
Write-Host "    patient@demo.com      / Demo123!      (PATIENT)"
Write-Host "    john@demo.com         / Demo123!      (PATIENT)"
Write-Host "    sarah@demo.com        / Demo123!      (PATIENT)"
Write-Host "    admin@demo.com        / Admin123!     (ADMIN)"
Write-Host "    doctor@demo.com       / Doctor123!    (DOCTOR)"
Write-Host "    nurse@demo.com        / Nurse123!     (NURSE)"
Write-Host "    reception@demo.com    / Reception123! (RECEPTIONIST)"
Write-Host "    pharmacist@demo.com   / Pharm123!     (PHARMACIST)"
Write-Host "    lab@demo.com          / Lab123!       (LAB_TECHNICIAN)"
Write-Host "    billing@demo.com      / Billing123!   (BILLING)"
Write-Host "    insurance@demo.com    / Insurance123! (INSURANCE_STAFF)"
Write-Host "    emergency@demo.com    / Emergency123! (EMERGENCY_STAFF)"
Write-Host "    superadmin@demo.com   / Super123!     (SUPER_ADMIN)"
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
