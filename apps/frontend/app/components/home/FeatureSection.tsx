'use client';

import React from 'react';
import { Video, Award, Clock, Users } from 'lucide-react';

const FEATURES = [
  {
    icon: Video,
    color: 'text-primary',
    bg: 'bg-primary/10',
    title: 'เนื้อหาเข้มข้น เจาะลึก',
    description: 'บทเรียนออกแบบมาเพื่อการสอบแข่งขันโดยเฉพาะ อัดแน่นด้วยเทคนิคและโจทย์จริง',
  },
  {
    icon: Users,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    title: 'ติวเตอร์ระดับประเทศ',
    description: 'เรียนกับอาจารย์ผู้เชี่ยวชาญที่มีประสบการณ์สอนมากกว่า 10 ปี',
  },
  {
    icon: Clock,
    color: 'text-green-600',
    bg: 'bg-green-50',
    title: 'เรียนได้ทุกที่ ทุกเวลา',
    description: 'ระบบรองรับทุกอุปกรณ์ ทบทวนซ้ำได้ไม่จำกัดตลอดอายุคอร์สเรียน',
  },
  {
    icon: Award,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    title: 'การันตีผลลัพธ์',
    description: 'นักเรียนกว่า 90% สอบติดในคณะที่หวัง พร้อมใบรับรองเมื่อเรียนจบ',
  },
];

export default function FeatureSection() {
  return (
    <section className="py-16 md:py-24 bg-linear-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-primary font-semibold text-sm mb-2 tracking-wide uppercase">
            Why Sigma?
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ทำไมต้องเลือก <span className="text-primary">Sigma Tutor?</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            เรามุ่งมั่นพัฒนาแพลตฟอร์มการเรียนรู้ที่ดีที่สุด เพื่อส่งต่อความสำเร็จให้กับผู้เรียนทุกคน
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div
                  className={`w-14 h-14 ${feature.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
