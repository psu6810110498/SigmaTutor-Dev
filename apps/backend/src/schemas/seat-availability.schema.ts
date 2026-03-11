/**
 * Seat Availability Schemas & Types
 *
 * Defines the shape of availability data returned by
 * GET /api/courses/:id/availability
 */

import { z } from 'zod';

// ── Response Shape ────────────────────────────────────────

export interface CourseAvailability {
  courseId: string;
  courseType: 'ONLINE' | 'ONLINE_LIVE' | 'ONSITE';

  /** false for ONLINE courses (no seat limit) */
  isLimited: boolean;

  maxSeats: number | null;
  enrolledCount: number;
  reservedCount: number;

  /** null means unlimited (ONLINE) */
  remaining: number | null;

  /** true when enrolledCount + reservedCount >= maxSeats */
  isFull: boolean;

  /**
   * true when full only due to active reservations, not confirmed enrollments.
   * A seat may free up when a pending payment expires.
   */
  isReservedOnly: boolean;

  /** 0–100, null for ONLINE */
  percentage: number | null;

  /** Seconds until the earliest reservation expires. Used for countdown UI. */
  earliestExpiryInSeconds: number | null;
}

// ── Notify Request ────────────────────────────────────────

export const seatNotifySchema = z.object({
  courseId: z.string().min(1),
  email: z.string().email('กรุณากรอกอีเมลให้ถูกต้อง'),
});

export type SeatNotifyInput = z.infer<typeof seatNotifySchema>;
