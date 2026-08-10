import { Router, Request, Response } from "express";
import { getServiceClient, dbErrorStatus } from "../lib/supabase";

const router = Router();

// POST /api/contact
router.post("/", async (req: Request, res: Response) => {
  try {
    if (req.body && JSON.stringify(req.body).length > 100 * 1024) {
      return void res.status(413).json({ error: "Payload Too Large" });
    }
    const { full_name, email, phone, subject, message } = req.body;

    if (!full_name || !email || !subject || !message) {
      return void res
        .status(400)
        .json({ error: "Name, email, subject and message are required" });
    }

    // Each field must actually be a string — a numeric JSON value would
    // otherwise crash the regex/length pipelines below and surface a 500.
    for (const [key, value] of Object.entries({ full_name, email, subject, message })) {
      if (typeof value !== "string") {
        return void res.status(400).json({ error: `${key} must be a string` });
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return void res.status(400).json({ error: "Invalid email format" });
    }

    if (email.length > 254 || full_name.length > 120 || subject.length > 255 || message.length > 5000) {
      return void res.status(400).json({ error: "Field exceeds maximum allowed length" });
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

    let phoneValue: string | null = null;
    if (phone) {
      const phoneStr = String(phone).trim();
      const phoneDigits = phoneStr.replace(/\D/g, "");
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        return void res.status(400).json({ error: "Invalid phone number format" });
      }
      phoneValue = phoneStr;
    }

    const { data, error } = await getServiceClient()
      .from("contact_messages")
      .insert({
        full_name,
        email,
        phone: phoneValue,
        subject,
        message,
        status: "NEW",
      })
      .select()
      .single();

    if (error)
      return void res.status(dbErrorStatus(error)).json({ error: error.message });

    res.json({ success: true, contact_message: data });
  } catch {
    res.status(500).json({ error: "Server error while sending message" });
  }
});

export default router;
