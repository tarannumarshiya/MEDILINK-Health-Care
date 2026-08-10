import { Router, Request, Response } from "express";
import { createRequestClient, serviceClient } from "../lib/supabase";
import { requireAuth, requireRole } from "../middleware/auth";
import { generateInvoiceForAppointment } from "../lib/billing";
import { PHARMACY_ROLES } from "../lib/roles";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// MEDICINES  →  /api/pharmacy/medicines  (public GET, protected POST)
// ─────────────────────────────────────────────────────────────────────────────

router.get("/medicines", async (req: Request, res: Response) => {
  const supabase = createRequestClient(req);

  const { data, error } = await supabase
    .from("medicines")
    .select(
      "id, name, description, category, price, quantity, image_url, requires_prescription, is_available"
    )
    .order("name", { ascending: true });

  let isAdmin = false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = !!(
      profile && ["ADMIN", "SUPER_ADMIN", "PHARMACIST"].includes(profile.role)
    );
  }

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true, medicines: data ?? [], isAdmin });
});

router.post(
  "/medicines",
  requireAuth,
  requireRole(["ADMIN", "SUPER_ADMIN", "PHARMACIST", "PHARMACY_ADMIN"]),
  async (req: Request, res: Response) => {
    const supabase = createRequestClient(req);
    const {
      name,
      description,
      category,
      price,
      quantity,
      image_url,
      requires_prescription,
    } = req.body;

    if (!name || !price) {
      res.status(400).json({ error: "Name and price are required" });
      return;
    }

    if (quantity !== undefined && Number(quantity) < 0) {
      res.status(400).json({ error: "Stock quantity cannot be negative" });
      return;
    }

    const cleanName = String(name).trim();
    const { data: existing } = await supabase
      .from("medicines")
      .select("id, quantity")
      .ilike("name", cleanName)
      .maybeSingle();

    let data;
    let error;
    if (existing) {
      const updateRes = await supabase
        .from("medicines")
        .update({
          quantity: Number(existing.quantity ?? 0) + Number(quantity ?? 0),
          price: Number(price),
          description: description ?? null,
          category: category ?? "General",
          image_url: image_url ?? null,
          requires_prescription: Boolean(requires_prescription),
          is_available: true,
        })
        .eq("id", existing.id)
        .select()
        .single();
      data = updateRes.data;
      error = updateRes.error;
    } else {
      const insertRes = await supabase
        .from("medicines")
        .insert({
          name: cleanName,
          description: description ?? null,
          category: category ?? "General",
          price: Number(price),
          quantity: Number(quantity ?? 0),
          image_url: image_url ?? null,
          requires_prescription: Boolean(requires_prescription),
          is_available: true,
        })
        .select()
        .single();
      data = insertRes.data;
      error = insertRes.error;
    }

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true, medicine: data });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY  →  /api/pharmacy/inventory  (protected)
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/inventory",
  requireAuth,
  requireRole(PHARMACY_ROLES),
  async (req: Request, res: Response) => {
    const supabase = createRequestClient(req);

    const { data, error } = await supabase
      .from("medicines")
      .select(
        "id, name, description, category, price, quantity, image_url, requires_prescription, is_available, reorder_level, batch_no, expiry_date, supplier_id"
      )
      .order("name", { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true, medicines: data ?? [] });
  }
);

router.patch(
  "/inventory",
  requireAuth,
  requireRole(PHARMACY_ROLES),
  async (req: Request, res: Response) => {
    const supabase = createRequestClient(req);
    const { id, quantity, reorder_level, price, is_available } = req.body;

    if (!id) {
      res.status(400).json({ error: "id required" });
      return;
    }

    const updates: Record<string, unknown> = {};
    if (quantity !== undefined) updates.quantity = Number(quantity);
    if (reorder_level !== undefined)
      updates.reorder_level = Number(reorder_level);
    if (price !== undefined) updates.price = Number(price);
    if (is_available !== undefined)
      updates.is_available = Boolean(is_available);

    const { error } = await supabase
      .from("medicines")
      .update(updates)
      .eq("id", id);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS  →  /api/pharmacy/orders  (public POST with server-side pricing,
//             protected GET/PATCH)
// ─────────────────────────────────────────────────────────────────────────────

const VALID_ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

router.post("/orders", async (req: Request, res: Response) => {
  try {
    const {
      items,
      patient_name,
      patient_phone,
      delivery_type,
      notes,
      prescription_image,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return void res.status(400).json({ error: "Items are required" });
    }

    if (!patient_name || !patient_phone) {
      return void res
        .status(400)
        .json({ error: "Patient name and phone number are required" });
    }

    if (/[<>]/g.test(patient_name)) {
      return void res
        .status(400)
        .json({ error: "Patient name cannot contain HTML or script characters" });
    }

    const phoneDigits = patient_phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return void res
        .status(400)
        .json({ error: "Invalid phone number format. Must be between 10 and 15 digits." });
    }

    if (notes && /[<>]/g.test(notes)) {
      return void res
        .status(400)
        .json({ error: "Notes cannot contain HTML or script characters" });
    }

    // Server-side price calculation: fetch authoritative prices from the
    // medicines table so the client cannot manipulate pricing.
    let total = 0;
    const validatedItems: { medicine_name: string; price: number; quantity: number }[] = [];

    for (const item of items) {
      const medicineName = item.medicine_name ?? item.name ?? "";
      const quantity = Number(item.quantity) || 0;

      if (!medicineName || quantity <= 0) {
        return void res.status(400).json({ error: `Invalid item: ${medicineName || "unnamed"}` });
      }

      // Look up the authoritative price from the medicines table
      const { data: medicine } = await serviceClient
        .from("medicines")
        .select("id, price, quantity, is_available")
        .ilike("name", medicineName)
        .maybeSingle();

      if (!medicine || !medicine.is_available) {
        return void res.status(400).json({ error: `Medicine "${medicineName}" not found or unavailable` });
      }

      if (medicine.quantity < quantity) {
        return void res.status(400).json({ error: `Insufficient stock for "${medicineName}". Available: ${medicine.quantity}` });
      }

      const unitPrice = Number(medicine.price);
      total += unitPrice * quantity;
      validatedItems.push({
        medicine_name: medicineName,
        price: unitPrice,
        quantity,
      });
    }

    const { data: order, error: orderError } = await serviceClient
      .from("pharmacy_public_orders")
      .insert({
        patient_name,
        patient_phone,
        delivery_type: delivery_type ?? "pickup",
        notes: notes ?? null,
        prescription_image: prescription_image ?? null,
        status: "PENDING",
        total,
        items: validatedItems,
      })
      .select("*")
      .single();

    if (orderError) {
      res.status(500).json({ error: orderError.message });
      return;
    }

    return res.status(201).json({
      success: true,
      order,
      order_id: order.id,
      total,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to place order";

    res.status(500).json({ error: message });
  }
});

router.post("/orders/track", async (req: Request, res: Response) => {
  try {
    const rawSearch = req.body.search || req.body.order_id || req.body.phone || req.body.patient_phone || req.query.search || req.query.order_id || req.query.phone || req.query.patient_phone;
    if (!rawSearch || typeof rawSearch !== "string" || !rawSearch.trim()) {
      res.status(400).json({ error: "Search query (Order ID or Phone) is required" });
      return;
    }

    const cleanSearch = rawSearch.trim();
    let query = serviceClient
      .from("pharmacy_public_orders")
      .select("id, status, patient_name, delivery_type, created_at")
      .order("created_at", { ascending: false });

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSearch);
    if (isUuid) {
      query = query.or(`id.eq.${cleanSearch},patient_phone.eq.${cleanSearch}`);
    } else {
      const phoneDigits = cleanSearch.replace(/\D/g, "");
      query = query.eq("patient_phone", phoneDigits);
    }

    const { data: orders, error } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    if (!orders || orders.length === 0) {
      res.status(404).json({ error: "No orders found for this search" });
      return;
    }

    res.json({ success: true, orders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to track order";
    res.status(500).json({ error: message });
  }
});

router.get(
  "/orders",
  requireAuth,
  requireRole(PHARMACY_ROLES),
  async (req: Request, res: Response) => {
    const supabase = createRequestClient(req);
    const { data, error } = await supabase
      .from("pharmacy_public_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true, orders: data || [] });
  }
);

router.patch(
  "/orders",
  requireAuth,
  requireRole(PHARMACY_ROLES),
  async (req: Request, res: Response) => {
    const supabase = createRequestClient(req);
    const { id, status } = req.body;

    if (!id || !status) {
      res.status(400).json({ error: "id and status required" });
      return;
    }

    if (!VALID_ORDER_STATUSES.includes(status.toUpperCase())) {
      res.status(422).json({ error: `Invalid status. Allowed: ${VALID_ORDER_STATUSES.join(", ")}` });
      return;
    }

    const { error } = await supabase
      .from("pharmacy_public_orders")
      .update({ status: status.toUpperCase() })
      .eq("id", id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true });
  }
);
// ─────────────────────────────────────────────────────────────────────────────
// PRESCRIPTION QUEUE  →  /api/pharmacy/queue  (protected)
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/queue",
  requireAuth,
  requireRole(PHARMACY_ROLES),
  async (req: Request, res: Response) => {
    const supabase = createRequestClient(req);

    const { data: prescriptions, error } = await supabase
      .from("prescriptions")
      .select(
        `id, appointment_id, doctor_id, prescription_notes, status, created_at,
         prescription_items ( id, prescription_id, medicine_name, dosage, quantity, instructions ),
         appointments ( patient_name, patient_phone ),
         doctors ( profiles ( full_name ) )`
      )
      .in("status", ["ACTIVE", "PENDING", "DISPENSED", "FULFILLED"])
      .order("created_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const shaped = (prescriptions ?? []).map((rx: any) => ({
      id: rx.id,
      appointment_id: rx.appointment_id,
      doctor_id: rx.doctor_id,
      prescription_notes: rx.prescription_notes,
      status: rx.status === "ACTIVE" ? "PENDING" : rx.status,
      created_at: rx.created_at,
      patient_name: rx.appointments?.patient_name ?? "Unknown",
      patient_phone: rx.appointments?.patient_phone ?? "",
      doctor_name: rx.doctors?.profiles?.full_name ?? "Doctor",
      items: rx.prescription_items ?? [],
    }));

    res.json({ success: true, prescriptions: shaped });
  }
);

router.patch(
  "/queue",
  requireAuth,
  requireRole(PHARMACY_ROLES),
  async (req: Request, res: Response) => {
    const supabase = createRequestClient(req);
    const { prescription_id } = req.body;

    if (!prescription_id) {
      res.status(400).json({ error: "prescription_id required" });
      return;
    }

    const { data: items } = await supabase
      .from("prescription_items")
      .select("medicine_name, quantity")
      .eq("prescription_id", prescription_id);

    if (items?.length) {
      for (const item of items) {
        const keyword = item.medicine_name.split(" ")[0];
        const { data: med } = await supabase
          .from("medicines").select("id, quantity").ilike("name", `%${keyword}%`).maybeSingle();
        if (med) {
          await supabase.from("medicines")
            .update({ quantity: Math.max(0, (med.quantity ?? 0) - item.quantity) }).eq("id", med.id);
        }
      }
    }

    const { error } = await supabase
      .from("prescriptions").update({ status: "FULFILLED" }).eq("id", prescription_id);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    // Update appointment status → PHARMACY_FULFILLED
    const { data: rx } = await supabase
      .from("prescriptions").select("appointment_id").eq("id", prescription_id).single();
    if (rx?.appointment_id) {
      let apptStatus = "PHARMACY_FULFILLED";

      // Check if lab is still pending
      const { data: pendingLabs } = await serviceClient
        .from("lab_tests")
        .select("id")
        .eq("appointment_id", rx.appointment_id)
        .in("status", ["PENDING", "COLLECTED", "PROCESSING"]);

      if (!pendingLabs || pendingLabs.length === 0) {
        // No pending labs, so generate the final invoice
        const invoice = await generateInvoiceForAppointment(rx.appointment_id);
        if (invoice) {
          apptStatus = "INVOICE_GENERATED";
        }
      }

      await serviceClient.from("appointments").update({
        status: apptStatus,
        updated_at: new Date().toISOString(),
      }).eq("id", rx.appointment_id);

      // Audit
      await serviceClient.from("audit_logs").insert({
        action: "PHARMACY_DISPENSED",
        entity: "prescriptions",
        entity_id: prescription_id,
        actor_id: (req as any).profile?.id ?? null,
        detail: `Prescription dispensed for appointment ${rx.appointment_id}`,
      });

      // Notify patient
      const { data: appt } = await serviceClient
        .from("appointments").select("patient_id").eq("id", rx.appointment_id).single();
      if (appt?.patient_id) {
        const { data: patient } = await serviceClient
          .from("patients").select("profile_id").eq("id", appt.patient_id).single();
        if (patient?.profile_id) {
          await serviceClient.from("notifications").insert({
            user_id: patient.profile_id,
            type: "PHARMACY",
            title: "Medicines Ready",
            body: "Your medicines have been dispensed. Please collect from the pharmacy counter.",
            entity_id: prescription_id,
            priority: "NORMAL",
          });
        }
      }
    }

    res.json({ success: true });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// VENDORS  →  /api/pharmacy/vendors  (protected)
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  "/vendors",
  requireAuth,
  requireRole(PHARMACY_ROLES),
  async (req: Request, res: Response) => {
    const supabase = createRequestClient(req);

    const { data, error } = await supabase
      .from("vendors")
      .select("id, name, contact, email")
      .order("name", { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true, vendors: data ?? [] });
  }
);

router.post(
  "/vendors",
  requireAuth,
  requireRole(PHARMACY_ROLES),
  async (req: Request, res: Response) => {
    const supabase = createRequestClient(req);
    const { name, contact, email } = req.body;

    if (!name) {
      res.status(400).json({ error: "Vendor name required" });
      return;
    }
    if (email && !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(String(email).trim())) {
      res.status(400).json({ error: "Enter a valid lowercase vendor email" });
      return;
    }

    const { data, error } = await supabase
      .from("vendors")
      .insert({ name, contact: contact ?? null, email: email ?? null })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true, vendor: data });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// QUESTIONS  →  /api/pharmacy/questions  (public POST)
// ─────────────────────────────────────────────────────────────────────────────

router.post("/questions", async (req: Request, res: Response) => {
  const { name, phone, question } = req.body;

  if (!name || !question) {
    res.status(400).json({ error: "Name and question are required" });
    return;
  }

  const { data, error } = await serviceClient
    .from("pharmacy_questions")
    .insert({ name, phone: phone ?? null, question, status: "PENDING" })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json({ success: true, question: data });
});

export default router;
