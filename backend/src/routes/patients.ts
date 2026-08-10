import { Router, Request, Response } from "express";
import { resolveRequestClient, dbErrorStatus } from "../lib/supabase";
import { generatePatientCode } from "../lib/ids";

const router = Router();

// POST /api/patients/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const supabase = resolveRequestClient(req);
    const { full_name, age, phone, email, description } = req.body;

    if (!full_name || age === undefined || age === null || age === "" || !phone) {
      return void res
        .status(400)
        .json({ error: "Name, age and phone are required" });
    }

    if (/[<>]/g.test(full_name)) {
      return void res
        .status(400)
        .json({ error: "Name cannot contain HTML or script characters" });
    }

    // A numeric JSON value for phone must not crash the string pipeline below.
    const phoneStr = String(phone).trim();
    const phoneDigits = phoneStr.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return void res
        .status(400)
        .json({ error: "Invalid phone number format. Must be between 10 and 15 digits." });
    }

    const parsedAge = Number(age);
    if (isNaN(parsedAge) || !Number.isInteger(parsedAge)) {
      return void res
        .status(400)
        .json({ error: "Age must be a valid integer" });
    }

    if (parsedAge < 0) {
      return void res
        .status(400)
        .json({ error: "age must be a valid positive integer (0 <= age < 150)" });
    }

    if (parsedAge >= 150) {
      return void res
        .status(400)
        .json({ error: "age exceeds maximum (150)" });
    }

    const { data, error } = await supabase
      .from("patients")
      .insert({
        patient_code: generatePatientCode(),
        full_name,
        age: parsedAge,
        phone: phoneStr,
        email: email ?? null,
      })
      .select()
      .single();

    if (error)
      return void res.status(dbErrorStatus(error)).json({ error: error.message });

    res.json({ success: true, patient: data });
  } catch {
    res
      .status(500)
      .json({ error: "Server error while registering patient" });
  }
});

router.all("/register", (req: Request, res: Response) => {
  res.setHeader("Allow", "POST");
  res.status(405).json({ error: "Method Not Allowed" });
});

export default router;
