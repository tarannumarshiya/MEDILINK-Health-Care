import { Router, Request, Response } from "express";
import { serviceClient } from "../lib/supabase";

const router = Router();

// POST /api/contact
router.post("/", async (req: Request, res: Response) => {
  try {
    const { full_name, email, phone, subject, message } = req.body;

    if (!full_name || !email || !subject || !message) {
      res.status(400).json({ error: "Name, email, subject and message are required" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: "Invalid email format" });
      return;
    }

    if (/[<>]/g.test(full_name)) {
      res.status(400).json({ error: "Name cannot contain HTML or script characters" });
      return;
    }

    if (/[<>]/g.test(subject)) {
      res.status(400).json({ error: "Subject cannot contain HTML or script characters" });
      return;
    }

    if (message && /[<>]/g.test(message)) {
      res.status(400).json({ error: "Message cannot contain HTML or script characters" });
      return;
    }

    if (phone) {
      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        res.status(400).json({ error: "Invalid phone number format" });
        return;
      }
    }

    const { data, error } = await serviceClient
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

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, contact_message: data });
  } catch {
    res.status(500).json({ error: "Server error while sending message" });
  }
});

export default router;
