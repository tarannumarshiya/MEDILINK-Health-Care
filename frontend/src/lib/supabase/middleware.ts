import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SA = "SUPER_ADMIN";
const HA = "HOSPITAL_ADMIN";
const DA = "DEPARTMENT_ADMIN";

/* All known role variants (DB may have old or new strings) */
const ADMIN_ROLES  = [HA, DA, SA, "ADMIN", "admin"];
const DOCTOR_ROLES = ["DOCTOR", "doctor"];
const LAB_ROLES    = ["LAB_ADMIN", "LAB_TECHNICIAN", "TESTER", "tester", "lab"];
const PHARM_ROLES  = ["PHARMACY_ADMIN", "PHARMACIST", "pharmacist"];
const RECEP_ROLES  = ["RECEPTIONIST", "RECEPTION", "reception", "NURSE", "nurse"];
const INSUR_ROLES  = ["INSURANCE_ADMIN", "INSURANCE", "insurance"];
const BILL_ROLES   = ["BILLING", "billing"];
const EMERG_ROLES  = ["EMERGENCY", "emergency"];
const TELE_ROLES   = ["TELEMEDICINE", "telemedicine", ...DOCTOR_ROLES];

const protectedRoutes: Record<string, string[]> = {
  "/super-admin":         [SA],
  "/admin":               ADMIN_ROLES,
  "/doctor":              [...DOCTOR_ROLES, ...ADMIN_ROLES],
  "/reception":           [...RECEP_ROLES,  ...ADMIN_ROLES],
  "/emergency/dashboard": [...EMERG_ROLES,  ...ADMIN_ROLES],
  "/telemedicine":        [...TELE_ROLES,   ...ADMIN_ROLES],
  "/lab":                 [...LAB_ROLES,    ...ADMIN_ROLES],
  "/pharmacy/queue":       [...PHARM_ROLES,  ...ADMIN_ROLES],
  "/pharmacy/login":       [...PHARM_ROLES,  ...ADMIN_ROLES],
  "/insurance/dashboard": [...INSUR_ROLES,  SA],
  "/billing":             [...BILL_ROLES,   ...ADMIN_ROLES],
  "/patient/dashboard":   ["PATIENT", "patient"],
};

const publicRoutes = [
  "/",
  "/about",
  "/patient/journey",
  "/departments",
  "/doctors",
  "/insurance",
  "/contact",
  "/appointment",
  "/patient/track",
  "/emergency",
  "/login",
  "/patient/login",
  "/patient/register",
  "/patient/forgot-password",
  "/patient/reset-password",
  "/admin/login",
  "/doctor/login",
  "/reception/login",
  "/lab/login",
  "/pharmacy",
  "/pharmacy/login",
  "/insurance/login",
  "/billing/login",
  "/emergency/login",
  "/telemedicine/login",
  "/super-admin/login",
];

function getAllowedRoles(pathname: string) {
  const match = Object.entries(protectedRoutes).find(([path]) =>
    pathname.startsWith(path)
  );

  return match?.[1] || null;
}

function getLoginPage(pathname: string): string {
  if (pathname.startsWith("/patient"))          return "/patient/login";
  if (pathname.startsWith("/emergency"))        return "/emergency/login";
  if (pathname.startsWith("/doctor"))           return "/doctor/login";
  if (pathname.startsWith("/lab"))              return "/lab/login";
  if (pathname.startsWith("/pharmacy"))         return "/pharmacy/login";
  if (pathname.startsWith("/reception"))        return "/reception/login";
  if (pathname.startsWith("/billing"))          return "/billing/login";
  if (pathname.startsWith("/insurance"))        return "/insurance/login";
  if (pathname.startsWith("/telemedicine"))     return "/telemedicine/login";
  if (pathname.startsWith("/super-admin"))      return "/login";
  if (pathname.startsWith("/admin"))            return "/admin/login";
  return "/login";
}

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    target.cookies.set(name, value, options);
  });
}

function redirectWithCookies(request: NextRequest, source: NextResponse, path: string) {
  const redirectResponse = NextResponse.redirect(new URL(path, request.url));
  copyCookies(source, redirectResponse);
  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  const { data: { user } } = await supabase.auth.getUser();

  // exact matches OR prefix matches for public route trees
  const publicPrefixes = [
    "/departments",
    "/patient/journey",
    "/patient/track",
    "/patient/forgot-password",
    "/patient/reset-password",
    "/emergency",
  ];
  if (
    publicRoutes.includes(pathname) ||
    publicPrefixes.some(p => pathname.startsWith(p))
  ) {
    return response;
  }

  const allowedRoles = getAllowedRoles(pathname);

  if (!allowedRoles) {
    // Not a known protected route — let it through, the page handles its own auth
    return response;
  }

  if (!user) {
    // Redirect to the portal-specific login, not always /login
    const loginPage = getLoginPage(pathname);
    return redirectWithCookies(request, response, loginPage);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active || !allowedRoles.includes(profile.role)) {
    const loginPage = getLoginPage(pathname);
    return redirectWithCookies(request, response, loginPage);
  }

  return response;
}