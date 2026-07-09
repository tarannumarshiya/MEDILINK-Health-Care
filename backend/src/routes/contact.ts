import { Router, Request, Response } from "express";
import { createRequestClient } from "../lib/supabase";

const router = Router();

// POST /api/contact
router.post("/", async (req: Request, res: Response) => {
  try {
    const supabase = createRequestClient(req);
    const { full_name, email, phone, subject, message } = req.body;

    if (!full_name || !email || !subject || !message)
      return void res
        .status(400)
        .json({ error: "Name, email, subject and message are required" });

    const { data, error } = await supabase
      .from("contact_messages")
      .insert({
        full_name,
        email,
        phone: phone ?? null,
        subject,
        message,
        status: "NEW",
      })
      .select()
      .single();

    if (error)
      return void res.status(500).json({ error: error.message });

    res.json({ success: true, contact_message: data });
  } catch {
    res.status(500).json({ error: "Server error while sending message" });
  }
});

export default router;
