import { Router, Request, Response } from "express";
import { serviceClient, createRequestClient } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /api/notifications
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { data, error } = await serviceClient
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
router.post("/create", requireAuth, async (req: Request, res: Response) => {
  try {
    const { user_id, type, title, body, entity_id, entity_table, priority } = req.body;
    if (!user_id || !title || !body) return void res.status(400).json({ error: "user_id, title, body required" });

    const { data, error } = await serviceClient.from("notifications").insert({
      user_id,
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
      await serviceClient.from("notifications")
        .update({ is_read: true }).eq("user_id", user.id);
      return void res.json({ success: true });
    }

    if (!notifId) return void res.status(400).json({ error: "notification_id or id required" });

    const { error } = await serviceClient.from("notifications")
      .update({ is_read: true }).eq("id", notifId).eq("user_id", user.id);

    if (error) return void res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
