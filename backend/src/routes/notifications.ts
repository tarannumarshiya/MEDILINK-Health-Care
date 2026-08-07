import { Router, Request, Response } from "express";
import { getServiceClient } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";
import { NOTIFICATION_ADMIN_ROLES } from "../lib/roles";

const router = Router();

// GET /api/notifications
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { data, error } = await getServiceClient()
      .from("notifications")
      .select("id,user_id,type,title,body,is_read,entity_id,entity_table,priority,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return void res.status(500).json({ error: error.message });
    res.json({ success: true, notifications: data ?? [] });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/notifications/create
// Patients can only create self-notifications. Staff/admin can notify any user.
router.post("/create", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const profile = (req as any).profile;
    const { user_id, type, title, body, entity_id, entity_table, priority } = req.body;
    if (!title || !body) return void res.status(400).json({ error: "title and body required" });

    // Determine target user_id:
    // - If user_id is provided and the caller is staff, allow it.
    // - If user_id is provided and the caller is a patient, only allow self.
    // - If user_id is not provided, default to the caller's own id.
    let targetUserId: string;
    const isStaff = profile?.role && NOTIFICATION_ADMIN_ROLES.includes(profile.role);

    if (user_id) {
      if (!isStaff && user_id !== user.id) {
        return void res.status(403).json({ error: "Patients cannot send notifications to other users" });
      }
      targetUserId = user_id;
    } else {
      targetUserId = user.id;
    }

    const { data, error } = await getServiceClient().from("notifications").insert({
      user_id: targetUserId,
      type: type ?? "GENERAL",
      title,
      body,
      entity_id: entity_id ?? null,
      priority: priority ?? "NORMAL",
      is_read: false,
    }).select().single();

    if (error) return void res.status(500).json({ error: error.message });
    res.json({ success: true, notification: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/notifications/read
router.patch("/read", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { notification_id, id, all } = req.body;
    const notifId = notification_id ?? id;

    if (all) {
      await getServiceClient().from("notifications")
        .update({ is_read: true }).eq("user_id", user.id);
      return void res.json({ success: true });
    }

    if (!notifId) return void res.status(400).json({ error: "notification_id or id required" });

    const { error } = await getServiceClient().from("notifications")
      .update({ is_read: true }).eq("id", notifId).eq("user_id", user.id);

    if (error) return void res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
