'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiBookOpen, FiClock, FiCalendar, FiPlay, FiCheck } from 'react-icons/fi';
import { courseApi } from '@/app/lib/api';
import { toast } from 'react-hot-toast';

type VodCourse = {
  id: string;
  title: string;
  thumbnail: string | null;
  chapters: {
    id: string;
    title: string;
    order: number;
    lessons: { id: string; title: string; order: number }[];
  }[];
};

export default function AddStudyPlanPage() {
  const router = useRouter();

  const [vodCourses, setVodCourses] = useState<VodCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Fetch enrolled VOD courses
  useEffect(() => {
    setLoading(true);
    courseApi.getEnrolledVod().then((res) => {
      if (res.success) {
        setVodCourses(res.data);
      }
      setLoading(false);
    });
  }, []);

  // Get lessons for selected course
  const selectedCourse = vodCourses.find(c => c.id === selectedCourseId);
  const allLessons = selectedCourse?.chapters.flatMap(ch =>
    ch.lessons.map(l => ({ ...l, chapterTitle: ch.title }))
  ) || [];

  // Auto-fill topic when lesson is selected
  const handleLessonChange = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    const lesson = allLessons.find(l => l.id === lessonId);
    if (lesson) {
      setTopic(lesson.title);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCourseId) {
      toast.error('กรุณาเลือกคอร์สเรียน');
      return;
    }
    if (!topic) {
      toast.error('กรุณาระบุหัวข้อที่จะเรียน');
      return;
    }
    if (!date) {
      toast.error('กรุณาระบุวันที่');
      return;
    }
    if (!startTime) {
      toast.error('กรุณาระบุเวลาเริ่มต้น');
      return;
    }
    if (!endTime) {
      toast.error('กรุณาระบุเวลาสิ้นสุด');
      return;
    }
    
    if (startTime >= endTime) {
      toast.error('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น');
      return;
    }

    setSubmitting(true);
    try {
      const startISO = new Date(`${date}T${startTime}:00`).toISOString();
      const endISO = new Date(`${date}T${endTime}:00`).toISOString();

      const res = await courseApi.createSelfStudy({
        courseId: selectedCourseId,
        lessonId: selectedLessonId || undefined,
        topic,
        startTime: startISO,
        endTime: endISO,
      });

      if (res.success) {
        toast.success('บันทึกแผนการเรียนสำเร็จ');
        router.push('/my-planner');
      } else {
        toast.error(res.error || 'เกิดข้อผิดพลาด ไม่สามารถบันทึกแผนได้');
      }
    } catch (error: Error | unknown) {
      console.error('Failed to create self-study session:', error);
      const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="font-sans">
      {/* Back link */}
      <Link
        href="/my-planner"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 font-medium mb-6 transition-colors"
      >
        <FiArrowLeft size={16} />
        กลับไปปฏิทิน
      </Link>

      {/* Card container */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Purple gradient header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FiBookOpen size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold">เพิ่มแผนการเรียนส่วนตัว</h1>
                <p className="text-purple-100 text-sm mt-0.5">วางแผนการเรียน VOD ของคุณเองได้ตามสะดวก</p>
              </div>
            </div>
          </div>

          {/* Form body */}
          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
              </div>
            ) : vodCourses.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-purple-50 text-purple-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiPlay size={32} />
                </div>
                <h3 className="text-gray-700 font-bold text-lg mb-2">ไม่พบคอร์ส VOD</h3>
                <p className="text-gray-400 text-sm mb-6">คุณยังไม่ได้ลงทะเบียนคอร์ส VOD ใดๆ</p>
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition"
                >
                  ค้นหาคอร์ส VOD
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Course Selector */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📚 เลือกคอร์สที่ต้องการเรียน
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => {
                      setSelectedCourseId(e.target.value);
                      setSelectedLessonId('');
                      setTopic('');
                    }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-gray-50 hover:bg-white"
                  >
                    <option value="">— เลือกคอร์ส —</option>
                    {vodCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                {/* Lesson Selector (appears after course is selected) */}
                {selectedCourse && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      📖 เลือกบทเรียน (ไม่บังคับ)
                    </label>
                    <select
                      value={selectedLessonId}
                      onChange={(e) => handleLessonChange(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-gray-50 hover:bg-white"
                    >
                      <option value="">— เลือกบทเรียน —</option>
                      {selectedCourse.chapters.map(ch => (
                        <optgroup key={ch.id} label={ch.title}>
                          {ch.lessons.map(l => (
                            <option key={l.id} value={l.id}>{l.title}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                )}

                {/* Topic */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    ✏️ หัวข้อที่จะเรียน
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="เช่น สมการเชิงเส้น บทที่ 3"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-gray-50 hover:bg-white"
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* Date & Time */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">📅 กำหนดวันและเวลาเรียน</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        <FiCalendar className="inline mr-1" size={13} /> วันที่
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-gray-50 hover:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        <FiClock className="inline mr-1" size={13} /> เวลาเริ่ม
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-gray-50 hover:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        <FiClock className="inline mr-1" size={13} /> เวลาสิ้นสุด
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition bg-gray-50 hover:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                  <Link
                    href="/my-planner"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition text-center"
                  >
                    ยกเลิก
                  </Link>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition shadow-sm shadow-purple-200 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <FiCheck size={16} />
                        บันทึกแผนเรียน
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
