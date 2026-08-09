import "dotenv/config";

/**
 * Centralised, fail-closed runtime configuration.
 *
 * Payment mode has NO default fallback to "mock". Startup fails unless the
 * environment explicitly resolves to a known payment mode, so a misconfigured
 * deployment can never silently serve mock payments in a live environment.
 */

export type AppEnv = "development" | "trial" | "production";
export type PaymentMode = "mock" | "razorpay";

function readAppEnv(): AppEnv {
  const raw = (process.env.APP_ENV ?? process.env.NODE_ENV ?? "").toLowerCase();
  if (["production", "prod"].includes(raw)) return "production";
  if (["trial", "staging"].includes(raw)) return "trial";
  if (["development", "dev"].includes(raw) || raw === "") return "development";
  throw new Error(`Invalid APP_ENV value: '${raw}'`);
}

function readPaymentMode(demoMode: boolean, appEnv: AppEnv): PaymentMode {
  // Accept both PAYMENT_MODE and legacy PAYMENTS_MODE, preferring PAYMENT_MODE.
  const raw =
    (process.env.PAYMENT_MODE || process.env.PAYMENTS_MODE || "").toLowerCase();

  if (raw === "mock") {
    // Mock is only permitted inside an explicit demo/trial environment.
    if (appEnv === "production") {
      throw new Error("PAYMENT_MODE=mock is forbidden when APP_ENV=production");
    }
    if (!demoMode) {
      throw new Error("PAYMENT_MODE=mock requires DEMO_MODE=true");
    }
    return "mock";
  }

  if (raw === "razorpay" || raw === "live" || raw === "razorpay-live") {
    return "razorpay";
  }

  // No acceptable value → fail closed rather than silently defaulting to mock.
  throw new Error(
    "PAYMENT_MODE must be explicitly set to 'mock' (DEMO_MODE=true, non-production) or 'razorpay'. Refusing to start."
  );
}

const appEnv: AppEnv = readAppEnv();
const demoMode: boolean = String(process.env.DEMO_MODE ?? "false").toLowerCase() === "true";
const paymentMode: PaymentMode = readPaymentMode(demoMode, appEnv);

export interface BackendConfig {
  appEnv: AppEnv;
  nodeEnv: string;
  port: number;
  corsOrigins: string[];
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  demoMode: boolean;
  paymentMode: PaymentMode;
  brevoApiKey: string;
  brevoSenderEmail: string;
  brevoSenderName: string;
}

export const config: BackendConfig = {
  appEnv,
  nodeEnv: (process.env.NODE_ENV ?? appEnv).toLowerCase(),
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((o: string) => o.trim())
    .filter(Boolean),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
  demoMode,
  paymentMode,
  brevoApiKey: process.env.BREVO_API_KEY ?? "",
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL ?? "",
  brevoSenderName: process.env.BREVO_SENDER_NAME ?? "Medilink Digital Health Care",
};

/** Validate required env vars; product mode is stricter. */
export function validateRequiredConfig(warn: (m: string) => void = console.warn): void {
  const missing: string[] = [];
  if (!config.supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!config.supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!config.supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (config.paymentMode === "razorpay") {
    if (!config.razorpayKeyId) missing.push("RAZORPAY_KEY_ID");
    if (!config.razorpayKeySecret) missing.push("RAZORPAY_KEY_SECRET");
  }

  if (missing.length > 0) {
    const msg = `Missing required environment variables: ${missing.join(", ")}`;
    if (config.appEnv === "production" || config.paymentMode === "razorpay") {
      throw new Error(msg);
    }
    warn(`[config] ${msg}`);
  }
}