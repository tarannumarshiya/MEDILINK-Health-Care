import { Request, Response, NextFunction } from "express";
import { resolveRequestClient } from "../lib/supabase";

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
  const supabase = resolveRequestClient(req);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Fetch profile so downstream handlers can check role/is_active
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, is_active, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  // Attach to request for downstream use
  (req as any).user = user;
  (req as any).profile = profile;

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
    if (!profile || !profile.is_active || !allowedRoles.includes(profile.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
