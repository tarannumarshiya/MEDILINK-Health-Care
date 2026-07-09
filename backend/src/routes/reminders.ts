import { Router, Request, Response } from "express";
import { serviceClient } from "../lib/supabase";

const router = Router();

function getNextReminderDate(frequency: string, startDate?: string) {
  const date = startDate ? new Date(startDate) : new Date();

  if (frequency === "daily") {
    date.setDate(date.getDate() + 1);
  } else if (frequency === "weekly") {
    date.setDate(date.getDate() + 7);
  } else if (frequency === "every_15_days") {
    date.setDate(date.getDate() + 15);
  } else {
    date.setMonth(date.getMonth() + 1);
  }

  return date.toISOString().split("T")[0];
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const patientPhone = String(req.query.patient_phone || "");

    let query = serviceClient
      .from("medicine_reminders")
      .select("*")
      .order("next_reminder_date", { ascending: true });

    if (patientPhone) {
      query = query.eq("patient_phone", patientPhone);
    }

    const { data, error } = await query;

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({ success: true, reminders: data || [] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      patient_phone,
      medicine_id,
      medicine_name,
      frequency,
      start_date,
      notes,
    } = req.body;

    if (!patient_phone || !medicine_name || !frequency) {
      return res.status(400).json({
        success: false,
        error: "patient_phone, medicine_name and frequency are required",
      });
    }

    const next_reminder_date = getNextReminderDate(frequency, start_date);

    const { data, error } = await serviceClient
      .from("medicine_reminders")
      .insert({
        patient_phone,
        medicine_id,
        medicine_name,
        frequency,
        start_date: start_date || new Date().toISOString().split("T")[0],
        next_reminder_date,
        notes: notes || null,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.status(201).json({ success: true, reminder: data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString(),
    };

    if (req.body.frequency || req.body.start_date) {
      updateData.next_reminder_date = getNextReminderDate(
        req.body.frequency || "monthly",
        req.body.start_date
      );
    }

    const { data, error } = await serviceClient
      .from("medicine_reminders")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({ success: true, reminder: data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await serviceClient
      .from("medicine_reminders")
      .delete()
      .eq("id", id);

    if (error) return res.status(500).json({ success: false, error: error.message });

    return res.json({ success: true, message: "Reminder deleted" });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;