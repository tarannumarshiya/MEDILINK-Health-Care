import { Router, Request, Response } from "express";
import { serviceClient } from "../lib/supabase";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
const AUDIT_ROLES = ["ADMIN", "SUPER_ADMIN", "HOSPITAL_ADMIN"];

// GET /api/audit-logs
router.get("/", requireAuth, requireRole(AUDIT_ROLES), async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 100), 500);
    const { data, error } = await serviceClient
      .from("audit_logs")
      .select("id,action,entity,entity_id,actor_id,actor_name,detail,created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return void res.status(500).json({ error: error.message });
    res.json({ success: true, logs: data ?? [] });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
