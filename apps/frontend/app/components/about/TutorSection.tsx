"use client";

import { useEffect, useState } from 'react';
import { Course, Instructor } from '@/app/lib/types';
import { courseApi } from '@/app/lib/api';
import Image from 'next/image';

export default function TutorSection() {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTutors = async () => {
            try {
                // Fetch courses to find active instructors
                // In a real app, we should have /instructors endpoint
                const res = await courseApi.getMarketplace({ limit: 100 });
                if (res.success && res.data) {
                    // Extract unique instructors
                    const uniqueInstructors = new Map();
                    res.data.courses.forEach(c => {
                        if (c.instructor && !uniqueInstructors.has(c.instructor.id)) {
                            uniqueInstructors.set(c.instructor.id, c.instructor);
                        }
                    });
                    setInstructors(Array.from(uniqueInstructors.values()));
                }
            } catch (error) {
                console.error("Failed to fetch tutors", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTutors();
    }, []);

    if (loading) return null;

    return (
        <section className="py-16 md:py-24 bg-white" id="tutors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">ทีมผู้สอนคุณภาพ</h2>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        เรียนกับตัวจริง ที่มีความเชี่ยวชาญและประสบการณ์สอนยาวนาน
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {instructors.map((tutor) => (
                        <div
                            key={tutor.id}
                            id={`tutor-${tutor.id}`} // Anchor Target
                            className="flex flex-col items-center text-center group scroll-mt-32"
                        >
                            <div className="w-32 h-32 md:w-40 md:h-40 relative rounded-full overflow-hidden mb-4 border-4 border-gray-100 group-hover:border-primary/20 transition-colors">
                                {tutor.profileImage ? (
                                    <Image
                                        src={tutor.profileImage}
                                        alt={tutor.name}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-3xl font-bold">
                                        {tutor.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 mb-1">{tutor.name}</h3>
                            <p className="text-sm text-primary font-medium mb-2">{tutor.title || 'Instructor'}</p>
                            <p className="text-xs text-gray-500 line-clamp-3 max-w-xs">{tutor.bio || 'ผู้เชี่ยวชาญด้านการสอน'}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
