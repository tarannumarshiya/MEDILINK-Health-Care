import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors";
import logger from "../lib/logger";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : (err.status || err.statusCode || 500);
  const message = err.message || "An unexpected error occurred";

  logger.error(`Error processing request: ${req.method} ${req.originalUrl}`, err, {
    statusCode,
    url: req.originalUrl,
    method: req.method,
  });

  res.status(statusCode).json({
    error: message,
    statusCode,
    // Hide stack traces in production environment if set
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
}
