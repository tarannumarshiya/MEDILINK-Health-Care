import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Request } from "express";
import ws from "ws";
import { config } from "./config";

const SUPABASE_URL = config.supabaseUrl;
const ANON_KEY = config.supabaseAnonKey;
const SERVICE_ROLE_KEY = config.supabaseServiceRoleKey;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing Supabase env vars. Check NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
  );
}

/**
 * Service-role client — bypasses RLS.
 * Use for admin/background writes exactly as in the original Next.js routes.
 */
export const serviceClient: SupabaseClient = createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws as any },
  }
);

/**
 * Session-aware (anon) client scoped to the caller's JWT.
 * Reads the Authorization header the browser sends automatically when
 * the Supabase JS client is configured to use session tokens.
 *
 * If the request carries a valid Supabase JWT, Supabase enforces RLS
 * exactly the same as the original Next.js server client did.
 */
export function createRequestClient(req: Request): SupabaseClient {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  return createClient(SUPABASE_URL, ANON_KEY, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws as any },
  });
}


/* -------------------------------------------------------------------------- */
/*  Injectable seams (used ONLY by the automated security test suite).         */
/*  In production these resolve to the real Supabase clients above.            */
/* -------------------------------------------------------------------------- */

let serviceOverride: SupabaseClient | null = null;
let requestFactoryOverride: ((req: Request) => SupabaseClient) | null = null;

export function getServiceClient(): SupabaseClient {
  return serviceOverride ?? serviceClient;
}

export function resolveRequestClient(req: Request): SupabaseClient {
  return requestFactoryOverride ? requestFactoryOverride(req) : createRequestClient(req);
}

export function __setServiceOverrideForTests(client: SupabaseClient | null) {
  serviceOverride = client;
}

export function __setRequestFactoryForTests(factory: ((req: Request) => SupabaseClient) | null) {
  requestFactoryOverride = factory;
}

/* -------------------------------------------------------------------------- */
/*  PostgREST error mapping                                                    */
/*  Many routes previously collapsed every database error into a 500, which    */
/*  leaked server errors for ordinary 4xx conditions (invalid type casts,      */
/*  CHECK/unique violations, unknown columns). Map the PostgREST status code   */
/*  back to the caller so invalid inputs return the appropriate 4xx.           */
/* -------------------------------------------------------------------------- */

export function dbErrorStatus(error: any): number {
  if (!error) return 500;

  const status = Number((error as any).status);
  if (Number.isInteger(status) && status >= 400 && status < 500) return status;

  // Postgres error codes surfaced through PostgREST that are client faults.
  const code = (error as any).code;
  if (typeof code === "string") {
    if (code === "PGRST116") return 404; // .single() with zero rows
    if (
      [
        "22007",  // invalid datetime format
        "22008",  // datetime field overflow
        "22P02",  // invalid text representation
        "23502",  // not null violation
        "23503",  // foreign key violation
        "23505",  // unique violation
        "23514",  // check violation
        "42703",  // undefined column
        "42883",  // undefined function
        "42P01",  // undefined table (schema mismatch)
      ].includes(code)
    ) {
      return 400;
    }
  }

  return 500;
}
