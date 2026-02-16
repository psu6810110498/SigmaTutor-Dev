'use client';

import { useState, useEffect } from 'react';
import { FiClock, FiVideo, FiPlus, FiArrowRight, FiCalendar, FiSearch } from 'react-icons/fi';
import Link from 'next/link';
// ✅ แก้ไขพาร์ทการ Import ให้ถูกต้องตามโครงสร้างโฟลเดอร์ของคุณ
import { useAuth } from '../../../context/AuthContext';

// --- Types ---
type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

interface Course {
  id: number;
  title: string;
  code: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  color: string;
  instructor: string;
  progress: number;
  isLive?: boolean;
}

// --- Mock Data (ว่างไว้ก่อน) ---
const myCourses: Course[] = []; 

const dayMap: Record<string, string> = {
  'Monday': 'จ.', 'Tuesday': 'อ.', 'Wednesday': 'พ.', 
  'Thursday': 'พฤ.', 'Friday': 'ศ.', 'Saturday': 'ส.', 'Sunday': 'อา.'
};

const fullDayMap: Record<string, string> = {
  'Monday': 'วันจันทร์', 'Tuesday': 'วันอังคาร', 'Wednesday': 'วันพุธ', 
  'Thursday': 'วันพฤหัสบดี', 'Friday': 'วันศุกร์', 'Saturday': 'วันเสาร์', 'Sunday': 'วันอาทิตย์'
};

export default function DashboardPage() {
  // ✅ ดึงข้อมูล user และ loading จากสมองส่วนกลาง
  const { user, loading } = useAuth();
  
  const [today, setToday] = useState<DayOfWeek>('Monday');
  const [todaysPlan, setTodaysPlan] = useState<Course[]>([]);

  useEffect(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = days[new Date().getDay()] as DayOfWeek;
    setToday(currentDayName);

    const plan = myCourses.filter(course => course.day === currentDayName);
    plan.sort((a, b) => a.startTime.localeCompare(b.startTime));
    setTodaysPlan(plan);
  }, []);

  // ✅ แสดงสถานะ Loading ระหว่างรอข้อมูลจาก Google เพื่อป้องกันชื่อขึ้น undefined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="font-sans">
      
      {/* Header - ✅ ปรับให้แสดงชื่อ User จริง และแก้ปัญหา undefined */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          {/* ถ้ามีชื่อในระบบให้ใช้ชื่อนั้น ถ้าไม่มีให้ใช้ชื่อเริ่มต้นที่คุณสมัครไว้ */}
          สวัสดี, คุณ{user?.name || 'พรหมธาดา'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {user ? `ยินดีต้อนรับกลับสู่ระบบ (${user.email})` : 'จัดการแผนการเรียนและตารางเวลาของคุณ'}
        </p>
      </div>

      {/* --- Section 1: Today's Plan --- */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center border-l-4 border-blue-600 pl-3">
            <h2 className="text-lg font-bold text-gray-800">แผนการเรียนวันนี้ ({fullDayMap[today]})</h2>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
             {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {todaysPlan.length > 0 ? (
            todaysPlan.map((course) => (
              <div key={course.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                 <h4 className="font-bold">{course.title}</h4>
              </div>
            ))
          ) : (
            <div className="col-span-full md:col-span-2 bg-white rounded-2xl p-8 border border-dashed border-gray-200 text-center flex flex-col items-center justify-center min-h-[200px]">
                <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mb-4">
                    <FiCalendar size={32} />
                </div>
                <h3 className="text-gray-800 font-bold text-lg">วันนี้ไม่มีตารางเรียน</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-sm">
                  คุณยังไม่ได้ลงทะเบียนเรียนวิชาใดๆ หรือวันนี้เป็นวันหยุดพักผ่อนของคุณ
                </p>
                <Link href="/courses" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center shadow-lg shadow-blue-200">
                    <FiSearch className="mr-2" /> ค้นหาคอร์สเรียนใหม่
                </Link>
            </div>
          )}

          <button className="border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all min-h-[200px] group">
             <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
               <FiPlus size={24} />
             </div>
             <span className="text-sm font-medium">เพิ่มแผนการเรียนส่วนตัว</span>
          </button>
        </div>
      </div>

      {/* --- Section 2: Weekly Schedule --- */}
      <div>
        <div className="flex items-center mb-4 border-l-4 border-orange-500 pl-3">
          <h2 className="text-lg font-bold text-gray-800">ตารางเรียนรายสัปดาห์</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overflow-x-auto">
          <div className="grid grid-cols-7 gap-3 min-w-[800px]">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
               <div key={day} className={`text-center mb-2 pb-2 border-b-2 ${day === today ? 'border-blue-500' : 'border-transparent'}`}>
                 <span className={`text-sm font-bold block ${day === today ? 'text-blue-600' : 'text-gray-400'}`}>
                   {dayMap[day]}
                 </span>
               </div>
            ))}
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <div key={day} className={`space-y-2 min-h-[150px] p-2 rounded-lg ${day === today ? 'bg-blue-50/20' : 'bg-gray-50/30'} flex flex-col items-center justify-center`}>
                  <div className="w-full h-full flex items-center justify-center opacity-10">
                      <span className="text-xl font-bold text-gray-300">-</span>
                  </div>
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}