import { Router, Request, Response } from "express";
import { createRequestClient } from "../lib/supabase";

const router = Router();

// POST /api/contact
router.post("/", async (req: Request, res: Response) => {
  try {
    const supabase = createRequestClient(req);
    const { full_name, email, phone, subject, message } = req.body;

    if (!full_name || !email || !subject || !message) {
      return void res
        .status(400)
        .json({ error: "Name, email, subject and message are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return void res.status(400).json({ error: "Invalid email format" });
    }

    if (/[<>]/g.test(full_name)) {
      return void res.status(400).json({ error: "Name cannot contain HTML or script characters" });
    }

    if (/[<>]/g.test(subject)) {
      return void res.status(400).json({ error: "Subject cannot contain HTML or script characters" });
    }

    if (message && /[<>]/g.test(message)) {
      return void res.status(400).json({ error: "Message cannot contain HTML or script characters" });
    }

    if (phone) {
      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length < 10 || phone.length > 15 || !/^\+?[0-9]+$/.test(phone)) {
        return void res.status(400).json({ error: "Invalid phone number format" });
      }
    }

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
