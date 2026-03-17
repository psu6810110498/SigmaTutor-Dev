"use client";

// ── TutorCard — Card คุณครูแบบ Symmetric Fixed Height ─────────────────────────
// หลักการ Impeccable: ทุก element มีจุดประสงค์, hierarchy นำสายตา, whitespace หายใจได้
// Layout: Header (gradient+avatar) / Body (info) / Footer (CTA) — fixed height ทุก zone
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Award, Star } from "lucide-react";
import type { InstructorPublic } from "@/app/lib/types";

interface TutorCardProps {
  tutor: InstructorPublic;
}

// กำหนดสี Badge ตาม keyword ของผลงาน/ตำแหน่ง
function getAchievementBadgeClass(text: string): string {
  if (/สอวน|โอลิมปิก|olymp|ตัวแทนประเทศ|posn|[Ii][Pp][Hh][Oo]|[Ii][Mm][Oo]/i.test(text))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (/phd|ปริญญาเอก|ด\.|professor|อาจารย์/i.test(text))
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (/ielts|toefl|toeic|english|ภาษาอังกฤษ/i.test(text))
    return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-gray-50 text-gray-600 border-gray-200";
}

export function TutorCard({ tutor }: TutorCardProps) {
  const courseCount      = tutor._count?.courses ?? tutor.courses?.length ?? 0;
  const displayName      = tutor.nickname ?? tutor.name ?? "ไม่ระบุชื่อ";
  const firstAchievement = tutor.achievements?.[0];
  const expertiseTags    = tutor.expertise?.split(/[,，\/]/).map((s) => s.trim()).filter(Boolean).slice(0, 2) ?? [];
  const rating           = tutor.averageRating ?? 0;

  return (
    // grid-template-rows: header auto, body 1fr, footer auto
    // ทำให้ทุก Card มี CTA อยู่ด้านล่างเสมอ ไม่ว่าเนื้อหาจะยาวแค่ไหน
    <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col">

      {/* Zone 1: Header — Gradient Background + Avatar */}
      <div className="relative h-20 bg-linear-to-r from-blue-600 to-indigo-600 shrink-0">
        {/* Avatar วางตรงกลาง ครึ่งล่างพ้นออก zone */}
        <div className="absolute -bottom-9 inset-x-0 flex justify-center">
          <div className="w-[72px] h-[72px] rounded-full ring-4 ring-white shadow-md overflow-hidden bg-gray-100 shrink-0">
            {tutor.profileImage ? (
              <img
                src={tutor.profileImage}
                alt={tutor.name ?? ""}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                {(tutor.name ?? "?").charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zone 2: Body — ข้อมูลครู (flex-1 ขยายเต็มพื้นที่ว่าง) */}
      <div className="flex-1 flex flex-col items-center text-center pt-12 px-5 pb-4 gap-2">

        {/* ชื่อ + ตำแหน่ง */}
        <div>
          <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-1">{displayName}</h3>
          {tutor.title && (
            <p className="text-xs text-blue-600 font-medium mt-0.5 line-clamp-1">{tutor.title}</p>
          )}
        </div>

        {/* Achievement Badge (1 อัน เท่านั้น เพื่อไม่ให้ล้น) */}
        {firstAchievement && (
          <div className={`flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-xs font-medium w-full justify-center ${getAchievementBadgeClass(firstAchievement)}`}>
            <Award className="w-3 h-3 shrink-0" />
            <span className="truncate">{firstAchievement}</span>
          </div>
        )}

        {/* Expertise Tags (max 2) */}
        {expertiseTags.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center">
            {expertiseTags.map((tag, i) => (
              <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-100">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Rating + จำนวนคอร์ส */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-auto pt-1">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-gray-400" />
            {courseCount} คอร์ส
          </span>
          {rating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Zone 3: Footer — CTA Button (fixed ด้านล่างเสมอ) */}
      <div className="px-5 pb-5 flex-shrink-0">
        <Link
          href={`/tutors/${tutor.id}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          {/* ดูโปรไฟล์ ─ เหมือนเดิม */}
          ดูโปรไฟล์
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
