import React from "react";
import { Metadata } from "next";
import { tutorApi } from "@/app/lib/api";
import { TutorsGrid } from "@/app/components/tutors/TutorsGrid";

export const metadata: Metadata = {
  title: "คุณครูและติวเตอร์ - SigmaTutor",
  description: "พบกับทีมติวเตอร์ผู้เชี่ยวชาญ ที่จะพาคุณไปถึงคณะในฝัน",
};

export const revalidate = 3600;

export default async function TutorsPage() {
  const res = await tutorApi.getAll();
  const tutors = res.data ?? [];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-3">ทีมผู้สอน</p>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            ครูผู้เชี่ยวชาญ<br className="hidden sm:block" />ที่จะพาน้องไปถึงคณะในฝัน
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            ทีมติวเตอร์ของเราคือผู้ที่ประสบความสำเร็จมาแล้วจริงๆ
            พร้อมถ่ายทอดประสบการณ์ที่คุ้มค่าให้น้องทุกคน
          </p>
        </div>
      </section>

      {/* Grid with client-side search */}
      <TutorsGrid tutors={tutors} />
    </main>
  );
}
