import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test" || process.env.DISABLE_RATE_LIMIT === "true";

/** General API limiter: 1000 req / min per IP */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10000 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.headers["x-skip-rate-limit"] === "true",
  message: { error: "Too many requests, please try again later." },
});

/** Strict limiter for auth endpoints */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.headers["x-skip-rate-limit"] === "true",
  message: { error: "Too many login attempts, please try again later." },
});

/** Appointment booking */
export const bookingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isTest ? 10000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.headers["x-skip-rate-limit"] === "true",
  message: { error: "Too many booking requests, please slow down." },
});
