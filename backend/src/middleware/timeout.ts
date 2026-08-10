import { Request, Response, NextFunction } from "express";

/**
 * Middleware that limits the amount of time a request can take before being aborted.
 * Returns a 504 Gateway Timeout status if the timeout limit is exceeded.
 */
export function requestTimeout(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({ error: "Gateway Timeout: Request took too long to respond" });
      }
    }, timeoutMs);

    res.on("finish", () => clearTimeout(timer));
    res.on("close", () => clearTimeout(timer));

    next();
  };
}
