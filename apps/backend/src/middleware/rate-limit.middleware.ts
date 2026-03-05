/**
 * Rate Limit Middleware
 *
 * Strategy:
 *  - Development: skip all limits to avoid friction during dev
 *  - Production: Redis-backed distributed rate limiting
 *
 * Tiers (by identity):
 *  - Unauthenticated (public)   : strictest
 *  - Authenticated USER         : moderate
 *  - ADMIN / INSTRUCTOR         : lenient (dashboard calls many APIs simultaneously)
 *
 * SOC: only rate limiting config & factory — no business logic
 */

import rateLimit, { Options, RateLimitRequestHandler } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../lib/redis.client.js';

// ─── Constants ──────────────────────────────────────────────────────────────

const IS_DEV = process.env.NODE_ENV === 'development';
const WINDOW_15_MIN = 15 * 60 * 1000;
const WINDOW_1_MIN = 60 * 1000;

/** Skip rate limiting entirely in development. */
const skipInDev = () => IS_DEV;

// ─── Store Factory ───────────────────────────────────────────────────────────

/**
 * Build a RedisStore for the given key prefix.
 * Falls back to in-memory (default) when Redis is unavailable.
 */
function buildStore(prefix: string): Partial<Options> {
    const client = getRedisClient();
    if (!client) return {}; // express-rate-limit defaults to MemoryStore

    return {
        store: new RedisStore({
            // @ts-expect-error: ioredis satisfies the sendCommand interface
            sendCommand: (...args: string[]) => client.call(...args),
            prefix: `rl:${prefix}:`,
        }),
    };
}

// ─── Limiter Factory ─────────────────────────────────────────────────────────

interface LimiterConfig {
    windowMs: number;
    max: number;
    prefix: string;
    message: string;
}

function createLimiter(config: LimiterConfig): RateLimitRequestHandler {
    return rateLimit({
        windowMs: config.windowMs,
        max: config.max,
        standardHeaders: true,  // RateLimit-* headers (RFC 6585)
        legacyHeaders: false,   // Disable X-RateLimit-* (deprecated)
        skip: skipInDev,
        message: {
            success: false,
            error: config.message,
        },
        ...buildStore(config.prefix),
    });
}

// ─── Predefined Limiters ─────────────────────────────────────────────────────

/** Global limiter for all authenticated API requests (applied in index.ts). */
export const apiLimiter = createLimiter({
    windowMs: WINDOW_15_MIN,
    max: 500,
    prefix: 'api',
    message: 'Too many requests. Please try again in 15 minutes.',
});

/** Strict limiter for auth endpoints to prevent brute-force attacks. */
export const authLimiter = createLimiter({
    windowMs: WINDOW_15_MIN,
    max: 15,
    prefix: 'auth',
    message: 'Too many login attempts. Please try again in 15 minutes.',
});

/** Lenient limiter for public read-only endpoints (marketplace, explore). */
export const publicApiLimiter = createLimiter({
    windowMs: WINDOW_1_MIN,
    max: 100,
    prefix: 'public',
    message: 'Too many requests. Please slow down.',
});

// ─── Role-Aware Limiter ──────────────────────────────────────────────────────

const LIMITS_BY_ROLE: Record<string, RateLimitRequestHandler> = {
    ADMIN: createLimiter({
        windowMs: WINDOW_15_MIN,
        max: 3000,
        prefix: 'role:admin',
        message: 'Admin rate limit exceeded. Please try again shortly.',
    }),
    INSTRUCTOR: createLimiter({
        windowMs: WINDOW_15_MIN,
        max: 2000,
        prefix: 'role:instructor',
        message: 'Instructor rate limit exceeded. Please try again shortly.',
    }),
    USER: createLimiter({
        windowMs: WINDOW_15_MIN,
        max: 500,
        prefix: 'role:user',
        message: 'Too many requests. Please try again in 15 minutes.',
    }),
};

/**
 * Middleware that selects the appropriate rate limiter based on the
 * authenticated user's role. Falls back to the global `apiLimiter`
 * for unauthenticated requests.
 *
 * Usage: apply after `authenticate` middleware on protected routes.
 */
export function roleAwareLimiter(req: Request, res: Response, next: NextFunction): void {
    const role = (req as any).user?.role as string | undefined;
    const limiter = (role !== undefined && role in LIMITS_BY_ROLE)
        ? LIMITS_BY_ROLE[role]!
        : apiLimiter;
    limiter(req, res, next);
}
