import { Router, Request, Response } from "express";
import { createRequestClient } from "../lib/supabase";
import { generatePatientCode } from "../lib/ids";

const router = Router();

// POST /api/patients/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const supabase = createRequestClient(req);
    const { full_name, age, phone, email, description } = req.body;

    if (!full_name || !age || !phone)
      return void res
        .status(400)
        .json({ error: "Name, age and phone are required" });

    const { data, error } = await supabase
      .from("patients")
      .insert({
        patient_code: generatePatientCode(),
        full_name,
        age: Number(age),
        phone,
        email: email ?? null,
      })
      .select()
      .single();

    if (error)
      return void res.status(500).json({ error: error.message });

    res.json({ success: true, patient: data });
  } catch {
    res
      .status(500)
      .json({ error: "Server error while registering patient" });
  }
});

export default router;
