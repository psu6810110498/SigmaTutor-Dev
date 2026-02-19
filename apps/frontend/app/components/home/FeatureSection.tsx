"use client";

import React from 'react';
import { Video, Award, Clock, Users } from 'lucide-react';

export default function FeatureSection() {
    const features = [
        {
            icon: <Video className="w-8 h-8 text-primary" />,
            title: "เนื้อหาเข้มข้น เจาะลึก",
            description: "บทเรียนออกแบบมาเพื่อการสอบแข่งขันโดยเฉพาะ อัดแน่นด้วยเทคนิคและโจทย์จริง"
        },
        {
            icon: <Users className="w-8 h-8 text-secondary" />,
            title: "ติวเตอร์ระดับประเทศ",
            description: "เรียนกับอาจารย์ผู้เชี่ยวชาญที่มีประสบการณ์สอนมากกว่า 10 ปี"
        },
        {
            icon: <Clock className="w-8 h-8 text-green-500" />,
            title: "เรียนได้ทุกที่ ทุกเวลา",
            description: "ระบบรองรับทุกอุปกรณ์ ทบทวนซ้ำได้ไม่จำกัดตลอดอายุคอร์สเรียน"
        },
        {
            icon: <Award className="w-8 h-8 text-yellow-500" />,
            title: "การันตีผลลัพธ์",
            description: "นักเรียนกว่า 90% สอบติดในคณะที่หวัง พร้อมใบรับรองเมื่อเรียนจบ"
        }
    ];

    return (
        <section className="py-16 md:py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        ทำไมต้องเลือก <span className="text-primary">Sigma Tutor?</span>
                    </h2>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                        เรามุ่งมั่นพัฒนาแพลตฟอร์มการเรียนรู้ที่ดีที่สุด เพื่อส่งต่อความสำเร็จให้กับผู้เรียนทุกคน
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                        >
                            <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                            <p className="text-gray-500 leading-relaxed font-serif">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
