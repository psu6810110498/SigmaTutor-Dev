"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { FiPlus, FiPlay, FiCheckCircle } from 'react-icons/fi';
import Link from 'next/link';

// กำหนดโครงสร้างข้อมูลคอร์สให้ตรงกับที่ Backend ส่งมา
interface Course {
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ทั้งหมด (All)');

  // ดึงข้อมูลคอร์สของฉันเมื่อหน้าเว็บโหลด
  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${apiUrl}/courses/my-courses`, {
          credentials: 'include', // ✅ ต้องส่งคุกกี้ไปเพื่อยืนยันตัวตน
        });
        const data = await res.json();
        if (data.success) {
          setCourses(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchMyCourses();
  }, [user]);

  // ระบบกรองคอร์สตาม Dropdown
  const filteredCourses = courses.filter(course => {
    if (filter === 'กำลังเรียน (In Progress)') return course.status === 'ACTIVE';
    if (filter === 'เรียนจบแล้ว (Completed)') return course.status === 'COMPLETED';
    return true;
  });

  // ฟังก์ชันแสดงปุ่มและแถบความคืบหน้าตามสถานะคอร์ส
  const renderCourseAction = (course: Course) => {
    if (course.status === 'COMPLETED' || course.progress === 100) {
      return (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">สถานะ:</span>
            <span className="text-xs font-black text-green-500 flex items-center gap-1"><FiCheckCircle /> เรียนจบแล้ว</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
            <div className="bg-green-500 h-1.5 rounded-full w-full"></div>
          </div>
          <Link href={`/course/${course.id}/reviews`} className="block w-full text-center py-2.5 rounded-xl border-2 border-orange-400 text-orange-500 text-sm font-black hover:bg-orange-50 transition-colors">
            รีวิวเลย
          </Link>
        </div>
      );
    }

    if (course.courseType === 'ONLINE_LIVE') {
      return (
        <Link href={`/courses/${course.id}/live`} className="mt-6 block w-full text-center py-3 rounded-xl bg-blue-600 text-white text-sm font-black shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors">
          เข้าร่วมทันที <FiPlay className="inline ml-1" />
        </Link>
      );
    }

    return (
      <Link href={`/courses/${course.id}/learn`} className="mt-6 block w-full text-center py-3 rounded-xl border-2 border-gray-200 text-blue-600 text-sm font-black hover:border-blue-600 transition-colors">
        เข้าเรียนต่อ &rarr;
      </Link>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-500">

      {/* --- ส่วนหัว และ ตัวกรอง --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">คอร์สของฉัน (My Courses)</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">จัดการการเรียนและติดตามความคืบหน้าของคุณ</p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-primary cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <option>ทั้งหมด (All)</option>
          <option>กำลังเรียน (In Progress)</option>
          <option>เรียนจบแล้ว (Completed)</option>
        </select>
      </div>

      {/* --- Course Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {loading ? (
          <div className="col-span-full py-20 text-center text-gray-400 font-bold animate-pulse">
            กำลังโหลดข้อมูลคอร์สเรียนของคุณ...
          </div>
        ) : filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-3xl p-5 shadow-lg shadow-gray-100/50 border border-gray-100 flex flex-col hover:-translate-y-1 transition-transform duration-300">

              {/* ภาพหน้าปกคอร์ส */}
              <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-800 mb-5 group">
                <img
                  src={course.thumbnail || `https://placehold.co/600x400/2a303c/ffffff?text=${course.categoryName}`}
                  alt={course.title}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />

                {/* Badge Category */}
                <div className="absolute top-3 left-3 bg-white/95 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest text-slate-700 uppercase shadow-sm">
                  {course.categoryName}
                </div>

                {/* Badge Live Now (ถ้าเป็น ONLINE_LIVE) */}
                {course.courseType === 'ONLINE_LIVE' && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-lg shadow-red-500/40 animate-pulse">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div> Live Now
                  </div>
                )}
              </div>

              {/* ข้อมูลคอร์ส */}
              <div className="flex-1">
                <h3 className="text-lg font-black text-gray-900 leading-tight line-clamp-2">{course.title}</h3>
                <p className="text-xs text-gray-500 mt-2 font-bold">โดย {course.instructor}</p>
              </div>

              {/* ปุ่ม Action และแถบ Progress */}
              {renderCourseAction(course)}
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-gray-50 rounded-4xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500 font-bold">ไม่พบคอร์สเรียนในหมวดหมู่นี้</p>
          </div>
        )}

        {/* --- Card สำหรับลงทะเบียนคอร์สใหม่ --- */}
        <Link href="/explore" className="flex flex-col items-center justify-center min-h-85 rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-white hover:border-primary hover:shadow-xl hover:shadow-primary/10 transition-all group p-6 cursor-pointer">
          <div className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-primary group-hover:text-primary transition-all shadow-sm">
            <FiPlus className="w-8 h-8 text-gray-400 group-hover:text-primary" />
          </div>
          <h3 className="text-lg font-black text-gray-700 group-hover:text-primary mb-1">ลงทะเบียนคอร์สใหม่</h3>
          <p className="text-xs text-gray-400 font-medium text-center leading-relaxed">ค้นหาและลงทะเบียนวิชาที่คุณสนใจ<br />เพิ่มเติมได้ที่นี่</p>
        </Link>

      </div>
    </div>
  );
}