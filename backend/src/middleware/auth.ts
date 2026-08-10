import { Request, Response, NextFunction } from "express";
import { resolveRequestClient, getServiceClient } from "../lib/supabase";
import { normalizeRole } from "../lib/roles";

/**
 * Attaches `req.user` and `req.profile` from the Supabase session token.
 * If the token is missing or invalid the request is rejected with 401.
 *
 * Usage:
 *   router.get("/protected", requireAuth, handler)
 *   router.get("/doctor-only", requireAuth, requireRole(["DOCTOR"]), handler)
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  const supabase = resolveRequestClient(req);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token || undefined);

  if (error || !user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Fetch profile so downstream handlers can check role/is_active
  const { data: profile } = await getServiceClient()
    .from("profiles")
    .select("id, role, is_active, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  // Attach to request for downstream use. The role is normalised once here so
  // every route-level role check compares the same canonical value, regardless
  // of the case/format stored in the profiles table.
  (req as any).user = user;
  (req as any).profile = profile
    ? { ...profile, role: normalizeRole(profile.role) }
    : profile;
  (req as any).role = normalizeRole(profile?.role);

  next();
}

/**
 * Role-guard middleware factory.
 * Call AFTER requireAuth so req.profile is guaranteed.
 *
 * Example:
 *   router.post("/prescribe", requireAuth, requireRole(["DOCTOR"]), handler)
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const profile = (req as any).profile;
    if (!profile || !profile.is_active) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const role = normalizeRole(profile.role);
    // SUPER_ADMIN implicitly has access to all role-protected routes
    if (role !== "SUPER_ADMIN" && !allowedRoles.includes(role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
