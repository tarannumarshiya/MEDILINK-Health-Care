#!/usr/bin/env bash
# ============================================================
# MEDILINK Database Reset Script (UAT / Dev)
#
# Usage:
#   ./reset-db.sh                              # uses backend/.env SUPABASE_DB_URL
#   ./reset-db.sh "postgresql://..."           # explicit connection string
#   DRY_RUN=1 ./reset-db.sh                    # preview SQL without executing
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---------------------------------------------------------------------------
# Resolve connection string
# ---------------------------------------------------------------------------
DATABASE_URL="${1:-}"
if [ -z "$DATABASE_URL" ]; then
  ENV_FILE="$ROOT_DIR/backend/.env"
  if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: No connection string provided and backend/.env not found."
    echo "Usage: $0 <postgresql://...>"
    exit 1
  fi
  DATABASE_URL=$(grep -E '^SUPABASE_DB_URL=' "$ENV_FILE" | cut -d'=' -f2- | tr -d ' "' || true)
  if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: SUPABASE_DB_URL not found in backend/.env"
    echo "Set SUPABASE_DB_URL or pass the connection string as the first argument."
    exit 1
  fi
fi

# Validate psql
if ! command -v psql &>/dev/null; then
  echo "ERROR: psql not found. Install PostgreSQL client."
  exit 1
fi

DRY_RUN="${DRY_RUN:-0}"

# ---------------------------------------------------------------------------
# SQL fragments
# ---------------------------------------------------------------------------

APP_TABLES=(
  "consent_audit_log"
  "audit_logs"
  "notifications"
  "payments"
  "insurance_claims"
  "insurance_policies"
  "lab_reports"
  "lab_tests"
  "prescription_items"
  "prescriptions"
  "medicine_reminders"
  "pharmacy_public_orders"
  "pharmacy_questions"
  "telemedicine_sessions"
  "emergency_sos_requests"
  "emergency_cases"
  "beds"
  "medical_records"
  "walk_in_queue"
  "walk_ins"
  "contact_messages"
  "appointments"
  "doctors"
  "medicines"
  "vendors"
  "patients"
  "departments"
  "profiles"
)

TABLE_LIST=$(IFS=,; echo "${APP_TABLES[*]}")

TRUNCATE_SQL="SET session_replication_role = 'replica';"
TRUNCATE_SQL="${TRUNCATE_SQL} TRUNCATE TABLE ${TABLE_LIST} RESTART IDENTITY CASCADE;"
TRUNCATE_SQL="${TRUNCATE_SQL} SET session_replication_role = 'origin';"

# ---------------------------------------------------------------------------
# Execute helper
# ---------------------------------------------------------------------------
run_sql() {
  local description="$1"
  local sql="$2"
  echo "  >> $description"
  if [ "$DRY_RUN" = "1" ]; then
    echo "     [DRY RUN - not executed]"
    return 0
  fi
  echo "$sql" | psql "$DATABASE_URL" 2>&1 || true
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
echo ""
echo "===================================================="
echo "  MEDILINK Database Reset (UAT)"
echo "===================================================="
echo ""

echo "[1/5] Truncating application tables..."
run_sql "Truncate all application data (preserving auth.users)" "$TRUNCATE_SQL"

echo ""
echo "[2/5] Applying migration 001_initial_schema.sql ..."
run_sql "001_initial_schema" "$(cat "$SCRIPT_DIR/migrations/001_initial_schema.sql")"

echo ""
echo "[3/5] Applying migration 002_align_backend_schema.sql ..."
run_sql "002_align_backend_schema" "$(cat "$SCRIPT_DIR/migrations/002_align_backend_schema.sql")"

echo ""
echo "[4/5] Applying migration 003_security_hardening.sql ..."
run_sql "003_security_hardening" "$(cat "$SCRIPT_DIR/migrations/003_security_hardening.sql")"

echo ""
echo "[5/5] Loading seed data (uat_seed_data.sql) ..."
run_sql "Seed data" "$(cat "$SCRIPT_DIR/seed/uat_seed_data.sql")"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "===================================================="
echo "  Reset complete!"
echo ""
echo "  Demo accounts (email / password):"
echo "    patient@demo.com      / Demo123!      (PATIENT)"
echo "    john@demo.com         / Demo123!      (PATIENT)"
echo "    sarah@demo.com        / Demo123!      (PATIENT)"
echo "    admin@demo.com        / Admin123!     (ADMIN)"
echo "    doctor@demo.com       / Doctor123!    (DOCTOR)"
echo "    nurse@demo.com        / Nurse123!     (NURSE)"
echo "    reception@demo.com    / Reception123! (RECEPTIONIST)"
echo "    pharmacist@demo.com   / Pharm123!     (PHARMACIST)"
echo "    lab@demo.com          / Lab123!       (LAB_TECHNICIAN)"
echo "    billing@demo.com      / Billing123!   (BILLING)"
echo "    insurance@demo.com    / Insurance123! (INSURANCE_STAFF)"
echo "    emergency@demo.com    / Emergency123! (EMERGENCY_STAFF)"
echo "    superadmin@demo.com   / Super123!     (SUPER_ADMIN)"
echo "===================================================="
echo ""
