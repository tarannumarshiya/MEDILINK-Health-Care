import { Request, Response, NextFunction } from "express";
import logger from "../lib/logger";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      ip: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      durationMs: duration,
      userAgent: req.get("user-agent"),
    };

    if (res.statusCode >= 500) {
      logger.error(`Request failed: ${req.method} ${logData.url}`, null, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`Request warning: ${req.method} ${logData.url} - ${res.statusCode}`, logData);
    } else {
      logger.info(`Request success: ${req.method} ${logData.url} - ${res.statusCode}`, logData);
    }
  });

  next();
}
