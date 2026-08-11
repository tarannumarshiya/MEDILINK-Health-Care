import rateLimit from "express-rate-limit";

const isTest = process.env.NODE_ENV === "test";

/** General API limiter: 120 req / min per IP */
export const apiLimiter = rateLimit({
  windowMs: isTest ? 1000 : 60 * 1000,
  max: isTest ? 5 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

/** Strict limiter for auth endpoints: 10 req / 15 min per IP */
export const authLimiter = rateLimit({
  windowMs: isTest ? 1000 : 15 * 60 * 1000,
  max: isTest ? 2 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later." },
});

/** Appointment booking: 20 req / 10 min per IP */
export const bookingLimiter = rateLimit({
  windowMs: isTest ? 1000 : 10 * 60 * 1000,
  max: isTest ? 2 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many booking requests, please slow down." },
});
