import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../lib/errors";

interface CachedResponse {
  statusCode: number;
  body: any;
  headers: Record<string, string | string[] | undefined>;
}

// In-memory cache for idempotency keys (can be swapped for Redis in cluster setup)
const cacheStore = new Map<string, CachedResponse>();

export function idempotency(req: Request, res: Response, next: NextFunction): void {
  // Only apply to mutate requests (POST, PUT, DELETE)
  if (!["POST", "PUT", "DELETE"].includes(req.method)) {
    return next();
  }

  const idempotencyKey = req.headers["idempotency-key"] as string;

  if (!idempotencyKey) {
    return next();
  }

  if (idempotencyKey.trim().length < 10) {
    throw new BadRequestError("Idempotency key must be a valid unique string (min 10 chars)");
  }

  const cached = cacheStore.get(idempotencyKey);

  if (cached) {
    // Replay response
    res.status(cached.statusCode);
    
    Object.entries(cached.headers).forEach(([key, val]) => {
      if (val !== undefined) res.setHeader(key, val);
    });

    res.setHeader("x-cache-lookup", "HIT - Idempotency Replay");
    res.json(cached.body);
    return;
  }

  // Intercept response and store it
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = (body: any): Response => {
    cacheStore.set(idempotencyKey, {
      statusCode: res.statusCode,
      body,
      headers: res.getHeaders(),
    });
    return originalJson(body);
  };

  res.send = (body: any): Response => {
    let parsedBody = body;
    try {
      parsedBody = JSON.parse(body);
    } catch {}

    cacheStore.set(idempotencyKey, {
      statusCode: res.statusCode,
      body: parsedBody,
      headers: res.getHeaders(),
    });
    return originalSend(body);
  };

  next();
}
