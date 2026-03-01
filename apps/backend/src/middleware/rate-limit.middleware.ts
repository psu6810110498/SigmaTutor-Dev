import rateLimit from 'express-rate-limit';

// Global API Rate Limiter
// Limit each IP to 500 requests per 15 minutes (เพิ่มขึ้นเพื่อรองรับ frontend ที่เรียกหลาย API พร้อมกัน)
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per windowMs (เพิ่มจาก 300)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again after 15 minutes',
    },
    // Skip rate limiting for health check
    skip: (req) => req.path === '/health',
});

// Auth Rate Limiter (stricter)
// Limit login/register attempts to 5 per 15 minutes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many login attempts, please try again later',
    },
});

/**
 * Rate limiter for public (unauthenticated) read endpoints.
 * Applied to /courses/marketplace and /tutors.
 * Allows 100 requests per minute per IP.
 */
export const publicApiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Too many requests. Please slow down and try again.',
    },
});
