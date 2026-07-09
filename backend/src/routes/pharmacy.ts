import { Router, Request, Response } from "express";
import { createRequestClient, serviceClient } from "../lib/supabase";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

const PHARMACY_ROLES = [
  "PHARMACIST",
  "PHARMACY_ADMIN",
  "ADMIN",
  "SUPER_ADMIN",
  "HOSPITAL_ADMIN",
];

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
    .eq("is_available", true)
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

  if (error) return void res.status(500).json({ error: error.message });
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

    if (!name || !price)
      return void res
        .status(400)
        .json({ error: "Name and price are required" });

    if (quantity !== undefined && Number(quantity) < 0)
      return void res.status(400).json({ error: "Stock quantity cannot be negative" });

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

    if (error) return void res.status(500).json({ error: error.message });
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

    if (error) return void res.status(500).json({ error: error.message });
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

    if (!id) return void res.status(400).json({ error: "id required" });

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
    if (error) return void res.status(500).json({ error: error.message });
    res.json({ success: true });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS  →  /api/pharmacy/orders  (public POST, protected GET/PATCH)
// ─────────────────────────────────────────────────────────────────────────────

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

    const total = items.reduce(
      (
        sum: number,
        item: { price: number; quantity: number }
      ) => sum + Number(item.price) * Number(item.quantity),
      0
    );

    const { data: order, error: orderError } = await serviceClient
      .from("pharmacy_orders")
      .insert({
        patient_name,
        patient_phone,
        delivery_type: delivery_type ?? "pickup",
        notes: notes ?? null,
        prescription_url: prescription_image ?? null,
        status: "Pending",
        total,
      })
      .select("*")
      .single();

    if (orderError) {
      return void res.status(500).json({ error: orderError.message });
    }

    const orderItems = items.map(
      (item: {
        id?: string;
        medicine_id?: string;
        name?: string;
        medicine_name?: string;
        price: number;
        quantity: number;
      }) => ({
        order_id: order.id,
        medicine_id: item.medicine_id ?? item.id ?? null,
        medicine_name: item.medicine_name ?? item.name ?? "Medicine",
        price: Number(item.price),
        quantity: Number(item.quantity),
      })
    );

    // schema cache, retry without it or with `unit_price` so the order still goes through.
    let itemsError: any = null;

    const { error: ie1 } = await serviceClient
      .from("pharmacy_order_items")
      .insert(orderItems);
    itemsError = ie1;

    let fallbackItems: any[] = orderItems;

    if (itemsError && itemsError.message.toLowerCase().includes("medicine_name")) {
      // Column doesn't exist — remove it
      fallbackItems = fallbackItems.map(({ medicine_name: _mn, ...rest }) => rest);
      const { error: ie2 } = await serviceClient
        .from("pharmacy_order_items")
        .insert(fallbackItems);
      itemsError = ie2;
    }

    if (itemsError && itemsError.message.toLowerCase().includes("price")) {
      // Column might be unit_price instead of price
      fallbackItems = fallbackItems.map(({ price, ...rest }) => ({ ...rest, unit_price: price }));
      const { error: ie3 } = await serviceClient
        .from("pharmacy_order_items")
        .insert(fallbackItems);
      itemsError = ie3;
    }

    if (itemsError) {
      return void res.status(500).json({ error: itemsError.message });
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

    return void res.status(500).json({ error: message });
  }
});

router.post("/orders/track", async (req: Request, res: Response) => {
  try {
    const { search } = req.body;
    if (!search || typeof search !== "string" || !search.trim()) {
      return void res.status(400).json({ error: "Search query (Order ID or Phone) is required" });
    }

    const cleanSearch = search.trim();
    let query = serviceClient
      .from("pharmacy_orders")
      .select(`
        id, patient_name, patient_phone, delivery_type, status, total, notes, created_at,
        pharmacy_order_items ( id, medicine_name, price, quantity )
      `)
      .order("created_at", { ascending: false });

    // Try treating it as UUID first, otherwise search by phone
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSearch);
    if (isUuid) {
      query = query.or(`id.eq.${cleanSearch},patient_phone.eq.${cleanSearch}`);
    } else {
      query = query.eq("patient_phone", cleanSearch);
    }

    const { data: orders, error } = await query;

    if (error) {
      return void res.status(500).json({ error: error.message });
    }

    if (!orders || orders.length === 0) {
      return void res.status(404).json({ error: "No orders found for this search" });
    }

    res.json({ success: true, orders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to track order";
    res.status(500).json({ error: message });
  }
});
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

    if (error) return void res.status(500).json({ error: error.message });

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

    if (!prescription_id)
      return void res.status(400).json({ error: "prescription_id required" });

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
    if (error) return void res.status(500).json({ error: error.message });

    // Update appointment status → PHARMACY_FULFILLED
    const { data: rx } = await supabase
      .from("prescriptions").select("appointment_id").eq("id", prescription_id).single();
    if (rx?.appointment_id) {
      await serviceClient.from("appointments").update({
        status: "PHARMACY_FULFILLED",
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

    if (error) return void res.status(500).json({ error: error.message });
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

    if (!name)
      return void res.status(400).json({ error: "Vendor name required" });
    if (email && !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(String(email).trim()))
      return void res.status(400).json({ error: "Enter a valid lowercase vendor email" });

    const { data, error } = await supabase
      .from("vendors")
      .insert({ name, contact: contact ?? null, email: email ?? null })
      .select()
      .single();

    if (error) return void res.status(500).json({ error: error.message });
    res.json({ success: true, vendor: data });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// QUESTIONS  →  /api/pharmacy/questions  (public POST)
// ─────────────────────────────────────────────────────────────────────────────

router.post("/questions", async (req: Request, res: Response) => {
  const { name, phone, question } = req.body;

  if (!name || !question)
    return void res
      .status(400)
      .json({ error: "Name and question are required" });

  const { data, error } = await serviceClient
    .from("pharmacy_questions")
    .insert({ name, phone: phone ?? null, question, status: "PENDING" })
    .select()
    .single();

  if (error) return void res.status(500).json({ error: error.message });
  res.json({ success: true, question: data });
});

export default router;
