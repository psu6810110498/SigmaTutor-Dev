'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  expiresInSeconds: number;
  onExpired?: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ReservationCountdown({ expiresInSeconds, onExpired }: Props) {
  const [remaining, setRemaining] = useState(Math.max(0, expiresInSeconds));
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  useEffect(() => {
    setRemaining(Math.max(0, expiresInSeconds));
  }, [expiresInSeconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onExpiredRef.current?.();
      return;
    }

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpiredRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining]);

  if (remaining <= 0) return null;

  const isUrgent = remaining <= 60;

  return (
    <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border ${
      isUrgent
        ? 'bg-red-50 border-red-200 text-red-700'
        : 'bg-orange-50 border-orange-200 text-orange-700'
    }`}>
      <Clock size={14} className="shrink-0" />
      <span>
        ที่นั่งอาจว่างอีกครั้งใน{' '}
        <span className={`font-mono font-bold ${isUrgent ? 'text-red-600' : 'text-orange-600'}`}>
          {formatTime(remaining)}
        </span>
      </span>
    </div>
  );
}
