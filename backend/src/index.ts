import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { config, validateRequiredConfig } from "./lib/config";
import { apiLimiter, authLimiter, bookingLimiter } from "./middleware/security";
import swaggerUi from "swagger-ui-express";
import openapiSpec from "./openapi.json";

import adminRoutes from "./routes/admin";
import appointmentRoutes from "./routes/appointments";
import doctorRoutes from "./routes/doctor";
import patientRoutes from "./routes/patients";
import contactRoutes from "./routes/contact";
import paymentRoutes from "./routes/payment";
import pharmacyRoutes from "./routes/pharmacy";
import reminderRoutes from "./routes/reminders";
import labRoutes from "./routes/lab";
import billingRoutes from "./routes/billing";
import insuranceRoutes from "./routes/insurance";
import emergencyRoutes from "./routes/emergency";
import telemedicineRoutes from "./routes/telemedicine";
import receptionRoutes from "./routes/reception";
import notificationRoutes from "./routes/notifications";
import auditRoutes from "./routes/audit";


import { requestLogger } from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";
import { idempotency } from "./middleware/idempotency";
import { requestTimeout } from "./middleware/timeout";

const app = express();
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
  contentSecurityPolicy: false,     // handled by Next.js on the frontend
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
  if (req.path === "/api/contact" && req.headers["content-length"]) {
    const contentLength = parseInt(req.headers["content-length"], 10);
    if (contentLength > 100 * 1024) {
      const err = new Error("request entity too large");
      (err as any).status = 413;
      return next(err);
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
app.use("/api/admin", adminRoutes);
app.use("/api/appointments", bookingLimiter, appointmentRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/patients", authLimiter, patientRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/lab", labRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/insurance", insuranceRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/telemedicine", telemedicineRoutes);
app.use("/api/reception", receptionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit-logs", auditRoutes);

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
    {
      group: "Admin", base: "/api/admin", endpoints: [
        { method: "GET", path: "/api/admin/departments", desc: "List all departments" },
        { method: "POST", path: "/api/admin/departments", desc: "Create department" },
        { method: "PATCH", path: "/api/admin/departments", desc: "Toggle department active state" },
        { method: "GET", path: "/api/admin/doctors", desc: "List active doctors" },
        { method: "POST", path: "/api/admin/doctors", desc: "Register doctor" },
        { method: "PATCH", path: "/api/admin/doctors", desc: "Update doctor availability" },
        { method: "POST", path: "/api/admin/appointments/approve", desc: "Approve appointment" },
        { method: "POST", path: "/api/admin/appointments/reject", desc: "Reject appointment" },
        { method: "PATCH", path: "/api/admin/appointments", desc: "Assign doctor to appointment" },
        { method: "GET", path: "/api/admin/contact-messages", desc: "List contact messages" },
        { method: "PATCH", path: "/api/admin/contact-messages", desc: "Mark message read" },
      ]
    },
    {
      group: "Appointments", base: "/api/appointments", endpoints: [
        { method: "POST", path: "/api/appointments/create", desc: "Book appointment" },
        { method: "POST", path: "/api/appointments/track", desc: "Track appointment by code" },
      ]
    },
    {
      group: "Doctor", base: "/api/doctor", endpoints: [
        { method: "GET", path: "/api/doctor/queue", desc: "Get doctor's appointment queue" },
        { method: "PATCH", path: "/api/doctor/start-consultation", desc: "Start consultation" },
        { method: "POST", path: "/api/doctor/prescription", desc: "Write prescription" },
        { method: "GET", path: "/api/doctor/lab-report", desc: "Get lab report for appointment" },
        { method: "PATCH", path: "/api/doctor/complete", desc: "Complete appointment" },
        { method: "GET", path: "/api/doctor/patient-history", desc: "Get patient history" },
      ]
    },
    {
      group: "Patients", base: "/api/patients", endpoints: [
        { method: "POST", path: "/api/patients/register", desc: "Register patient" },
      ]
    },
    {
      group: "Pharmacy", base: "/api/pharmacy", endpoints: [
        { method: "GET", path: "/api/pharmacy/medicines", desc: "List medicines" },
        { method: "POST", path: "/api/pharmacy/medicines", desc: "Add medicine" },
        { method: "GET", path: "/api/pharmacy/inventory", desc: "Get inventory" },
        { method: "PATCH", path: "/api/pharmacy/inventory", desc: "Update stock" },
        { method: "GET", path: "/api/pharmacy/orders", desc: "List orders" },
        { method: "POST", path: "/api/pharmacy/orders", desc: "Create order" },
        { method: "PATCH", path: "/api/pharmacy/orders", desc: "Update order status" },
        { method: "GET", path: "/api/pharmacy/queue", desc: "Fulfillment queue" },
        { method: "PATCH", path: "/api/pharmacy/queue", desc: "Update queue item" },
        { method: "GET", path: "/api/pharmacy/vendors", desc: "List vendors" },
        { method: "POST", path: "/api/pharmacy/vendors", desc: "Add vendor" },
        { method: "POST", path: "/api/pharmacy/questions", desc: "Submit pharmacy query" },
      ]
    },
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
    {
      group: "Lab", base: "/api/lab", endpoints: [
        { method: "GET", path: "/api/lab/queue", desc: "Get lab test queue" },
        { method: "PATCH", path: "/api/lab/update-status", desc: "Update test status" },
        { method: "POST", path: "/api/lab/upload-report", desc: "Upload lab report" },
        { method: "GET", path: "/api/lab/reports", desc: "List all reports" },
      ]
    },
    {
      group: "Billing", base: "/api/billing", endpoints: [
        { method: "GET", path: "/api/billing/invoices", desc: "List invoices" },
        { method: "POST", path: "/api/billing/generate", desc: "Generate invoice" },
        { method: "PATCH", path: "/api/billing/pay", desc: "Mark invoice paid" },
        { method: "GET", path: "/api/billing/revenue", desc: "Revenue summary" },
        { method: "GET", path: "/api/billing/payments", desc: "Payment history" },
      ]
    },
    {
      group: "Insurance", base: "/api/insurance", endpoints: [
        { method: "GET", path: "/api/insurance/claims", desc: "List claims" },
        { method: "POST", path: "/api/insurance/create", desc: "Submit claim" },
        { method: "PATCH", path: "/api/insurance/approve", desc: "Approve claim" },
        { method: "PATCH", path: "/api/insurance/reject", desc: "Reject claim" },
      ]
    },
    {
      group: "Emergency", base: "/api/emergency", endpoints: [
        { method: "GET", path: "/api/emergency/cases", desc: "List emergency cases" },
        { method: "POST", path: "/api/emergency/create", desc: "Create emergency case" },
        { method: "PATCH", path: "/api/emergency/update-status", desc: "Update case status" },
        { method: "PATCH", path: "/api/emergency/assign-bed", desc: "Assign bed to case" },
      ]
    },
    {
      group: "Telemedicine", base: "/api/telemedicine", endpoints: [
        { method: "GET", path: "/api/telemedicine/sessions", desc: "List sessions" },
        { method: "POST", path: "/api/telemedicine/create", desc: "Create session" },
        { method: "PATCH", path: "/api/telemedicine/update-status", desc: "Update session status" },
      ]
    },
    {
      group: "Reception", base: "/api/reception", endpoints: [
        { method: "GET", path: "/api/reception/queue", desc: "Reception queue" },
        { method: "POST", path: "/api/reception/walk-in", desc: "Register walk-in patient" },
        { method: "POST", path: "/api/reception/check-in", desc: "Check in patient" },
        { method: "PATCH", path: "/api/reception/walk-in-status", desc: "Update walk-in status" },
        { method: "PATCH", path: "/api/reception/toggle-doctor", desc: "Toggle doctor availability" },
      ]
    },
    {
      group: "Notifications", base: "/api/notifications", endpoints: [
        { method: "GET", path: "/api/notifications", desc: "Get user notifications" },
        { method: "POST", path: "/api/notifications/create", desc: "Create notification" },
        { method: "PATCH", path: "/api/notifications/read", desc: "Mark notification(s) read" },
      ]
    },
    {
      group: "Payment", base: "/api/payment", endpoints: [
        { method: "POST", path: "/api/payment/create-order", desc: "Create Razorpay order" },
        { method: "POST", path: "/api/payment/verify", desc: "Verify payment signature" },
      ]
    },
    {
      group: "Contact", base: "/api/contact", endpoints: [
        { method: "POST", path: "/api/contact", desc: "Submit contact form" },
      ]
    },
    {
      group: "Audit", base: "/api/audit-logs", endpoints: [
        { method: "GET", path: "/api/audit-logs", desc: "Get audit logs (admin only)" },
      ]
    },
    {
      group: "Health", base: "/health", endpoints: [
        { method: "GET", path: "/health", desc: "Server health check" },
      ]
    },
  ];

  const methodColor: Record<string, string> = {
    GET: "#10b981",
    POST: "#3b82f6",
    PATCH: "#f59e0b",
    PUT: "#8b5cf6",
    DELETE: "#ef4444",
  };

  const groupColors = [
    "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444",
    "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
    "#06b6d4", "#a855f7", "#22c55e", "#e11d48", "#0284c7",
  ];

  const routeCards = routes.map((group, gi) => {
    const color = groupColors[gi % groupColors.length];
    const rows = group.endpoints.map(ep => `
      <tr>
        <td style="padding:7px 10px;width:70px;text-align:center">
          <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:.5px;background:${methodColor[ep.method] ?? "#64748b"}22;color:${methodColor[ep.method] ?? "#64748b"};border:1px solid ${methodColor[ep.method] ?? "#64748b"}44">${ep.method}</span>
        </td>
        <td style="padding:7px 10px;font-family:monospace;font-size:12.5px;color:#e2e8f0">${ep.path}</td>
        <td style="padding:7px 10px;font-size:12px;color:#94a3b8">${ep.desc}</td>
      </tr>`).join("");

    return `
    <div style="background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;margin-bottom:16px">
      <div style="padding:12px 16px;background:${color}18;border-bottom:1px solid ${color}33;display:flex;align-items:center;gap:8px">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;box-shadow:0 0 6px ${color}"></span>
        <span style="font-weight:700;font-size:13px;color:${color};letter-spacing:.5px;text-transform:uppercase">${group.group}</span>
        <span style="margin-left:4px;font-size:11px;color:#64748b;font-family:monospace">${group.base}</span>
        <span style="margin-left:auto;font-size:11px;color:#475569">${group.endpoints.length} endpoint${group.endpoints.length !== 1 ? "s" : ""}</span>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }).join("");

  const totalEndpoints = routes.reduce((a, g) => a + g.endpoints.length, 0);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Medilink API Server</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0f172a; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; min-height: 100vh; padding: 32px 16px 64px; }
    a { color: #38bdf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
    tr:hover td { background: #ffffff08; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 999px; }
  </style>
</head>
<body>
  <div style="max-width:900px;margin:0 auto">

    <!-- Header -->
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid #1e293b">
      <div style="width:48px;height:48px;background:linear-gradient(135deg,#6366f1,#0ea5e9);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px">🏥</div>
      <div>
        <h1 style="font-size:22px;font-weight:800;color:#f1f5f9;letter-spacing:-.3px">Medilink API Server</h1>
        <p style="font-size:13px;color:#64748b;margin-top:2px">Express · TypeScript · Supabase</p>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
        <span style="display:inline-flex;align-items:center;gap:6px;background:#10b98118;border:1px solid #10b98133;color:#10b981;padding:5px 12px;border-radius:999px;font-size:12px;font-weight:600">
          <span style="width:7px;height:7px;background:#10b981;border-radius:50%;animation:pulse 2s infinite"></span>
          Running
        </span>
      </div>
    </div>

    <!-- Stats bar -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px">
      ${[
      ["🗂️", "Routes", routes.length.toString()],
      ["⚡", "Endpoints", totalEndpoints.toString()],
      ["⏱️", "Uptime", uptimeStr],
      ["🌐", "Port", String(PORT)],
    ].map(([icon, label, val]) => `
      <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:14px 16px">
        <div style="font-size:18px">${icon}</div>
        <div style="font-size:22px;font-weight:800;color:#f1f5f9;margin-top:4px">${val}</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px;text-transform:uppercase;letter-spacing:.5px">${label}</div>
      </div>`).join("")}
    </div>

    <!-- Routes -->
    <h2 style="font-size:14px;font-weight:700;color:#475569;letter-spacing:.8px;text-transform:uppercase;margin-bottom:14px">API Routes</h2>
    ${routeCards}

    <!-- Footer -->
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
      <span style="font-size:12px;color:#475569">Medilink Health Care &copy; ${new Date().getFullYear()}</span>
      <a href="/health" style="font-size:12px;color:#38bdf8">GET /health →</a>
    </div>
  </div>

  <style>
    @keyframes pulse {
      0%,100% { opacity:1; }
      50% { opacity:.4; }
    }
  </style>
</body>
</html>`;

  if (req.headers.accept && req.headers.accept.includes("text/html")) {
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } else {
    res.json({
      success: true,
      name: "Medilink API Server",
      status: "ok",
      uptime,
      uptime_str: uptimeStr,
      total_endpoints: totalEndpoints,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`Medilink Express backend running on http://localhost:${PORT}`);
});

export default app;
