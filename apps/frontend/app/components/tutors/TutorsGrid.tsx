"use client";

import React, { useState, useMemo } from "react";
import { Search, Users } from "lucide-react";
import { TutorCard } from "./TutorCard";
import type { InstructorPublic } from "@/app/lib/types";

interface TutorsGridProps {
  tutors: InstructorPublic[];
}

export function TutorsGrid({ tutors }: TutorsGridProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return tutors;
    return tutors.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.nickname?.toLowerCase().includes(q) ||
        t.expertise?.toLowerCase().includes(q) ||
        t.title?.toLowerCase().includes(q)
    );
  }, [tutors, query]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Search bar */}
      <div className="flex items-center gap-4 mb-10">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาครู ชื่อ หรือวิชา..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm shadow-sm"
          />
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>{filtered.length} คน</span>
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">ไม่พบครูที่ค้นหา</p>
          <p className="text-sm mt-1">ลองค้นหาด้วยชื่อหรือวิชาอื่น</p>
        </div>
      )}
    </div>
  );
}
