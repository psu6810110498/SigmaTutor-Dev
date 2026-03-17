"use client";

// ── AnimatedStats — แสดงตัวเลขสถิติจริงด้วย count-up animation ──────────────
// รับ props จาก about/page.tsx (Server Component ดึง API)
// ──────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from "react";
import { Users, BookOpen, GraduationCap, Star } from "lucide-react";

interface StatsProps {
  totalStudents: number;
  totalCourses: number;
  totalTeachers: number;
}

// Props ของแต่ละ Stat Item
interface StatItem {
  icon: React.ReactNode;
  end: number;
  suffix: string;
  label: string;
  decimals?: number;
}

// Hook: count-up animation พร้อม ease-out cubic
function useCountUp(end: number, duration: number, decimals: number, active: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let startTime: number | null = null;

    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const eased = 1 - Math.pow(1 - Math.min((ts - startTime) / duration, 1), 3);
      setValue(Number((eased * end).toFixed(decimals)));
      if (eased < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, decimals, active]);

  return value;
}

// ── StatItem Component ───────────────────────────────────────────────────────

function StatItemView({ icon, end, suffix, label, decimals = 0, active }: StatItem & { active: boolean }) {
  const value = useCountUp(end, 1600, decimals, active);

  return (
    <div className="flex flex-col items-center text-white">
      <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-4xl font-extrabold tabular-nums tracking-tight">
        {decimals > 0 ? value.toFixed(decimals) : value.toLocaleString('th-TH')}{suffix}
      </p>
      <p className="text-sm text-blue-200 mt-2 text-center">{label}</p>
    </div>
  );
}

// ── AnimatedStats Component ─────────────────────────────────────────────────

export function AnimatedStats({ totalStudents, totalCourses, totalTeachers }: StatsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  // เริ่ม animation เมื่อ Section เลื่อนเข้ามาในหน้าจอ
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // กำหนด Stats จาก props จริง + format เป็น X+ 
  const STATS: StatItem[] = [
    { icon: <Users className="w-7 h-7" />,         end: totalStudents,  suffix: "+", label: "นักเรียนทั้งหมด" },
    { icon: <BookOpen className="w-7 h-7" />,       end: totalCourses,   suffix: "+", label: "คอร์สที่เปิดสอน" },
    { icon: <GraduationCap className="w-7 h-7" />,  end: totalTeachers,  suffix: "+", label: "ครูผู้เชี่ยวชาญ" },
    { icon: <Star className="w-7 h-7" />,           end: 4.9,            suffix: "",  label: "คะแนนเฉลี่ย", decimals: 1 },
  ];

  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {STATS.map((stat, i) => (
        <StatItemView key={i} {...stat} active={active} />
      ))}
    </div>
  );
}
