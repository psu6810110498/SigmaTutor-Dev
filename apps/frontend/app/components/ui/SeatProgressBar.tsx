'use client';

import type { CourseAvailability } from '@/app/lib/types';

interface Props {
  availability: CourseAvailability;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

function getColorClass(availability: CourseAvailability): string {
  if (!availability.isFull) {
    const pct = availability.percentage ?? 0;
    if (pct <= 50) return 'bg-green-500';
    if (pct <= 80) return 'bg-yellow-400';
    if (pct <= 95) return 'bg-orange-500';
    return 'bg-red-500';
  }
  if (availability.isReservedOnly) return 'bg-orange-400';
  return 'bg-red-500';
}

function getStatusText(availability: CourseAvailability): string {
  if (availability.isReservedOnly) return 'จองชั่วคราว';
  if (availability.isFull) return 'เต็มแล้ว';
  const r = availability.remaining ?? 0;
  if (r <= 5) return `เหลือเพียง ${r} ที่เท่านั้น!`;
  if (r <= 10) return `เหลือ ${r} ที่`;
  return `${availability.enrolledCount}/${availability.maxSeats} ที่นั่ง`;
}

const heightClass = { sm: 'h-1.5', md: 'h-2', lg: 'h-2.5' };
const textClass = { sm: 'text-xs', md: 'text-sm', lg: 'text-sm' };

export function SeatProgressBar({ availability, size = 'md', showCount = true }: Props) {
  if (!availability.isLimited) return null;

  const colorClass = getColorClass(availability);
  const statusText = getStatusText(availability);
  const pct = Math.min(availability.percentage ?? 0, 100);
  const isUrgent = (availability.remaining ?? 99) <= 5 || availability.isFull;

  return (
    <div className="w-full space-y-1.5">
      {showCount && (
        <div className="flex justify-between items-center">
          <span className={`${textClass[size]} text-gray-500`}>ที่นั่ง</span>
          <span
            className={`${textClass[size]} font-semibold ${
              availability.isFull
                ? 'text-red-600'
                : isUrgent
                ? 'text-orange-600'
                : 'text-gray-700'
            }`}
          >
            {statusText}
          </span>
        </div>
      )}

      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${heightClass[size]}`}>
        <div
          className={`${heightClass[size]} rounded-full transition-all duration-500 ${colorClass} ${
            availability.isReservedOnly ? 'animate-pulse' : ''
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
