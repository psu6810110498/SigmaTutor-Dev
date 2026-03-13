"use client";

import React, { useEffect, useRef, useState } from "react";
import { Users, BookOpen, Star, GraduationCap } from "lucide-react";

const STATS = [
  { icon: <Users className="w-7 h-7" />, end: 1200, suffix: "+", label: "นักเรียนทั้งหมด" },
  { icon: <BookOpen className="w-7 h-7" />, end: 40, suffix: "+", label: "คอร์สที่เปิดสอน" },
  { icon: <GraduationCap className="w-7 h-7" />, end: 15, suffix: "+", label: "ครูผู้เชี่ยวชาญ" },
  { icon: <Star className="w-7 h-7" />, end: 4.9, suffix: "", label: "คะแนนเฉลี่ย", decimals: 1 },
];

function useCountUp(end: number, duration = 1600, decimals = 0, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Number((eased * end).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, decimals, active]);
  return value;
}

interface StatItemProps {
  icon: React.ReactNode;
  end: number;
  suffix: string;
  label: string;
  decimals?: number;
  active: boolean;
}

function StatItem({ icon, end, suffix, label, decimals = 0, active }: StatItemProps) {
  const value = useCountUp(end, 1600, decimals, active);
  return (
    <div className="flex flex-col items-center text-white">
      <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-4xl font-extrabold tabular-nums">
        {decimals > 0 ? value.toFixed(decimals) : Math.floor(value)}{suffix}
      </p>
      <p className="text-sm text-blue-200 mt-2 text-center">{label}</p>
    </div>
  );
}

export function AnimatedStats() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {STATS.map((stat, i) => (
        <StatItem key={i} {...stat} active={active} />
      ))}
    </div>
  );
}
