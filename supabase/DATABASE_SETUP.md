# MEDILINK Database Setup & Initialization Procedure

This document provides step-by-step instructions on setting up, migrating, and seeding the PostgreSQL database using Supabase for the MEDILINK trial/UAT environment.

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:
1. **PostgreSQL Client Tools** (`psql` must be available in your system's `PATH`).
   - *Windows:* Install PostgreSQL and add `C:\Program Files\PostgreSQL\<version>\bin` to your System PATH env variables.
   - *Linux/macOS:* Install via your package manager (e.g., `sudo apt install postgresql-client` or `brew install postgresql`).
2. **A Supabase Project Instance** (either hosted on supabase.com or running locally via Docker).
3. **Database Connection URI:** You will need your project's direct Postgres connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

---

## Environment Configuration

Configure the connection string in your backend environment file:

1. Open `backend/.env` (or copy from `backend/.env.example`).
2. Add or update the `SUPABASE_DB_URL` variable with your direct Postgres URI:
   ```env
   SUPABASE_DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   ```

---

## Option A: Automated Database Setup & Reset

Automated scripts are provided for both Windows and Linux environments. These scripts connect to the database, truncate existing tables, execute all migrations (001, 002, 003), and apply the UAT seed data.

> [!WARNING]
> **Safety Guardrails:** To protect production records, these scripts will automatically abort if the target database connection string contains the keyword `prod`. Additionally, they will require you to type `yes` interactively to confirm the database wipe before executing.

### On Windows (PowerShell)
Execute the PowerShell script from the root directory:
```powershell
cd supabase
.\reset-db.ps1
```
*(If you need to override the environment variable, you can pass it directly: `.\reset-db.ps1 -DatabaseUrl "postgresql://..."`)*

### On Linux / macOS (Bash)
Make the script executable and run it:
```bash
cd supabase
chmod +x reset-db.sh
./reset-db.sh
```

---

## Option B: Manual Setup (Step-by-Step)

If you prefer to run the setup manually using `psql`, execute the following commands in order from the repository root:

### 1. Apply Migrations
Run the versioned migration scripts in sequential order to build the schema, constraints, indices, and RLS policies:
```bash
# 001 - Initial Schema & Core Tables
psql "[YOUR_DATABASE_URL]" -f supabase/migrations/001_initial_schema.sql

# 002 - Schema Alignments
psql "[YOUR_DATABASE_URL]" -f supabase/migrations/002_align_backend_schema.sql

# 003 - Security Hardening & Storage Setup
psql "[YOUR_DATABASE_URL]" -f supabase/migrations/003_security_hardening.sql
```

### 2. Populate UAT Seed Data
Load trial/sample records (including patients, doctors, appointments, medical records, medicines, and notifications) into the tables:
```bash
psql "[YOUR_DATABASE_URL]" -f supabase/seed/uat_seed_data.sql
```

---

## Verifying Setup

Once initialized, verify the setup by running:
```bash
psql "[YOUR_DATABASE_URL]" -c "\dt"
```
Ensure all application tables (such as `profiles`, `patients`, `appointments`, `notifications`, `medicine_reminders`, `consent_audit_log`, and `storage.buckets`) are present and populated.
