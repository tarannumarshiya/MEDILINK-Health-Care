/**
 * apiFetch — drop-in replacement for fetch("/api/...")
 *
 * Reads the active Supabase session from the browser and attaches the JWT
 * as Authorization: Bearer <token> so the Express backend can authenticate
 * the caller via requireAuth middleware.
 *
 * Public endpoints (appointments/track, contact, pharmacy/medicines GET, etc.)
 * work fine too — the token is just ignored server-side when auth isn't required.
 *
 * Usage — identical to plain fetch:
 *   const res = await apiFetch("/api/doctor/queue");
 *   const res = await apiFetch("/api/admin/departments", { method: "POST", body: ... });
 */

import { createClient } from "@/lib/supabase/client";

export async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return fetch(path, { ...init, headers });
}
