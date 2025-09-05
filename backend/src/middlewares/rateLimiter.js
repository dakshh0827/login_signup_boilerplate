// server/src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Relaxed rate limiter for auth endpoints (for development)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased from 10 to 100
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Relaxed rate limiter for OTP requests
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Increased from 3 to 20
  message: {
    success: false,
    message: 'Too many OTP requests, please wait before requesting again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Relaxed password reset rate limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Increased from 5 to 50
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export {
  generalLimiter,
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
};