import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Request } from "express";
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
  { auth: { autoRefreshToken: false, persistSession: false } }
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
  });
}
