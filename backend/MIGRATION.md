# Medilink — Express Backend Migration Guide

## What changed (backend only)

Every Next.js API route under `src/app/api/` is now an Express router.
**Nothing in the frontend code, UI, or Supabase schema was touched.**

---

## Quick start

```bash
cd medilink-express
npm install
# copy .env and fill in your real keys (same values as .env.local in Next.js)
npm run dev          # ts-node-dev, hot-reload
# or: npm run build && npm start   (production)
```

Server starts on **http://localhost:4000** by default.
Change `PORT` in `.env` to whatever you need.

---

## Route map — identical paths, same verbs

| Original Next.js route | Express endpoint |
|---|---|
| `POST /api/appointments/create` | same |
| `POST /api/appointments/track` | same |
| `POST /api/admin/appointments/approve` | same |
| `POST /api/admin/appointments/reject` | same |
| `PATCH /api/admin/appointments/update-status` | same |
| `GET /api/admin/departments` | same |
| `POST /api/admin/departments` | same |
| `PATCH /api/admin/departments` | same |
| `GET /api/admin/doctors` | same |
| `POST /api/admin/doctors` | same |
| `PATCH /api/admin/doctors` | same |
| `GET /api/admin/contact-messages` | same |
| `PATCH /api/admin/contact-messages` | same |
| `GET /api/doctor/queue` | same |
| `PATCH /api/doctor/start-consultation` | same |
| `POST /api/doctor/prescription` | same |
| `POST /api/patients/register` | same |
| `POST /api/contact` | same |
| `POST /api/payment/create-order` | same |
| `POST /api/payment/verify` | same |
| `GET /api/pharmacy/medicines` | same |
| `POST /api/pharmacy/medicines` | same |
| `GET /api/pharmacy/inventory` | same |
| `PATCH /api/pharmacy/inventory` | same |
| `GET /api/pharmacy/orders` | same |
| `POST /api/pharmacy/orders` | same |
| `PATCH /api/pharmacy/orders` | same |
| `GET /api/pharmacy/queue` | same |
| `PATCH /api/pharmacy/queue` | same |
| `GET /api/pharmacy/vendors` | same |
| `POST /api/pharmacy/vendors` | same |
| `POST /api/pharmacy/questions` | same |

---

## Two things you must update in the Next.js frontend

### 1. Point API calls at the Express server

The frontend currently calls `/api/...` (same-origin, handled by Next.js).
Now it needs to call `http://localhost:4000/api/...`.

**Option A — environment variable (recommended)**

Add to your Next.js `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Then do a project-wide find-and-replace in the frontend:

```
fetch("/api/     →     fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/
```

**Option B — Next.js rewrites (zero code change)**

Add to `next.config.ts`:

```ts
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
    ];
  },
};
export default nextConfig;
```

This is the least invasive option — every existing `fetch("/api/...")` in
the frontend just works. Recommended for a quick migration.

### 2. Pass the Supabase JWT in authenticated requests

The Next.js routes used cookie-based Supabase SSR sessions.
Express reads the `Authorization: Bearer <token>` header instead.

In every page/component that calls a protected endpoint, add the token:

```ts
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();

const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/doctor/queue`, {
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token ?? ""}`,
  },
});
```

**Tip:** Create a small helper so you don't repeat this everywhere:

```ts
// lib/apiFetch.ts
import { createClient } from "@/lib/supabase/client";

export async function apiFetch(path: string, init?: RequestInit) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
      ...init?.headers,
    },
  });
}
```

Replace calls in authenticated pages:
```ts
// Before
const res = await fetch("/api/doctor/queue");

// After
const res = await apiFetch("/api/doctor/queue");
```

Public endpoints (appointments/create, appointments/track, contact, pharmacy/medicines,
pharmacy/orders POST, pharmacy/questions POST) need no token — call them as-is.

---

## CORS

`CORS_ORIGINS` in `.env` controls which frontend origins are allowed.
Default: `http://localhost:3000`.

For production:
```
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## Environment variables

Copy the same values from your Next.js `.env.local` into the Express `.env`.
Key differences:

| Next.js var | Express var | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_SUPABASE_URL` | same |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` | same |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `RAZORPAY_KEY_ID` | stripped `NEXT_PUBLIC_` prefix |
| `RAZORPAY_KEY_SECRET` | `RAZORPAY_KEY_SECRET` | same |
| `PAYMENTS_MODE` | `PAYMENTS_MODE` | same |
| *(new)* | `PORT` | default `4000` |
| *(new)* | `CORS_ORIGINS` | comma-separated allowed origins |

---

## Running both together (dev)

```bash
# Terminal 1 — Next.js frontend (unchanged)
cd medilink-output
npm run dev          # http://localhost:3000

# Terminal 2 — Express backend
cd medilink-express
npm run dev          # http://localhost:4000
```

With the Next.js rewrite option above the frontend never needs to know a
separate port exists — all `/api/*` traffic is transparently forwarded.
