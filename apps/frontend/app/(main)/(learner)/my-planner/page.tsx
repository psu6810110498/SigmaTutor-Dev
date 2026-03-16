'use client';

import { useState, useEffect, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiPlus, FiClock, FiBookOpen, FiTrash2, FiCalendar } from 'react-icons/fi';
import { courseApi } from '@/app/lib/api';
import Link from 'next/link';

type SelfStudySession = {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string | null;
  lessonId: string | null;
  lessonTitle: string | null;
  topic: string;
  startTime: string;
  endTime: string;
  createdAt: string;
};

// ── Helpers ──────────────────────────────────────────────────
const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];
const DAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
}
function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ═════════════════════════════════════════════════════════════
export default function MyPlannerPage() {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [sessions, setSessions] = useState<SelfStudySession[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await courseApi.getAllSelfStudy();
      if (res.success) setSessions(res.data);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, []);

  // ── Calendar grid generation ─────────────────────────────
  const calendarCells = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [currentYear, currentMonth]);

  // Session lookup by day
  const sessionsByDay = useMemo(() => {
    const map: Record<number, SelfStudySession[]> = {};
    sessions.forEach(s => {
      const d = new Date(s.startTime);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(s);
      }
    });
    return map;
  }, [sessions, currentYear, currentMonth]);

  const selectedDaySessions = useMemo(() => {
    if (!selectedDate) return [];
    return sessions.filter(s => isSameDay(new Date(s.startTime), selectedDate));
  }, [sessions, selectedDate]);

  const upcomingSessions = useMemo(() => {
    const nowTs = Date.now();
    return sessions
      .filter(s => new Date(s.startTime).getTime() >= nowTs)
      .slice(0, 5);
  }, [sessions]);

  // Navigation
  const goToPrev = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const goToNext = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };
  const goToToday = () => { setCurrentMonth(now.getMonth()); setCurrentYear(now.getFullYear()); };

  const handleDelete = async (id: string) => {
    await courseApi.deleteSelfStudy(id);
    fetchSessions();
  };

  const todayDate = now.getDate();
  const isCurrentMonth = now.getFullYear() === currentYear && now.getMonth() === currentMonth;

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiCalendar className="text-purple-500" /> แผนการเรียนส่วนตัว
          </h1>
          <p className="text-gray-500 text-sm mt-1">วางแผน กำหนดเวลาเรียน VOD ของคุณ</p>
        </div>
        <Link
          href="/my-planner/add"
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition shadow-sm shadow-purple-200"
        >
          <FiPlus size={16} /> เพิ่มแผนเรียน
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ━━━ Calendar ━━━ */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={goToPrev} className="p-2 hover:bg-gray-100 rounded-lg transition"><FiChevronLeft size={20} /></button>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-800">{MONTHS_TH[currentMonth]} {currentYear + 543}</h2>
              {!isCurrentMonth && (
                <button onClick={goToToday} className="text-xs text-purple-600 font-bold hover:underline mt-0.5">วันนี้</button>
              )}
            </div>
            <button onClick={goToNext} className="p-2 hover:bg-gray-100 rounded-lg transition"><FiChevronRight size={20} /></button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_TH.map(d => (
              <div key={d} className="text-center text-xs font-bold text-gray-400 py-2">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, i) => {
              if (day === null) return <div key={i} className="aspect-square" />;
              const isToday = isCurrentMonth && day === todayDate;
              const daySessions = sessionsByDay[day] || [];
              const isSelected = selectedDate
                && selectedDate.getFullYear() === currentYear
                && selectedDate.getMonth() === currentMonth
                && selectedDate.getDate() === day;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all relative
                    ${isSelected ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : ''}
                    ${isToday && !isSelected ? 'bg-purple-50 text-purple-700 ring-2 ring-purple-300' : ''}
                    ${!isToday && !isSelected ? 'hover:bg-gray-50 text-gray-700' : ''}
                  `}
                >
                  {day}
                  {daySessions.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {daySessions.slice(0, 3).map((_, idx) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-purple-400'}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ━━━ Side Panel ━━━ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          {selectedDate ? (
            <>
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FiBookOpen className="text-purple-500" size={18} />
                {formatShortDate(selectedDate.toISOString())}
              </h3>
              {selectedDaySessions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 bg-purple-50 text-purple-300 rounded-full flex items-center justify-center mb-3">
                    <FiCalendar size={28} />
                  </div>
                  <p className="text-gray-400 text-sm mb-4">ไม่มีแผนเรียนในวันนี้</p>
                  <Link
                    href="/my-planner/add"
                    className="px-4 py-2 text-purple-600 text-xs font-bold hover:bg-purple-50 rounded-lg transition"
                  >
                    <FiPlus className="inline mr-1" size={14} /> เพิ่มแผนเรียน
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {selectedDaySessions.map(s => (
                    <div key={s.id} className="bg-purple-50/60 rounded-xl p-3.5 border border-purple-100 group">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">เรียนเอง</span>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition p-1"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                      <h4 className="font-bold text-sm text-gray-800 mb-1 line-clamp-1">{s.courseTitle}</h4>
                      <p className="text-xs text-gray-500 mb-1.5">{s.topic}</p>
                      <div className="flex items-center gap-1.5 text-xs text-purple-600 font-medium">
                        <FiClock size={12} />
                        {formatTime(s.startTime)} - {formatTime(s.endTime)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h3 className="font-bold text-gray-800 mb-4">📅 แผนเรียนที่กำลังจะมาถึง</h3>
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                </div>
              ) : upcomingSessions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 bg-purple-50 text-purple-300 rounded-full flex items-center justify-center mb-3">
                    <FiBookOpen size={28} />
                  </div>
                  <p className="text-gray-400 text-sm mb-4">ยังไม่มีแผนเรียน</p>
                  <Link
                    href="/my-planner/add"
                    className="px-4 py-2 text-purple-600 text-xs font-bold hover:bg-purple-50 rounded-lg transition"
                  >
                    <FiPlus className="inline mr-1" size={14} /> เพิ่มแผนเรียนแรกของคุณ
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {upcomingSessions.map(s => (
                    <div key={s.id} className="bg-purple-50/40 rounded-xl p-3.5 border border-purple-100 group hover:border-purple-200 transition">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">เรียนเอง</span>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition p-1"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                      <h4 className="font-bold text-sm text-gray-800 mb-0.5 line-clamp-1">{s.courseTitle}</h4>
                      <p className="text-xs text-gray-500 mb-1">{s.topic}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1"><FiCalendar size={11}/> {formatShortDate(s.startTime)}</span>
                        <span className="flex items-center gap-1 text-purple-600"><FiClock size={11}/> {formatTime(s.startTime)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>


    </div>
  );
}
