'use client';

/**
 * useCourseAvailability
 *
 * Fetches and optionally polls seat availability for a course.
 * Only polls for limited courses (ONLINE_LIVE / ONSITE) that are not yet full.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { availabilityApi } from '@/app/lib/api';
import type { CourseAvailability } from '@/app/lib/types';

interface Options {
  /** Polling interval in ms. Default: 30000 (30s). Set to 0 to disable polling. */
  pollInterval?: number;
  /** Skip fetching entirely (e.g. for ONLINE courses passed from parent). */
  disabled?: boolean;
}

interface UseCourseAvailabilityReturn {
  availability: CourseAvailability | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  // Shortcuts
  isLimited: boolean;
  isFull: boolean;
  isReservedOnly: boolean;
  remaining: number | null;
}

export function useCourseAvailability(
  courseId: string,
  options: Options = {},
): UseCourseAvailabilityReturn {
  const { pollInterval = 30_000, disabled = false } = options;

  const [availability, setAvailability] = useState<CourseAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(!disabled);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAvailability = useCallback(async () => {
    if (!courseId || disabled) return;

    try {
      const res = await availabilityApi.get(courseId);
      if (res.success && res.data) {
        setAvailability(res.data);
        setError(null);
      } else {
        setError(res.error || 'Failed to fetch availability');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, disabled]);

  // Initial fetch
  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Polling — only for limited courses that are not yet permanently full
  useEffect(() => {
    if (disabled || pollInterval <= 0) return;
    if (!availability) return;
    if (!availability.isLimited) return;
    // Stop polling once permanently full (all seats are enrolled, not just reserved)
    if (availability.isFull && !availability.isReservedOnly) return;

    intervalRef.current = setInterval(fetchAvailability, pollInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [availability, disabled, pollInterval, fetchAvailability]);

  return {
    availability,
    isLoading,
    error,
    refetch: fetchAvailability,
    isLimited: availability?.isLimited ?? false,
    isFull: availability?.isFull ?? false,
    isReservedOnly: availability?.isReservedOnly ?? false,
    remaining: availability?.remaining ?? null,
  };
}
