'use client';

import type { CourseAvailability } from '@/app/lib/types';

interface Props {
  availability: CourseAvailability;
  className?: string;
}

export function SeatStatusBadge({ availability, className = '' }: Props) {
  if (!availability.isLimited) return null;

  const remaining = availability.remaining ?? 0;

  if (availability.isFull && !availability.isReservedOnly) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 ${className}`}>
        เต็มแล้ว
      </span>
    );
  }

  if (availability.isReservedOnly) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700 ${className}`}>
        จองชั่วคราว
      </span>
    );
  }

  if (remaining <= 5) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-700 ${className}`}>
        เหลือ {remaining} ที่
      </span>
    );
  }

  if (remaining <= 10) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-700 ${className}`}>
        เหลือ {remaining} ที่
      </span>
    );
  }

  return null;
}
