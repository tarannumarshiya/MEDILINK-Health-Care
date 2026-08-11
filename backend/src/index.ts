import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { config, validateRequiredConfig } from "./lib/config";
import { apiLimiter, authLimiter, bookingLimiter } from "./middleware/security";
import swaggerUi from "swagger-ui-express";
import openapiSpec from "./openapi.json";

import adminRoutes        from "./routes/admin";
import appointmentRoutes  from "./routes/appointments";
import doctorRoutes       from "./routes/doctor";
import patientRoutes      from "./routes/patients";
import contactRoutes      from "./routes/contact";
import paymentRoutes      from "./routes/payment";
import pharmacyRoutes     from "./routes/pharmacy";
import reminderRoutes from "./routes/reminders";
import labRoutes          from "./routes/lab";
import billingRoutes      from "./routes/billing";
import insuranceRoutes    from "./routes/insurance";
import emergencyRoutes    from "./routes/emergency";
import telemedicineRoutes from "./routes/telemedicine";
import receptionRoutes    from "./routes/reception";
import notificationRoutes from "./routes/notifications";
import auditRoutes        from "./routes/audit";


import { requestLogger } from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";
import { idempotency } from "./middleware/idempotency";
import { requestTimeout } from "./middleware/timeout";

const app  = express();
const PORT = config.port;

// Fail fast when required configuration is missing.
validateRequiredConfig();

// Trust proxy for rate limiting behind Render/Vercel
app.set("trust proxy", 1);

// ─── Request Logger ───────────────────────────────────────────────────────────
app.use(requestLogger);

// ─── Idempotency Controls ──────────────────────────────────────────────────────
app.use(idempotency);

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // allow Supabase storage embeds
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  }
}));

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = config.corsOrigins;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));

app.use((req, res, next) => {
  const isContact = (req.originalUrl || req.path || "").startsWith("/api/contact");
  if (isContact && req.headers["content-length"]) {
    const contentLength = parseInt(req.headers["content-length"], 10);
    if (contentLength > 100 * 1024) {
      return res.status(413).json({ error: "Payload Too Large" });
    }
  }
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof SyntaxError && "status" in err && err.status === 400) {
    return res.status(400).json({ error: "Malformed JSON payload" });
  }
  next(err);
});
app.use(express.urlencoded({ extended: true }));

// ─── Global API rate limit and request timeout ────────────────────────────────
app.use("/api", requestTimeout(30000), apiLimiter);

// ─── Swagger API Documentation ────────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});
app.all("/health", (req, res) => {
  res.setHeader("Allow", "GET");
  res.status(405).json({ error: "Method Not Allowed" });
});

// ─── Routes (auth endpoints get stricter limits) ──────────────────────────────
app.use("/api/admin",                adminRoutes);
app.use("/api/appointments",         bookingLimiter, appointmentRoutes);
app.use("/api/doctor",               doctorRoutes);
app.use("/api/patients",             authLimiter, patientRoutes);
app.use("/api/contact",              contactRoutes);
app.use("/api/payment",              paymentRoutes);
app.use("/api/pharmacy",             pharmacyRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/lab",                  labRoutes);
app.use("/api/billing",              billingRoutes);
app.use("/api/insurance",            insuranceRoutes);
app.use("/api/emergency",            emergencyRoutes);
app.use("/api/telemedicine",         telemedicineRoutes);
app.use("/api/reception",            receptionRoutes);
app.use("/api/notifications",        notificationRoutes);
app.use("/api/audit-logs",           auditRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use("/api/*", (_req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Root — API landing page ──────────────────────────────────────────────────
app.get("/", (req, res) => {
  const uptime = process.uptime();
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);
  const uptimeStr = `${h}h ${m}m ${s}s`;

  const routes = [
    { group: "Admin",         base: "/api/admin",          endpoints: [
      { method: "GET",    path: "/api/admin/departments",             desc: "List all departments" },
      { method: "POST",   path: "/api/admin/departments",             desc: "Create department" },
      { method: "PATCH",  path: "/api/admin/departments",             desc: "Toggle department active state" },
      { method: "GET",    path: "/api/admin/doctors",                 desc: "List active doctors" },
      { method: "POST",   path: "/api/admin/doctors",                 desc: "Register doctor" },
      { method: "PATCH",  path: "/api/admin/doctors",                 desc: "Update doctor availability" },
      { method: "POST",   path: "/api/admin/appointments/approve",    desc: "Approve appointment" },
      { method: "POST",   path: "/api/admin/appointments/reject",     desc: "Reject appointment" },
      { method: "PATCH",  path: "/api/admin/appointments",            desc: "Assign doctor to appointment" },
      { method: "GET",    path: "/api/admin/contact-messages",        desc: "List contact messages" },
      { method: "PATCH",  path: "/api/admin/contact-messages",        desc: "Mark message read" },
    ]},
    { group: "Appointments",  base: "/api/appointments",   endpoints: [
      { method: "POST",   path: "/api/appointments/create",           desc: "Book appointment" },
      { method: "POST",   path: "/api/appointments/track",            desc: "Track appointment by code" },
    ]},
    { group: "Doctor",        base: "/api/doctor",         endpoints: [
      { method: "GET",    path: "/api/doctor/queue",                  desc: "Get doctor's appointment queue" },
      { method: "PATCH",  path: "/api/doctor/start-consultation",     desc: "Start consultation" },
      { method: "POST",   path: "/api/doctor/prescription",           desc: "Write prescription" },
      { method: "GET",    path: "/api/doctor/lab-report",             desc: "Get lab report for appointment" },
      { method: "PATCH",  path: "/api/doctor/complete",               desc: "Complete appointment" },
      { method: "GET",    path: "/api/doctor/patient-history",        desc: "Get patient history" },
    ]},
    { group: "Patients",      base: "/api/patients",       endpoints: [
      { method: "POST",   path: "/api/patients/register",             desc: "Register patient" },
    ]},
    { group: "Pharmacy",      base: "/api/pharmacy",       endpoints: [
      { method: "GET",    path: "/api/pharmacy/medicines",            desc: "List medicines" },
      { method: "POST",   path: "/api/pharmacy/medicines",            desc: "Add medicine" },
      { method: "GET",    path: "/api/pharmacy/inventory",            desc: "Get inventory" },
      { method: "PATCH",  path: "/api/pharmacy/inventory",            desc: "Update stock" },
      { method: "GET",    path: "/api/pharmacy/orders",               desc: "List orders" },
      { method: "POST",   path: "/api/pharmacy/orders",               desc: "Create order" },
      { method: "PATCH",  path: "/api/pharmacy/orders",               desc: "Update order status" },
      { method: "GET",    path: "/api/pharmacy/queue",                desc: "Fulfillment queue" },
      { method: "PATCH",  path: "/api/pharmacy/queue",                desc: "Update queue item" },
      { method: "GET",    path: "/api/pharmacy/vendors",              desc: "List vendors" },
      { method: "POST",   path: "/api/pharmacy/vendors",              desc: "Add vendor" },
      { method: "POST",   path: "/api/pharmacy/questions",            desc: "Submit pharmacy query" },
    ]},
    {
      group: "Medicine Reminders",
      base: "/api/reminders",
      endpoints: [
        {
          method: "GET",
          path: "/api/reminders",
          desc: "List medicine reminders"
        },
        {
          method: "POST",
          path: "/api/reminders",
          desc: "Create medicine reminder"
        },
        {
          method: "PUT",
          path: "/api/reminders/:id",
          desc: "Update reminder"
        },
        {
          method: "DELETE",
          path: "/api/reminders/:id",
          desc: "Delete reminder"
        }
      ]
    },
    { group: "Lab",           base: "/api/lab",            endpoints: [
      { method: "GET",    path: "/api/lab/queue",                     desc: "Get lab test queue" },
      { method: "PATCH",  path: "/api/lab/update-status",             desc: "Update test status" },
      { method: "POST",   path: "/api/lab/upload-report",             desc: "Upload lab report" },
      { method: "GET",    path: "/api/lab/reports",                   desc: "List all reports" },
    ]},
    { group: "Billing",       base: "/api/billing",        endpoints: [
      { method: "GET",    path: "/api/billing/invoices",              desc: "List invoices" },
      { method: "POST",   path: "/api/billing/generate",              desc: "Generate invoice" },
      { method: "PATCH",  path: "/api/billing/pay",                   desc: "Mark invoice paid" },
      { method: "GET",    path: "/api/billing/revenue",               desc: "Revenue summary" },
      { method: "GET",    path: "/api/billing/payments",              desc: "Payment history" },
    ]},
    { group: "Insurance",     base: "/api/insurance",      endpoints: [
      { method: "GET",    path: "/api/insurance/claims",              desc: "List claims" },
      { method: "POST",   path: "/api/insurance/create",              desc: "Submit claim" },
      { method: "PATCH",  path: "/api/insurance/approve",             desc: "Approve claim" },
      { method: "PATCH",  path: "/api/insurance/reject",              desc: "Reject claim" },
    ]},
    { group: "Emergency",     base: "/api/emergency",      endpoints: [
      { method: "GET",    path: "/api/emergency/cases",               desc: "List emergency cases" },
      { method: "POST",   path: "/api/emergency/create",              desc: "Create emergency case" },
      { method: "PATCH",  path: "/api/emergency/update-status",       desc: "Update case status" },
      { method: "PATCH",  path: "/api/emergency/assign-bed",          desc: "Assign bed to case" },
    ]},
    { group: "Telemedicine",  base: "/api/telemedicine",   endpoints: [
      { method: "GET",    path: "/api/telemedicine/sessions",         desc: "List sessions" },
      { method: "POST",   path: "/api/telemedicine/create",           desc: "Create session" },
      { method: "PATCH",  path: "/api/telemedicine/update-status",    desc: "Update session status" },
    ]},
    { group: "Reception",     base: "/api/reception",      endpoints: [
      { method: "GET",    path: "/api/reception/queue",               desc: "Reception queue" },
      { method: "POST",   path: "/api/reception/walk-in",             desc: "Register walk-in patient" },
      { method: "POST",   path: "/api/reception/check-in",            desc: "Check in patient" },
      { method: "PATCH",  path: "/api/reception/walk-in-status",      desc: "Update walk-in status" },
      { method: "PATCH",  path: "/api/reception/toggle-doctor",       desc: "Toggle doctor availability" },
    ]},
    { group: "Notifications", base: "/api/notifications",  endpoints: [
      { method: "GET",    path: "/api/notifications",                 desc: "Get user notifications" },
      { method: "POST",   path: "/api/notifications/create",          desc: "Create notification" },
      { method: "PATCH",  path: "/api/notifications/read",            desc: "Mark notification(s) read" },
    ]},
    { group: "Payment",       base: "/api/payment",        endpoints: [
      { method: "POST",   path: "/api/payment/create-order",          desc: "Create Razorpay order" },
      { method: "POST",   path: "/api/payment/verify",                desc: "Verify payment signature" },
    ]},
    { group: "Contact",       base: "/api/contact",        endpoints: [
      { method: "POST",   path: "/api/contact",                       desc: "Submit contact form" },
    ]},
    { group: "Audit",         base: "/api/audit-logs",     endpoints: [
      { method: "GET",    path: "/api/audit-logs",                    desc: "Get audit logs (admin only)" },
    ]},
    { group: "Health",        base: "/health",             endpoints: [
      { method: "GET",    path: "/health",                            desc: "Server health check" },
    ]},
  ];

  const totalEndpoints = routes.reduce((a, g) => a + g.endpoints.length, 0);

  res.json({
    success: true,
    name: "Medilink API Server",
    status: "ok",
    uptime,
    uptime_str: uptimeStr,
    routes: routes.map((g) => ({
      group: g.group,
      base: g.base,
      endpoints: g.endpoints.length,
    })),
    total_endpoints: totalEndpoints,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Medilink Express backend running on http://localhost:${PORT}`);
});

export default app;
