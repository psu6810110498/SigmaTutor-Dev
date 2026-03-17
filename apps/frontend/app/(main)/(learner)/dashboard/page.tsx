'use client';

import { useState, useEffect, useMemo } from 'react';
import { FiClock, FiVideo, FiPlus, FiArrowRight, FiCalendar, FiSearch, FiBookOpen, FiPlay, FiMapPin, FiAward } from 'react-icons/fi';
import Link from 'next/link';
import { courseApi } from '@/app/lib/api';

// ✅ แก้ไขพาร์ทการ Import ให้ถูกต้องตามโครงสร้างโฟลเดอร์ของคุณ
import { useAuth } from '../../../context/AuthContext';

// --- Types ---
type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

interface UpcomingSchedule {
  id: string;
  type?: 'OFFICIAL' | 'SELF_STUDY';
  courseId: string;
  courseTitle: string;
  courseType: 'ONLINE_LIVE' | 'ONSITE' | 'ONLINE';
  topic: string;
  lessonTitle?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  zoomLink: string | null;
  isOnline: boolean;
  status: string;
}

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



export default function DashboardPage() {
  // ✅ ดึงข้อมูล user และ loading จากสมองส่วนกลาง
  const { user, loading } = useAuth();


  const [upcomingSchedules, setUpcomingSchedules] = useState<UpcomingSchedule[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [enrolledLoading, setEnrolledLoading] = useState(true);

  const [selfStudySessions, setSelfStudySessions] = useState<any[]>([]);

  // Refresh schedules callback (used after adding a self-study session)
  const refreshSchedules = async () => {
    try {
      const data = await courseApi.getUpcomingSchedules();
      if (data.success) setUpcomingSchedules(data.data);
      // Also refresh self-study sessions
      const ssData = await courseApi.getAllSelfStudy();
      if (ssData.success) setSelfStudySessions(ssData.data);
    } catch (e) { console.error(e); }
  };



  // ✅ ดึงตารางเรียนวัันนี้จาก API
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await courseApi.getUpcomingSchedules();
         if (res.success && res.data) {
          setUpcomingSchedules(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch upcoming schedules:', error);
      } finally {
        setScheduleLoading(false);
      }
    };
    if (user) {
      fetchSchedules();
    } else {
      setScheduleLoading(false);
    }
  }, [user]);

  // ✅ ดึงคอร์สที่ enrolled จาก API
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
        const res = await fetch(`${apiUrl}/courses/my-courses`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success) {
          setEnrolledCourses(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch enrolled courses:', error);
      } finally {
        setEnrolledLoading(false);
      }
    };

    if (user) {
      fetchEnrolledCourses();
    } else {
      setEnrolledLoading(false);
    }
  }, [user]);

  // ✅ ดึงแผนการเรียนส่วนตัว
  useEffect(() => {
    if (user) {
      courseApi.getAllSelfStudy().then(res => {
        if (res.success) setSelfStudySessions(res.data);
      });
    }
  }, [user]);

  const upcomingSelfStudyForCards = selfStudySessions
    .filter((s: any) => new Date(s.startTime).getTime() >= Date.now())
    .slice(0, 3);

  // ✅ แยกข้อมูลตารางเรียน
  const todayStr = new Date().toDateString();
  const isToday = (isoStr: string) => new Date(isoStr).toDateString() === todayStr;
  const todaySchedules = upcomingSchedules.filter(s => isToday(s.date));
  const todayOnsiteSchedules = todaySchedules.filter(s => s.courseType === 'ONSITE');
  const todayLiveSchedules = todaySchedules.filter(s => s.courseType === 'ONLINE_LIVE');
  const futureSchedules = upcomingSchedules.filter(s => !isToday(s.date));

  const renderTodayCard = (schedule: any) => {
    const formatTime = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    };
    const formatShortDate = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    const isLive = schedule.courseType === 'ONLINE_LIVE';

    return (
      <div key={schedule.id} className={`bg-white rounded-[20px] p-5 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 group transition-all overflow-hidden ${isLive ? 'border border-blue-200 border-l-[6px] border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-white' : 'border border-orange-200 border-l-[6px] border-l-orange-400 bg-gradient-to-r from-orange-50/50 to-white'}`}>
        {/* Left (Icon) + Middle (Info) Wrapper */}
        <div className="flex items-start xl:items-center gap-4 pl-1">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isLive ? 'bg-blue-100 text-blue-500' : 'bg-orange-100 text-orange-500'}`}>
                {isLive ? <FiVideo size={22} /> : <FiAward size={22} />}
            </div>
        
            {/* Content Info */}
            <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1.5">
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${isLive ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                       {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>}
                       {isLive ? 'Live Zoom' : 'Onsite'}
                   </span>
                   {isLive ? (
                       <span className="text-[11px] text-red-500 font-bold">
                           อีก 20 นาที
                       </span>
                   ) : (
                       <span className="text-xs text-gray-500 font-medium tracking-wide">
                           {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                       </span>
                   )}
                </div>
                <h4 className="font-bold text-[15px] text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                    {schedule.courseTitle}
                </h4>
                
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    {isLive ? (
                        <>
                           <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                        </>
                    ) : (
                        <>
                           <FiMapPin className="text-red-400 shrink-0" />
                           <span className="truncate max-w-[200px] text-gray-500">{schedule.location || 'ไม่ระบุสถานที่'}</span>
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* Right section: Action Button */}
        <div className="w-full xl:w-auto mt-2 xl:mt-0">
          {isLive ? (
            schedule.zoomLink ? (
                <a href={schedule.zoomLink} target="_blank" rel="noopener noreferrer" className="w-full xl:w-auto flex items-center justify-center gap-2 text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors py-2 px-6 rounded-xl shadow-sm shadow-blue-200">
                   <FiPlay size={14} />
                   เข้าร่วม Zoom
                </a>
            ) : (
                <button disabled className="w-full xl:w-auto flex items-center justify-center gap-2 text-[13px] font-bold text-gray-500 bg-gray-50 border border-gray-200 py-2 px-6 rounded-xl cursor-not-allowed">
                   <FiVideo className="text-gray-400" size={14} />
                   รอลิงก์เข้าเรียน
                </button>
            )
          ) : (
            <div className="w-full xl:w-auto flex items-center justify-center text-[13px] font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors py-2 px-6 rounded-xl cursor-pointer shadow-sm">
               ดูรายละเอียด
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFutureRow = (schedule: any) => {
    const formatTime = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    };
    const formatShortDate = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    }
    const isLive = schedule.courseType === 'ONLINE_LIVE';

    return (
      <div key={schedule.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-blue-100 transition-colors relative pl-4">
          <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isLive ? 'bg-blue-400' : 'bg-orange-400'}`} />
          
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
             <div className="text-sm text-gray-500 min-w-[120px] font-medium border-r border-gray-100 pr-3">
                {formatShortDate(schedule.date)} | {formatTime(schedule.startTime)}
             </div>
             
             <div className="flex items-center gap-2">
                 <div className="font-bold text-gray-800 truncate max-w-[200px] md:max-w-xs text-sm">
                    {schedule.courseTitle}
                 </div>
                 <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border shrink-0 ${isLive ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-orange-50 text-orange-500 border-orange-100'}`}>
                    {isLive ? 'Live สด' : 'Onsite'}
                 </span>
             </div>
          </div>
          <div className="w-full md:w-auto shrink-0 flex justify-end">
             {isLive ? (
                 <a href={schedule.zoomLink || '#'} target="_blank" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition flex items-center gap-1">
                     เข้าร่วม <FiArrowRight size={12}/>
                 </a>
             ) : (
                 <span className="text-xs font-bold text-orange-500 flex items-center gap-1">
                     <FiMapPin size={12}/> ดูสถานที่
                 </span>
             )}
          </div>
      </div>
    );
  };

  const renderSelfStudyRow = (schedule: any) => {
    const formatTime = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    };
    const formatShortDate = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    }

    return (
      <div key={schedule.id} className="bg-white rounded-xl shadow-sm border border-purple-100 p-3 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-purple-200 transition-colors relative pl-4">
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-purple-400" />
          
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
             <div className="text-sm text-gray-500 min-w-[120px] font-medium border-r border-gray-100 pr-3">
                {formatShortDate(schedule.date)} | {formatTime(schedule.startTime)}
             </div>
             
             <div className="flex items-center gap-2">
                 <div className="font-bold text-gray-800 truncate max-w-[200px] md:max-w-xs text-sm">
                    {schedule.courseTitle}
                 </div>
                 <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm border shrink-0 bg-purple-50 text-purple-600 border-purple-100">
                    เรียนเอง
                 </span>
             </div>
          </div>
          <div className="w-full md:w-auto shrink-0 flex justify-end">
              <span className="text-xs font-bold text-purple-500 flex items-center gap-1">
                  <FiBookOpen size={12}/> {schedule.topic}
              </span>
          </div>
      </div>
    );
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            สวัสดี, คุณ{user?.name || 'สมชาย'}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            เรียนวันนี้ เก่งวันหน้า - มาพัฒนาตัวเองไปด้วยกัน!
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-purple-100 shadow-sm text-purple-600 text-sm font-bold">
            <FiCalendar size={16} /> {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
      {/* --- Section 1: Today's Classes --- */}
      {todaySchedules.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h2 className="text-xl font-bold text-gray-800">
                 🔔 คลาสเรียนวันนี้
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div className="flex flex-col gap-4">
                 {todayOnsiteSchedules.length > 0 ? renderTodayCard(todayOnsiteSchedules[0]) : <div />}
             </div>
             <div className="flex flex-col gap-4">
                 {todayLiveSchedules.length > 0 ? renderTodayCard(todayLiveSchedules[0]) : <div />}
             </div>
          </div>
        </div>
      )}

      {/* --- Section 1.5: Upcoming Classes --- */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center border-l-4 border-blue-600 pl-3">
            <h2 className="text-lg font-bold text-gray-800">
               คลาสที่กำลังจะมาถึง
            </h2>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          {scheduleLoading ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center animate-pulse min-h-[150px] flex items-center justify-center">
              <p className="text-gray-400">กำลังโหลดตารางเรียน...</p>
            </div>
          ) : upcomingSchedules.length > 0 ? (
            upcomingSchedules.slice(0, 3).map((schedule) =>
              schedule.type === 'SELF_STUDY' ? renderSelfStudyRow(schedule) : renderFutureRow(schedule)
            )
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-200 text-center flex flex-col items-center justify-center min-h-[200px]">
              <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mb-4">
                <FiCalendar size={32} />
              </div>
              <h3 className="text-gray-800 font-bold text-lg">ไม่มีตารางเรียนเร็วๆนี้</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm">
                คุณยังไม่ได้ลงทะเบียนเรียนวิชาใดๆ หรือ ไม่มีคลาสเรียนที่กำลังจะมาถึง
              </p>
              <Link href="/explore" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center shadow-lg shadow-blue-200">
                <FiSearch className="mr-2" /> ค้นหาคอร์สที่สนใจ
              </Link>
            </div>
          )}

        </div>
      </div>

      {/* --- Section 1.7: แผนการเรียนส่วนตัว (Purple Cards) --- */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center border-l-4 border-purple-500 pl-3">
            <h2 className="text-lg font-bold text-gray-800">แผนการเรียนส่วนตัว</h2>
          </div>
          <Link href="/my-planner" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
            ดูทั้งหมด <FiArrowRight size={14} />
          </Link>
        </div>

        {upcomingSelfStudyForCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingSelfStudyForCards.map((s: any) => (
              <div key={s.id} className="bg-white rounded-[20px] p-5 border border-purple-200 border-l-[6px] border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-white group transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-500 flex items-center justify-center shrink-0">
                    <FiBookOpen size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 inline-flex items-center gap-1">
                        <FiPlay size={8} /> เรียนเอง
                      </span>
                    </div>
                    <h4 className="font-bold text-[14px] text-gray-900 line-clamp-1">{s.courseTitle}</h4>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-1">{s.topic}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><FiCalendar size={11}/> {new Date(s.startTime).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                  <span className="flex items-center gap-1 text-purple-600 font-medium"><FiClock size={11}/> {new Date(s.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-dashed border-purple-200 text-center flex flex-col items-center justify-center min-h-[120px]">
            <FiBookOpen className="text-purple-200 mb-2" size={28} />
            <p className="text-gray-400 text-sm mb-3">ยังไม่มีแผนการเรียน</p>
            <Link href="/my-planner/add" className="px-4 py-2 text-purple-600 text-xs font-bold bg-purple-50 hover:bg-purple-100 rounded-lg transition">
              <FiPlus className="inline mr-1" size={14} /> เพิ่มแผนเรียนแรกของคุณ
            </Link>
          </div>
        )}

        {/* Add Plan Button - always visible below the cards */}
        <div className="mt-4">
          <Link href="/my-planner/add" className="w-full border border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center gap-3 text-gray-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/50 transition-all group">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
              <FiPlus size={18} />
            </div>
            <span className="text-sm font-bold">เพิ่มแผนการเรียนส่วนตัว</span>
          </Link>
        </div>
      </div>

      {/* --- Section 2: คอร์สที่ลงทะเบียน --- */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center border-l-4 border-green-500 pl-3">
            <h2 className="text-lg font-bold text-gray-800">คอร์สที่ลงทะเบียน</h2>
          </div>
          <Link href="/my-courses" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            ดูทั้งหมด <FiArrowRight size={14} />
          </Link>
        </div>

        {enrolledLoading ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center animate-pulse">
            <p className="text-gray-400 text-sm">กำลังโหลดคอร์สที่ลงทะเบียน...</p>
          </div>
        ) : enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.slice(0, 3).map((course) => (
              <Link key={course.id} href={`/courses/${course.id}/learn`} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all flex gap-4">
                <div className="w-20 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  <img
                    src={course.thumbnail || `https://placehold.co/200x160/2a303c/ffffff?text=${encodeURIComponent(course.categoryName)}`}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{course.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">โดย {course.instructor}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{course.categoryName}</span>
                    <FiPlay size={12} className="text-blue-500" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-200 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-green-50 text-green-300 rounded-full flex items-center justify-center mb-3">
              <FiBookOpen size={28} />
            </div>
            <h3 className="text-gray-800 font-bold">ยังไม่มีคอร์สที่ลงทะเบียน</h3>
            <p className="text-gray-500 text-sm mt-1 mb-4">เริ่มต้นการเรียนรู้โดยเลือกคอร์สที่สนใจ</p>
            <Link href="/explore" className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
              ค้นหาคอร์สเรียน
            </Link>
          </div>
        )}
      </div>

      {/* --- Section 3: Weekly Schedule Timeline --- */}
      <WeeklyTimeline
        upcomingSchedules={upcomingSchedules}
        selfStudySessions={selfStudySessions}
      />


    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// WeeklyTimeline Component
// ═════════════════════════════════════════════════════════════
const WEEK_DAYS_SHORT = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];

function getWeekDates(): Date[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

type TimelineCard = {
  id: string;
  typeLabel: string;
  time: string;
  courseTitle: string;
  location: string | null;
  zoomLink: string | null;
  color: 'purple' | 'orange' | 'blue';
};

function WeeklyTimeline({
  upcomingSchedules,
  selfStudySessions,
}: {
  upcomingSchedules: UpcomingSchedule[];
  selfStudySessions: any[];
}) {
  const weekDates = useMemo(() => getWeekDates(), []);
  const todayStr = new Date().toDateString();

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  };

  // Map schedules to each day
  const cardsByDay = useMemo(() => {
    const map: Record<number, TimelineCard[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];

    // Official schedules
    upcomingSchedules.forEach((s) => {
      if (s.type === 'SELF_STUDY') return;
      const d = new Date(s.date || s.startTime);
      const idx = weekDates.findIndex((wd) => wd.toDateString() === d.toDateString());
      if (idx === -1) return;

      const color: TimelineCard['color'] =
        s.courseType === 'ONLINE_LIVE' ? 'blue' : s.courseType === 'ONSITE' ? 'orange' : 'purple';
      const typeLabel =
        s.courseType === 'ONLINE_LIVE' ? 'Live' : s.courseType === 'ONSITE' ? 'Onsite' : 'VDO';

      map[idx].push({
        id: s.id,
        typeLabel,
        time: s.startTime,
        courseTitle: s.courseTitle,
        location: s.location,
        zoomLink: s.zoomLink,
        color,
      });
    });

    // Self-study sessions
    selfStudySessions.forEach((s: any) => {
      const d = new Date(s.startTime);
      const idx = weekDates.findIndex((wd) => wd.toDateString() === d.toDateString());
      if (idx === -1) return;
      map[idx].push({
        id: s.id,
        typeLabel: 'VDO',
        time: s.startTime,
        courseTitle: s.courseTitle || s.topic || 'เรียนเอง',
        location: null,
        zoomLink: null,
        color: 'purple',
      });
    });

    // Sort each day by time
    for (let i = 0; i < 7; i++) {
      map[i].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    }

    return map;
  }, [upcomingSchedules, selfStudySessions, weekDates]);

  const cardStyles: Record<string, { border: string; bg: string; text: string; badge: string }> = {
    purple: { border: 'border-t-purple-400', bg: 'bg-purple-50/60', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-600' },
    orange: { border: 'border-t-orange-400', bg: 'bg-orange-50/60', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-600' },
    blue:   { border: 'border-t-blue-400',   bg: 'bg-blue-50/60',   text: 'text-blue-600',   badge: 'bg-blue-100 text-blue-600' },
  };

  const renderLocationIndicator = (card: TimelineCard) => {
    if (card.color === 'orange' && card.location) {
      return (
        <span className="flex items-center gap-0.5 text-orange-500">
          <FiMapPin size={9} />
          <span className="truncate max-w-[70px]">{card.location}</span>
        </span>
      );
    }
    if (card.color === 'blue') {
      return (
        <span className="flex items-center gap-0.5 text-blue-500">
          <FiVideo size={9} />
          <span>Zoom</span>
        </span>
      );
    }
    // VDO / Self-study
    return (
      <span className="flex items-center gap-0.5 text-purple-500">
        <FiBookOpen size={9} />
        <span>เรียนเอง</span>
      </span>
    );
  };

  return (
    <div className="mb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center border-l-4 border-orange-500 pl-3">
          <h2 className="text-lg font-bold text-gray-800">ตารางเรียนรายสัปดาห์</h2>
        </div>
        <Link
          href="/my-planner"
          className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
        >
          ดูปฏิทินเต็ม <FiArrowRight size={14} />
        </Link>
      </div>

      {/* Timeline Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-x-auto">
        <div className="grid grid-cols-7 gap-0 min-w-[700px]">
          {/* Row 1: Day names + Dates */}
          {weekDates.map((d, i) => {
            const isToday = d.toDateString() === todayStr;
            return (
              <div key={`head-${i}`} className="text-center mb-3">
                <span className={`text-[11px] font-bold block ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                  {WEEK_DAYS_SHORT[i]}
                </span>
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mt-0.5 ${
                    isToday ? 'bg-blue-600 text-white' : 'text-gray-700'
                  }`}
                >
                  {d.getDate()}
                </span>
              </div>
            );
          })}

          {/* Row 2: Connected dots line */}
          {weekDates.map((d, i) => {
            const isToday = d.toDateString() === todayStr;
            const hasCards = cardsByDay[i].length > 0;
            return (
              <div key={`dot-${i}`} className="flex items-center justify-center relative h-6">
                {i > 0 && (
                  <div className="absolute left-0 right-1/2 top-1/2 h-[2px] bg-gray-200 -translate-y-1/2" />
                )}
                {i < 6 && (
                  <div className="absolute left-1/2 right-0 top-1/2 h-[2px] bg-gray-200 -translate-y-1/2" />
                )}
                <div
                  className={`relative z-10 rounded-full transition-all ${
                    isToday
                      ? 'w-3.5 h-3.5 bg-blue-600 ring-4 ring-blue-100'
                      : hasCards
                        ? 'w-3 h-3 bg-purple-400'
                        : 'w-2.5 h-2.5 bg-gray-300'
                  }`}
                />
              </div>
            );
          })}

          {/* Row 3: Mini-cards */}
          {weekDates.map((d, i) => (
            <div key={`cards-${i}`} className="flex flex-col items-stretch gap-2 mt-3 px-1 min-h-[70px]">
              {cardsByDay[i].length > 0 ? (
                cardsByDay[i].map((card) => {
                  const s = cardStyles[card.color];
                  return (
                    <div
                      key={card.id}
                      className={`${s.bg} rounded-lg border border-gray-100 border-t-[3px] ${s.border} p-2 transition-all hover:shadow-sm`}
                    >
                      {/* Type badge + Time */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`${s.badge} text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none`}>
                          {card.typeLabel}
                        </span>
                        <span className={`${s.text} text-[9px] font-semibold`}>
                          {fmtTime(card.time)}
                        </span>
                      </div>
                      {/* Course title */}
                      <p className="text-[10px] font-bold text-gray-700 line-clamp-2 leading-tight mb-1">
                        {card.courseTitle}
                      </p>
                      {/* Location / Link indicator */}
                      <div className="text-[9px] font-medium">
                        {renderLocationIndicator(card)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center flex-1">
                  <span className="text-[10px] text-gray-300">—</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}