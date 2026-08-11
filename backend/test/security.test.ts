/**
 * Automated security regression tests for the P0 medicine-reminder, public
 * appointment-tracking and consent workflows.
 *
 * The real Supabase client is replaced with an IN-MEMORY mock via the
 * injectable seams in lib/supabase.ts. This suite never connects to or writes
 * to the real database. Seed data is created fresh each run and discarded.
 *
 * Run:  npm run test:security
 */

import assert from "node:assert";
import express from "express";
import { Server } from "node:http";

const fakeEnv: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:9",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
  PAYMENT_MODE: "mock",
  DEMO_MODE: "true",
  APP_ENV: "development",
};

async function bootstrap() {
  // Must be set BEFORE importing any backend module (config caches on load).
  for (const [k, v] of Object.entries(fakeEnv)) process.env[k] = v;

  const supabase = await import("../src/lib/supabase");
  const { default: remindersRouter } = await import("../src/routes/reminders");
  const { default: appointmentsRouter } = await import("../src/routes/appointments");

  return {
    remindersRouter,
    appointmentsRouter,
    ___setServiceOverrideForTests: supabase.__setServiceOverrideForTests,
    ___setRequestFactoryForTests: supabase.__setRequestFactoryForTests,
  };
}

/* ========================================================================== */
/*  Minimal fluent mock of @supabase/supabase-js                              */
/* ========================================================================== */

type Row = Record<string, any>;

class TableQuery {
  private tbl: MockTable;
  private kind: "arrange" | "insert" | "update" | "delete" = "arrange";
  private equivs: Array<[string, any]> = [];
  private ors: Array<[string, any]> = [];
  private orderBy: [string, boolean] | null = null;
  private writes: Row[] = [];

  constructor(tbl: MockTable) {
    this.tbl = tbl;
  }
  select(_cols?: string) {
    return this;
  }
  eq(col: string, value: any) {
    this.equivs.push([col, value]);
    return this;
  }
  or(filter: string) {
    for (const term of filter.split(",")) {
      const [col, value] = term.split(".eq.");
      if (col) this.ors.push([col, value]);
    }
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderBy = [col, opts?.ascending !== false];
    return this;
  }
  limit(_n: number) {
    return this;
  }
  insert(values: Row | Row[]) {
    this.kind = "insert";
    this.writes = Array.isArray(values) ? values : [values];
    return this;
  }
  update(values: Row) {
    this.kind = "update";
    this.writes = [values];
    return this;
  }
  delete() {
    this.kind = "delete";
    return this;
  }

  private match(row: Row): boolean {
    for (const [col, val] of this.equivs) {
      if (row[col] !== val) return false;
    }
    if (this.ors.length && !this.ors.some(([col, val]) => row[col] === val)) {
      return false;
    }
    return true;
  }

  private arranged(): Row[] {
    let rows = this.tbl.rows.filter((r) => this.match(r));
    if (this.orderBy) {
      const [col, asc] = this.orderBy;
      rows = rows.sort((a, b) =>
        a[col] === b[col] ? 0 : asc ? (a[col] > b[col] ? 1 : -1) : a[col] < b[col] ? 1 : -1
      );
    }
    return rows;
  }

  private rows(): Row[] {
    if (this.kind === "insert") {
      const created: Row[] = [];
      for (const w of this.writes) {
        const row = { ...w };
        if (row.id === undefined) row.id = `gen-${Math.random().toString(36).slice(2)}`;
        this.tbl.rows.push(row);
        created.push(row);
      }
      return created;
    }
    if (this.kind === "update") {
      const patch = this.writes[0];
      const updated: Row[] = [];
      for (let i = 0; i < this.tbl.rows.length; i++) {
        if (this.match(this.tbl.rows[i])) {
          this.tbl.rows[i] = { ...this.tbl.rows[i], ...patch };
          updated.push(this.tbl.rows[i]);
        }
      }
      return updated;
    }
    if (this.kind === "delete") {
      const doomed = this.arranged();
      doomed.forEach((r) => this.tbl.rows.splice(this.tbl.rows.indexOf(r), 1));
      return doomed;
    }
    return this.arranged();
  }

  maybeSingle() {
    const rows = this.rows();
    if (rows.length === 0) return { data: null, error: null };
    if (rows.length > 1) return { data: rows[0], error: new Error("more than one row") };
    return { data: rows[0], error: null };
  }
  single() {
    const rows = this.rows();
    if (rows.length !== 1) return { data: null, error: new Error("expected exactly one row") };
    return { data: rows[0], error: null };
  }

  // Make the whole chain awaitable exactly like the real SDK, so
  // `await client.from(t).select()...` resolves to `{ data, error }`.
  then(resolve?: (v: any) => any, reject?: (e: any) => any) {
    const result = Promise.resolve().then(() => ({
      data: this.rows(),
      error: null,
    }));
    return result.then(resolve, reject);
  }
}

class MockTable {
  rows: Row[] = [];
  query(): TableQuery {
    return new TableQuery(this);
  }
}

class MockAuth {
  userId: string | null = null;
  setUser(id: string | null) {
    this.userId = id;
  }
  getUser() {
    if (!this.userId) return { data: { user: null }, error: new Error("invalid token") };
    return { data: { user: { id: this.userId, email: `${this.userId}@x.io` } }, error: null };
  }
}

class MockSupabaseClient {
  tables: Record<string, MockTable> = {};
  auth = new MockAuth();

  constructor(seed: Record<string, Row[]>) {
    for (const [name, rows] of Object.entries(seed)) {
      const t = new MockTable();
      t.rows = rows.map((r) => ({ ...r }));
      this.tables[name] = t;
    }
  }
  from(name: string): TableQuery {
    if (!this.tables[name]) this.tables[name] = new MockTable();
    return this.tables[name].query();
  }
}

/* ========================================================================== */
/*  Seed data                                                                 */
/* ========================================================================== */

const SEED: Record<string, Row[]> = {
  profiles: [
    { id: "p-a", role: "PATIENT", is_active: true, full_name: "Alice", email: "a@x.io", employee_id: null },
    { id: "p-b", role: "PATIENT", is_active: true, full_name: "Bob", email: "b@x.io", employee_id: null },
    { id: "p-doc", role: "DOCTOR", is_active: true, full_name: "Dr. X", email: "d@x.io", employee_id: "EMP-0099" },
    { id: "p-doc-off", role: "DOCTOR", is_active: false, full_name: "Dr. Off", email: "z@x.io", employee_id: "EMP-0098" },
  ],
  patients: [
    { id: "patient-a", profile_id: "p-a", phone: "1111111111" },
    { id: "patient-b", profile_id: "p-b", phone: "2222222222" },
  ],
  medicine_reminders: [
    { id: "rem-a1", profile_id: "p-a", patient_phone: "1111111111", medicine_name: "Med A", frequency: "daily", next_reminder_date: "2026-01-02", is_active: true },
    { id: "rem-b1", profile_id: "p-b", patient_phone: "2222222222", medicine_name: "Med B", frequency: "weekly", next_reminder_date: "2026-01-02", is_active: true },
    { id: "rem-anon", profile_id: null, patient_phone: "9999999999", medicine_name: "Anon", frequency: "monthly", next_reminder_date: "2026-01-02", is_active: true },
  ],
  appointments: [
    { id: "apt-a", appointment_code: "APT-TEST-100001", patient_id: "patient-a", patient_name: "Alice", patient_phone: "1111111111", patient_email: "a@x.io", department: "Cardiology", preferred_date: "2026-08-10", symptoms: "chest pain", prescription_text: "leaked rx", lab_report_url: "https://secret", status: "PENDING_PATIENT_APPROVAL", lab_required: false, created_at: "2026-08-01T00:00:00Z" },
    { id: "apt-b", appointment_code: "APT-TEST-200002", patient_id: "patient-b", patient_name: "Bob", patient_phone: "2222222222", patient_email: "b@x.io", department: "Ortho", preferred_date: "2026-08-12", symptoms: "knee", status: "PENDING_PATIENT_APPROVAL", lab_required: false, created_at: "2026-08-02T00:00:00Z" },
    { id: "apt-c", appointment_code: "APT-TEST-300003", patient_id: "patient-b", patient_name: "Bob", patient_phone: "2222222222", patient_email: "b@x.io", department: "Cardio", preferred_date: "2026-08-14", symptoms: "bp", status: "PENDING_PATIENT_APPROVAL", lab_required: false, created_at: "2026-08-03T00:00:00Z" },
  ],
  audit_logs: [],
};

/* ========================================================================== */
/*  Runner                                                                    */
/* ========================================================================== */

let client: MockSupabaseClient;
let passed = 0;
let failed = 0;

async function check(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err: any) {
    failed++;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err?.message || err}`);
  }
}

async function main() {
  const mods = await bootstrap();
  const {
    remindersRouter,
    appointmentsRouter,
    ___setServiceOverrideForTests: setService,
    ___setRequestFactoryForTests: setFactory,
  } = mods;

  client = new MockSupabaseClient(SEED);
  setService(client as any);
  setFactory((req: any) => {
    const header: string = req?.headers?.authorization || "";
    const token = header.replace("Bearer ", "").trim();
    client.auth.setUser(token === "" ? null : token);
    return client as any;
  });

  const app = express();
  app.use(express.json());
  app.use("/api/appointments", appointmentsRouter);
  app.use("/api/reminders", remindersRouter);
  const server: Server = app.listen(0);
  await new Promise<void>((r) => server.once("listening", r));
  const port = (server.address() as any).port;
  const base = `http://127.0.0.1:${port}`;

  const api = async (path: string, opts: { method?: string; token?: string | null; body?: any } = {}) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
    const res = await fetch(`${base}${path}`, {
      method: opts.method || "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    const json: any = await res.json().catch(() => null);
    return { status: res.status, json };
  };

  console.log("\n— Medicine Reminder API —");
  await check("GET / unauthenticated returns 200 with empty reminders", async () => {
    const { status, json } = await api("/api/reminders", { token: null });
    assert.strictEqual(status, 200);
    assert.deepStrictEqual(json.reminders, []);
  });
  await check("GET / patient A sees only their own reminders", async () => {
    const { status, json } = await api("/api/reminders", { token: "p-a" });
    assert.strictEqual(status, 200);
    assert.deepStrictEqual(json.reminders.map((x: any) => x.id), ["rem-a1"]);
  });
  await check("GET / patient B cannot read patient A's reminders", async () => {
    const { json } = await api("/api/reminders", { token: "p-b" });
    assert.deepStrictEqual(json.reminders.map((x: any) => x.id), ["rem-b1"]);
  });
  await check("POST / unauthenticated still works (public pharmacy flow)", async () => {
    const { status, json } = await api("/api/reminders", {
      token: null,
      method: "POST",
      body: { patient_phone: "9999999999", medicine_name: "Vit C", frequency: "monthly" },
    });
    assert.strictEqual(status, 201);
    assert.ok(json.reminder.profile_id == null, "unauthenticated reminder must not have a profile_id");
  });
  await check("POST / cannot attach another user's profile via body", async () => {
    const { status, json } = await api("/api/reminders", {
      token: "p-a",
      method: "POST",
      body: { patient_phone: "1111111111", medicine_name: "Vit D", frequency: "daily", profile_id: "p-b" },
    });
    assert.strictEqual(status, 201);
    // profile_id must NOT be the injected "p-b"; it must be either the caller's own or absent
    assert.ok(json.reminder.profile_id !== "p-b", "body-injected profile_id must be rejected");
  });
  await check("PUT /:id unauthenticated returns 401", async () => {
    assert.strictEqual((await api("/api/reminders/rem-a1", { token: null, method: "PUT", body: {} })).status, 401);
  });
  await check("PUT /:id cross-patient (A on B's) returns 403 (IDOR)", async () => {
    assert.strictEqual((await api("/api/reminders/rem-b1", { token: "p-a", method: "PUT", body: { notes: "x" } })).status, 403);
  });
  await check("PUT /:id on an unowned anonymous reminder returns 403", async () => {
    assert.strictEqual((await api("/api/reminders/rem-anon", { token: "p-a", method: "PUT", body: { notes: "x" } })).status, 403);
  });
  await check("PUT /:id on own reminder returns 200", async () => {
    assert.strictEqual((await api("/api/reminders/rem-a1", { token: "p-a", method: "PUT", body: { notes: "hi" } })).status, 200);
  });
  await check("DELETE /:id unauthenticated returns 401", async () => {
    assert.strictEqual((await api("/api/reminders/rem-a1", { token: null, method: "DELETE" })).status, 401);
  });
  await check("DELETE /:id cross-patient (B on A's) returns 403 (IDOR)", async () => {
    assert.strictEqual((await api("/api/reminders/rem-a1", { token: "p-b", method: "DELETE" })).status, 403);
  });
  await check("DELETE /:id own reminder returns 200", async () => {
    assert.strictEqual((await api("/api/reminders/rem-a1", { token: "p-a", method: "DELETE" })).status, 200);
  });

  console.log("\n Public appointment tracking —");
  await check("track returns only the allowed minimal fields", async () => {
    const { status, json } = await api("/api/appointments/track", {
      method: "POST",
      body: { search: "APT-TEST-100001" },
    });
    assert.strictEqual(status, 200);
    assert.deepStrictEqual(Object.keys(json.data).sort(), [
      "appointment_date",
      "appointment_reference",
      "demo_data",
      "department",
      "status",
    ]);
    assert.strictEqual(json.data.demo_data, true);
  });
  await check("track never leaks prescription/lab/PII", async () => {
    const { json } = await api("/api/appointments/track", { method: "POST", body: { search: "APT-TEST-100001" } });
    const raw = JSON.stringify(json);
    for (const leaked of ["leaked rx", "https://secret", "prescription_text", "lab_report_url", "symptoms", "chest pain", "patient_name", "Alice", "1111111111"]) {
      assert.ok(!raw.includes(leaked), `track response leaked '${leaked}'`);
    }
    assert.strictEqual((await api("/api/appointments/track", { method: "POST", body: { search: "APT-TEST-999999" } })).status, 404);
  });

  await check("track without reference returns 400", async () => {
    assert.strictEqual((await api("/api/appointments/track", { method: "POST", body: { search: "  " } })).status, 400);
  });

  await check("track by phone number returns 404 (prevents enumeration)", async () => {
    assert.strictEqual((await api("/api/appointments/track", { method: "POST", body: { search: "1111111111" } })).status, 404);
  });

  console.log("\n Consent workflow —");
  await check("consent unauthenticated returns 401", async () => {
    assert.strictEqual((await api("/api/appointments/apt-a/consent", { token: null, method: "POST", body: { accept: true } })).status, 401);
  });
  await check("cross-patient consent (B on A's) returns 403", async () => {
    assert.strictEqual((await api("/api/appointments/apt-a/consent", { token: "p-b", method: "POST", body: { accept: true } })).status, 403);
  });
  await check("owner consent returns 200, simulated flag + audit entry", async () => {
    const before = client.tables.audit_logs.rows.length;
    const { status, json } = await api("/api/appointments/apt-a/consent", { token: "p-a", method: "POST", body: { accept: true } });
    assert.strictEqual(status, 200);
    assert.strictEqual(json.consent.simulated, true);
    assert.strictEqual(client.tables.audit_logs.rows.length, before + 1);
    const entry = client.tables.audit_logs.rows[before];
    assert.strictEqual(entry.action, "CONSENT_ACTION");
    assert.strictEqual(entry.details.simulated, true);
    assert.strictEqual(entry.details.consented_by, "p-a");
  });
  await check("active staff consent without PIN returns 400", async () => {
    assert.strictEqual((await api("/api/appointments/apt-b/consent", { token: "p-doc", method: "POST", body: { accept: true } })).status, 400);
  });
  await check("active staff consent with wrong PIN returns 403", async () => {
    assert.strictEqual((await api("/api/appointments/apt-b/consent", { token: "p-doc", method: "POST", body: { accept: true, staff_pin: "0000" } })).status, 403);
  });
  await check("active staff consent with correct PIN returns 200 simulated", async () => {
    const { status, json } = await api("/api/appointments/apt-b/consent", { token: "p-doc", method: "POST", body: { accept: true, staff_pin: "0099" } });
    assert.strictEqual(status, 200);
    assert.strictEqual(json.consent.simulated, true);
  });
  await check("inactive staff consent is rejected with 403", async () => {
    assert.strictEqual((await api("/api/appointments/apt-c/consent", { token: "p-doc-off", method: "POST", body: { accept: true, staff_pin: "0098" } })).status, 403);
  });

  console.log("\n");
  console.log(`RESULT: ${passed} passed, ${failed} failed`);
  server.close();
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(2);
});