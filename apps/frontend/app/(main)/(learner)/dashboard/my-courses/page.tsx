'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { FiPlay, FiCheckCircle, FiPlus, FiBookOpen } from 'react-icons/fi';
import Link from 'next/link';

interface EnrolledCourse {
    id: string;
    title: string;
    thumbnail: string | null;
    categoryName: string;
    instructor: string;
    courseType: 'ONLINE' | 'ONLINE_LIVE' | 'ONSITE';
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    progress: number;
}

export default function MyCoursesPage() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEnrolledCourses = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
                const res = await fetch(`${apiUrl}/courses/my-courses`, {
                    credentials: 'include',
                });
                const data = await res.json();
                if (data.success) {
                    setCourses(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch enrolled courses:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchEnrolledCourses();
        } else {
            setLoading(false);
        }
    }, [user]);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">คอร์สของฉัน</h1>
                <Link
                    href="/explore"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                    <FiPlus size={16} /> ค้นหาคอร์สเพิ่ม
                </Link>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-gray-400 text-sm text-center py-12 animate-pulse">
                        กำลังโหลดข้อมูลคอร์สเรียน...
                    </p>
                </div>
            ) : courses.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiBookOpen size={32} />
                    </div>
                    <h3 className="text-gray-800 font-bold text-lg mb-2">ยังไม่มีคอร์สที่ลงทะเบียน</h3>
                    <p className="text-gray-500 text-sm mb-6">เริ่มเรียนรู้ได้เลยโดยเลือกคอร์สที่คุณสนใจ</p>
                    <Link
                        href="/explore"
                        className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-200"
                    >
                        <FiPlus className="mr-2" /> ค้นหาคอร์สเรียน
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map((course) => (
                        <div key={course.id} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 hover:shadow-md transition-shadow">
                            {/* Thumbnail */}
                            <div className="w-28 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                <img
                                    src={course.thumbnail || `https://placehold.co/280x200/2a303c/ffffff?text=${encodeURIComponent(course.categoryName)}`}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{course.title}</h3>
                                <p className="text-xs text-gray-500 mt-1">โดย {course.instructor}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                                        {course.categoryName}
                                    </span>
                                    {course.status === 'COMPLETED' ? (
                                        <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5">
                                            <FiCheckCircle size={10} /> เรียนจบแล้ว
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-blue-600">กำลังเรียน</span>
                                    )}
                                </div>
                            </div>

                            {/* Action */}
                            <div className="flex items-center">
                                <Link
                                    href={course.courseType === 'ONLINE_LIVE' ? `/courses/${course.id}/live` : `/courses/${course.id}/learn`}
                                    className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    <FiPlay size={18} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
