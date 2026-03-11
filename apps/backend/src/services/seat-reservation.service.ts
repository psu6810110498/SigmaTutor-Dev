/**
 * SeatReservationService
 *
 * Manages temporary seat holds using Redis atomic operations.
 * Used for ONLINE_LIVE and ONSITE courses that have a maxSeats limit.
 *
 * Key Design:
 *  - SEATS:AVAILABLE:{courseId}       → Integer counter (available seats)
 *  - RESERVATION:{courseId}:{userId}  → stripeSessionId, TTL-based
 *  - Lua Script ensures atomic READ+WRITE to prevent race conditions
 */

import { getRedisClient } from '../lib/redis.client.js';

// ── Types ─────────────────────────────────────────────────

export type ReserveResult = 'OK' | 'FULL' | 'ALREADY_RESERVED';

// ── Redis Key Helpers ─────────────────────────────────────

const KEYS = {
  availableCounter: (courseId: string) => `SEATS:AVAILABLE:${courseId}`,
  reservation: (courseId: string, userId: string) => `RESERVATION:${courseId}:${userId}`,
  reservationPattern: (courseId: string) => `RESERVATION:${courseId}:*`,
  availabilityCache: (courseId: string) => `AVAILABILITY:${courseId}`,
};

// Stripe กำหนดขั้นต่ำ 30 นาที ต้องตั้ง TTL ให้ตรงหรือมากกว่า
const DEFAULT_TTL = 1800; // 30 minutes (Stripe minimum for expires_at)

// ── Lua Scripts ───────────────────────────────────────────

/**
 * Atomic reserve: checks availability and creates reservation in one operation.
 * KEYS[1] = SEATS:AVAILABLE:{courseId}
 * KEYS[2] = RESERVATION:{courseId}:{userId}
 * ARGV[1] = sessionId (value to store)
 * ARGV[2] = TTL in seconds
 *
 * Returns: 'OK' | 'FULL' | 'ALREADY_RESERVED'
 */
const RESERVE_SCRIPT = `
local available = redis.call('GET', KEYS[1])
if not available or tonumber(available) <= 0 then
  return 'FULL'
end
local existing = redis.call('GET', KEYS[2])
if existing then
  redis.call('EXPIRE', KEYS[2], tonumber(ARGV[2]))
  return 'ALREADY_RESERVED'
end
redis.call('DECR', KEYS[1])
redis.call('SET', KEYS[2], ARGV[1], 'EX', tonumber(ARGV[2]))
return 'OK'
`;

// ── Service ───────────────────────────────────────────────

export class SeatReservationService {
  /**
   * Atomically reserve a seat for a user.
   * Returns 'OK' if reserved, 'FULL' if no seats, 'ALREADY_RESERVED' if user already holds one.
   */
  async reserve(
    courseId: string,
    userId: string,
    sessionId = 'pending',
    ttl = DEFAULT_TTL,
  ): Promise<ReserveResult> {
    const redis = getRedisClient();
    if (!redis) throw new Error('Redis unavailable — cannot reserve seat');

    const result = await redis.eval(
      RESERVE_SCRIPT,
      2,
      KEYS.availableCounter(courseId),
      KEYS.reservation(courseId, userId),
      sessionId,
      String(ttl),
    );

    return result as ReserveResult;
  }

  /**
   * Release a reservation and restore the available counter.
   * Called on: session expired, checkout cancelled.
   */
  async release(courseId: string, userId: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    const key = KEYS.reservation(courseId, userId);
    const existed = await redis.del(key);

    if (existed > 0) {
      await redis.incr(KEYS.availableCounter(courseId));
    }

    await this.invalidateCache(courseId);
  }

  /**
   * Release multiple reservations at once (used for rollback or batch release).
   */
  async releaseMany(courseIds: string[], userId: string): Promise<void> {
    await Promise.all(courseIds.map((id) => this.release(id, userId)));
  }

  /**
   * Confirm reservation after successful payment.
   * Removes the reservation key WITHOUT restoring the counter
   * because the seat is now consumed as an enrollment.
   */
  async confirm(courseId: string, userId: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    await redis.del(KEYS.reservation(courseId, userId));
    await this.invalidateCache(courseId);
  }

  /**
   * Confirm multiple reservations after successful payment.
   */
  async confirmMany(courseIds: string[], userId: string): Promise<void> {
    await Promise.all(courseIds.map((id) => this.confirm(id, userId)));
  }

  /**
   * Check if a user currently holds a reservation for a course.
   */
  async hasReservation(courseId: string, userId: string): Promise<boolean> {
    const redis = getRedisClient();
    if (!redis) return false;

    const result = await redis.exists(KEYS.reservation(courseId, userId));
    return result === 1;
  }

  /**
   * Count active reservations for a course.
   * Uses SCAN to avoid blocking Redis on large datasets.
   */
  async countReservations(courseId: string): Promise<number> {
    const redis = getRedisClient();
    if (!redis) return 0;

    const keys = await this.scanKeys(redis, KEYS.reservationPattern(courseId));
    return keys.length;
  }

  /**
   * Get the TTL of the earliest-expiring reservation for a course.
   * Used to display countdown timer in UI.
   * Returns seconds remaining, or null if no reservations.
   */
  async getEarliestExpiry(courseId: string): Promise<number | null> {
    const redis = getRedisClient();
    if (!redis) return null;

    const keys = await this.scanKeys(redis, KEYS.reservationPattern(courseId));
    if (keys.length === 0) return null;

    const ttls = await Promise.all(keys.map((key) => redis.ttl(key)));
    const validTtls = ttls.filter((t) => t > 0);
    if (validTtls.length === 0) return null;

    return Math.min(...validTtls);
  }

  /**
   * Get current available count from Redis counter.
   * Returns null if counter not initialised (cache miss).
   */
  async getAvailableCount(courseId: string): Promise<number | null> {
    const redis = getRedisClient();
    if (!redis) return null;

    const value = await redis.get(KEYS.availableCounter(courseId));
    if (value === null) return null;

    return Math.max(0, parseInt(value, 10));
  }

  /**
   * Initialise or reset the available counter from DB values.
   * Call on: first access, Redis restart, admin updates maxSeats.
   *
   * ไม่ตั้ง TTL เพราะ counter นี้ต้องอยู่ตลอดชีวิตคอร์ส
   * ไม่ใช่ cache — ถ้าหมดอายุจะทำให้คอร์สดูเต็มผิดพลาด
   */
  async syncCounter(
    courseId: string,
    maxSeats: number,
    activeEnrollments: number,
    activeReservations: number,
  ): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    const available = Math.max(0, maxSeats - activeEnrollments - activeReservations);
    // ไม่ใส่ EX (no expiry) — counter ต้องอยู่ถาวรจนกว่าจะถูก sync ใหม่
    await redis.set(KEYS.availableCounter(courseId), String(available));
  }

  /**
   * ตรวจสอบว่า counter มีใน Redis แล้วหรือยัง
   * ถ้ายังไม่มี ให้ sync จาก DB ก่อน (ป้องกัน false FULL หลัง Redis restart)
   *
   * รับ callback สำหรับดึงข้อมูลจาก DB (เพื่อไม่ให้ service นี้ import Prisma โดยตรง)
   */
  async ensureCounter(
    courseId: string,
    fetchFromDb: () => Promise<{ maxSeats: number; enrolledCount: number }>,
  ): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    // ถ้า key มีอยู่แล้ว ไม่ต้องทำอะไร
    const exists = await redis.exists(KEYS.availableCounter(courseId));
    if (exists) return;

    // Cache miss → sync จาก DB
    const { maxSeats, enrolledCount } = await fetchFromDb();
    const reservedCount = await this.countReservations(courseId);
    await this.syncCounter(courseId, maxSeats, enrolledCount, reservedCount);
  }

  /**
   * Invalidate the availability cache for a course.
   * Called after any enrollment or reservation change.
   */
  async invalidateCache(courseId: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;

    await redis.del(KEYS.availabilityCache(courseId));
  }

  // ── Private Helpers ──────────────────────────────────────

  private async scanKeys(redis: NonNullable<ReturnType<typeof getRedisClient>>, pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== '0');

    return keys;
  }
}

export const seatReservationService = new SeatReservationService();
