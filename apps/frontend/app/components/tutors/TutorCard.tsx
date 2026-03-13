"use client";

import React from "react";
import Link from "next/link";
import { Star, BookOpen, Award, ChevronRight } from "lucide-react";
import type { InstructorPublic } from "@/app/lib/types";

interface TutorCardProps {
  tutor: InstructorPublic;
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= Math.round(value)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">
        {value > 0 ? value.toFixed(1) : "ยังไม่มีรีวิว"}
      </span>
    </div>
  );
}

export function TutorCard({ tutor }: TutorCardProps) {
  const courseCount = tutor._count?.courses ?? tutor.courses?.length ?? 0;
  const firstAchievement = tutor.achievements?.[0];
  const displayName = tutor.nickname ? tutor.nickname : tutor.name;
  const fullName = tutor.nickname ? tutor.name : null;

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Profile area */}
      <div className="relative p-6 pb-4 flex flex-col items-center text-center">
        <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-md mb-4">
          {tutor.profileImage ? (
            <img
              src={tutor.profileImage}
              alt={tutor.name ?? ""}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
              {(tutor.name ?? "?").charAt(0)}
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-900 leading-tight">{displayName}</h3>
        {fullName && <p className="text-xs text-gray-500 mt-0.5">{fullName}</p>}
        {tutor.title && (
          <p className="text-sm text-blue-600 font-medium mt-1">{tutor.title}</p>
        )}

        {/* Achievement badge */}
        {firstAchievement && (
          <div className="mt-2 flex items-center gap-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-3 py-1 text-xs font-medium">
            <Award className="w-3 h-3 flex-shrink-0" />
            <span className="truncate max-w-[180px]">{firstAchievement}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-6 pb-4 flex-1 flex flex-col gap-3">
        {/* Rating */}
        <StarRating value={tutor.averageRating ?? 0} />

        {/* Expertise */}
        {tutor.expertise && (
          <div className="flex flex-wrap gap-1.5">
            {tutor.expertise
              .split(/[,，/]/)
              .slice(0, 3)
              .map((tag, i) => (
                <span
                  key={i}
                  className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-100"
                >
                  {tag.trim()}
                </span>
              ))}
          </div>
        )}

        {/* Quote */}
        {tutor.quote && (
          <blockquote className="text-sm text-gray-500 italic leading-relaxed border-l-2 border-gray-200 pl-3 line-clamp-2">
            "{tutor.quote}"
          </blockquote>
        )}

        {/* Course count */}
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <BookOpen className="w-4 h-4 text-gray-400" />
          <span>{courseCount} คอร์ส</span>
          {(tutor.totalReviews ?? 0) > 0 && (
            <span className="text-gray-400">· {tutor.totalReviews} รีวิว</span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        <Link
          href={`/tutors/${tutor.id}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          ดูโปรไฟล์
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
