'use client';

// ============================================================
// Course Detail Page — /explore/[id]
// Dynamic layout based on courseType:
//   ONLINE       → Lessons tab
//   ONLINE_LIVE  → Live Schedule tab + How to Join
//   ONSITE       → Location tab + How to Join
// All types → Review tab + Sticky Price Card
// ============================================================

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  PlayCircle,
  Star,
  MapPin,
  Calendar,
  Video,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { courseApi, reviewApi } from '@/app/lib/api';
import { useCourse, toCartItem } from '@/app/context/CourseContext';
import type { Course, Review, ReviewListResponse, CourseType } from '@/app/lib/types';

// ── Tab Config per CourseType ─────────────────────────────
const tabsConfig: Record<CourseType, { key: string; label: string }[]> = {
  ONLINE: [
    { key: 'lessons', label: '📚 เนื้อหาบทเรียน' },
    { key: 'reviews', label: '⭐ รีวิว' },
  ],
  ONLINE_LIVE: [
    { key: 'schedule', label: '📅 ตารางเรียนสด' },
    { key: 'reviews', label: '⭐ รีวิว' },
  ],
  ONSITE: [
    { key: 'location', label: '📍 สถานที่เรียน' },
    { key: 'reviews', label: '⭐ รีวิว' },
  ],
};

const typeBadge: Record<CourseType, { label: string; className: string }> = {
  ONLINE: { label: '🎥 Online', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  ONLINE_LIVE: { label: '📡 สอนสด', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  ONSITE: { label: '📍 Onsite', className: 'bg-orange-50 text-orange-700 border-orange-200' },
};

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params.id as string;
  const { addToCart, isInCart } = useCourse();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lessons');
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewListResponse['stats'] | null>(null);

  // ── Fetch Course ──────────────────────────────────────
  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);

      // Try by slug first, fallback to ID
      let res = await courseApi.getBySlug(slug);
      if (!res.success) {
        res = await courseApi.getById(slug);
      }

      if (res.success && res.data) {
        setCourse(res.data);
        // Set default tab
        const tabs = tabsConfig[res.data.courseType];
        if (tabs.length > 0) setActiveTab(tabs[0].key);
      }
      setLoading(false);
    };
    fetchCourse();
  }, [slug]);

  // ── Fetch Reviews ─────────────────────────────────────
  useEffect(() => {
    if (!course) return;
    reviewApi.list({ courseId: course.id, limit: 5 }).then((res) => {
      if (res.success && res.data) {
        setReviews(res.data.reviews);
        setReviewStats(res.data.stats);
      }
    });
  }, [course]);

  // ── Format ────────────────────────────────────────────
  const formatPrice = (n: number) =>
    new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  const toggleLesson = (id: string) => {
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Stars ─────────────────────────────────────────────
  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
        />
      ))}
    </div>
  );

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={32} />
        <span className="ml-3 text-gray-500">กำลังโหลดข้อมูลคอร์ส...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <BookOpen size={64} className="text-gray-200 mb-4" />
        <h2 className="text-2xl font-bold text-gray-500 mb-2">ไม่พบคอร์สนี้</h2>
        <p className="text-gray-400 mb-6">อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>
        <Link href="/explore" className="text-primary font-bold hover:underline">
          ← กลับหน้าสำรวจ
        </Link>
      </div>
    );
  }

  const tabs = tabsConfig[course.courseType];

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> กลับหน้าสำรวจคอร์ส
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ═══════════════════════════════════════ */}
        {/* Left Column — Content                    */}
        {/* ═══════════════════════════════════════ */}
        <div className="flex-1 min-w-0">
          {/* Hero Image */}
          <div className="rounded-2xl overflow-hidden bg-gray-100 h-64 md:h-80 relative mb-6">
            {course.thumbnailLg || course.thumbnail ? (
              <img
                src={course.thumbnailLg || course.thumbnail!}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <BookOpen size={64} />
              </div>
            )}
            {/* Type Badge */}
            <span
              className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-sm font-medium border ${typeBadge[course.courseType].className}`}
            >
              {typeBadge[course.courseType].label}
            </span>
          </div>

          {/* Title + Meta */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{course.title}</h1>

          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500">
            {course.instructor && (
              <span className="flex items-center gap-1.5">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold">
                  {course.instructor.name.charAt(0)}
                </div>
                {course.instructor.name}
              </span>
            )}
            {course.category && (
              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                {course.category.name}
              </span>
            )}
            {course.level && (
              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                {course.level.name}
              </span>
            )}
          </div>

          {/* Stats Row — Dynamic by type */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {course.courseType === 'ONLINE' && (
              <>
                <StatCard
                  icon={<PlayCircle size={20} />}
                  value={`${course.videoCount || course.schedules?.filter((s: any) => s.videoUrl)?.length || 0}`}
                  label="วิดีโอ"
                />
                <StatCard
                  icon={<Clock size={20} />}
                  value={course.duration || '-'}
                  label="ระยะเวลา"
                />
              </>
            )}
            {course.courseType === 'ONLINE_LIVE' && (
              <>
                <StatCard
                  icon={<Users size={20} />}
                  value={`${course.maxSeats || '-'}`}
                  label="จำนวนรับ"
                />
                <StatCard icon={<Video size={20} />} value="Zoom" label="ช่องทาง" />
              </>
            )}
            {course.courseType === 'ONSITE' && (
              <>
                <StatCard
                  icon={<MapPin size={20} />}
                  value={course.location?.slice(0, 20) || '-'}
                  label="สถานที่"
                />
                <StatCard
                  icon={<Users size={20} />}
                  value={`${course.maxSeats || '-'}`}
                  label="จำนวนรับ"
                />
              </>
            )}
            <StatCard
              icon={<Users size={20} />}
              value={`${course._count?.enrollments || 0}`}
              label="ผู้เรียน"
            />
            <StatCard
              icon={<Star size={20} />}
              value={reviewStats ? reviewStats.average.toFixed(1) : '-'}
              label="คะแนน"
            />
          </div>

          {/* Description */}
          {course.description && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-3">เกี่ยวกับคอร์สนี้</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mb-8">
            {/* === Lessons Tab (ONLINE) === */}
            {activeTab === 'lessons' && (
              <div className="space-y-6">
                {/* Case 1: มี chapters → แสดงแบบเดิม */}
                {course.chapters && course.chapters.length > 0 ? (
                  course.chapters.map((chapter) => (
                    <div key={chapter.id}>
                      <h3 className="font-bold text-gray-900 mb-3 ml-1">{chapter.title}</h3>
                      <div className="space-y-2">
                        {chapter.lessons?.map((lesson, i) => (
                          <div
                            key={lesson.id}
                            className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                          >
                            <button
                              onClick={() => toggleLesson(lesson.id)}
                              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-sm font-bold">
                                  {i + 1}
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {lesson.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-gray-400">
                                {lesson.duration && (
                                  <span className="text-xs">{lesson.duration} นาที</span>
                                )}
                                <div className="flex items-center gap-1">
                                  {lesson.type === 'VIDEO' && <Video size={14} />}
                                  {lesson.type === 'FILE' && <BookOpen size={14} />}
                                  {expandedLessons.has(lesson.id) ? (
                                    <ChevronUp size={16} />
                                  ) : (
                                    <ChevronDown size={16} />
                                  )}
                                </div>
                              </div>
                            </button>
                            {expandedLessons.has(lesson.id) && (
                              <div className="px-4 pb-4 text-sm text-gray-500 border-t border-gray-50 pt-3 bg-gray-50/50">
                                {lesson.content || 'ไม่มีรายละเอียดเนื้อหา'}
                                {lesson.youtubeUrl && (
                                  <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-black">
                                    <iframe
                                      src={`https://www.youtube.com/embed/${lesson.youtubeUrl.split('v=')[1] || lesson.youtubeUrl.split('/').pop()}`}
                                      className="w-full h-full"
                                      allowFullScreen
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        {(!chapter.lessons || chapter.lessons.length === 0) && (
                          <p className="text-gray-400 text-xs pl-4 italic">ไม่มีบทเรียนในบทนี้</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : course.schedules && course.schedules.length > 0 ? (
                  /* Case 2: ไม่มี chapters แต่มี schedules → แสดง schedules เป็นบทเรียน */
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 ml-1">เนื้อหาบทเรียน</h3>
                    <div className="space-y-2">
                      {course.schedules.map((sched: any, i: number) => (
                        <div
                          key={sched.id}
                          className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                        >
                          <button
                            onClick={() => toggleLesson(sched.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-sm font-bold">
                                {sched.sessionNumber || i + 1}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {sched.topic || `บทเรียนที่ ${i + 1}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                              {sched.videoUrl && (
                                <span className="text-xs flex items-center gap-1">
                                  <Video size={14} /> วิดีโอ
                                </span>
                              )}
                              {sched.materialUrl && (
                                <span className="text-xs flex items-center gap-1">
                                  <BookOpen size={14} /> ไฟล์
                                </span>
                              )}
                              {expandedLessons.has(sched.id) ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </div>
                          </button>
                          {expandedLessons.has(sched.id) && (
                            <div className="px-4 pb-4 text-sm text-gray-500 border-t border-gray-50 pt-3 bg-gray-50/50 space-y-3">
                              {sched.chapterTitle && (
                                <p className="text-gray-700 font-medium">{sched.chapterTitle}</p>
                              )}
                              {sched.videoUrl && (
                                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${sched.videoUrl.includes('v=') ? sched.videoUrl.split('v=')[1]?.split('&')[0] : sched.videoUrl.split('/').pop()}`}
                                    className="w-full h-full"
                                    allowFullScreen
                                    title={sched.topic}
                                  />
                                </div>
                              )}
                              {sched.materialUrl && (
                                <a
                                  href={sched.materialUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                                >
                                  <BookOpen size={14} /> ดาวน์โหลดเอกสารประกอบ
                                </a>
                              )}
                              {!sched.videoUrl && !sched.materialUrl && !sched.chapterTitle && (
                                <p className="text-gray-400">ไม่มีรายละเอียดเนื้อหา</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">ยังไม่มีบทเรียน</p>
                )}
              </div>
            )}

            {/* === Schedule Tab (ONLINE_LIVE) === */}
            {activeTab === 'schedule' && course.schedules && (
              <div className="space-y-3">
                {course.schedules.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">ยังไม่มีตารางเรียน</p>
                ) : (
                  <>
                    {course.schedules.map((sched, idx) => {
                      const isPast = new Date(sched.date) < new Date();
                      const isOnline = sched.isOnline || course.courseType === 'ONLINE_LIVE';
                      return (
                        <div
                          key={sched.id}
                          className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${isPast ? 'border-gray-100 opacity-60' : 'border-gray-200'
                            }`}
                        >
                          {/* Session Number */}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${isPast ? 'bg-gray-100 text-gray-400' : 'bg-violet-50 text-violet-600'
                              }`}
                          >
                            {idx + 1}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {sched.topic}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDate(sched.date)} · {sched.startTime} – {sched.endTime}
                            </p>
                          </div>

                          {/* Platform badge (no link exposed) */}
                          <div className="flex-shrink-0">
                            {isPast ? (
                              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                เรียนแล้ว
                              </span>
                            ) : isOnline ? (
                              <span className="text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded-lg font-medium">
                                📡 Zoom
                              </span>
                            ) : (
                              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-lg font-medium">
                                📍 {sched.location || 'สถานที่เรียน'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-xs text-gray-400 text-center pt-2">
                      🔒 ลิงก์ Zoom จะส่งให้ทางอีเมลหลังชำระเงิน
                    </p>
                  </>
                )}
              </div>
            )}

            {/* === Location Tab (ONSITE) === */}
            {activeTab === 'location' && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin size={18} className="text-orange-500" /> สถานที่เรียน
                </h3>
                <p className="text-gray-600 text-sm mb-4">{course.location || 'ไม่ระบุ'}</p>
                {course.mapUrl && (
                  <a
                    href={course.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-xl text-sm font-medium hover:bg-orange-100 transition-colors"
                  >
                    <MapPin size={14} /> ดูแผนที่ Google Maps
                  </a>
                )}
              </div>
            )}

            {/* === Reviews Tab (All Types) === */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Review Stats */}
                {reviewStats && (
                  <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col md:flex-row items-start gap-8">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-gray-900">
                        {reviewStats.average.toFixed(1)}
                      </p>
                      {renderStars(reviewStats.average)}
                      <p className="text-xs text-gray-400 mt-1">{reviewStats.total} รีวิว</p>
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      {Array.from({ length: 5 }, (_, i) => 5 - i).map((star) => {
                        const dist = reviewStats.distribution.find((d) => d.rating === star);
                        const count = dist?.count || 0;
                        const pct = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-5">{star}</span>
                            <Star size={12} className="text-yellow-400 fill-yellow-400" />
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Review List */}
                {reviews.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">ยังไม่มีรีวิว</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-white rounded-xl border border-gray-100 p-5"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                              {review.user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {review.user.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(review.createdAt)}
                              </p>
                            </div>
                          </div>
                          {renderStars(review.rating)}
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-4">
                          <button className="text-xs text-gray-400 hover:text-primary flex items-center gap-1 transition-colors">
                            <ThumbsUp size={12} /> มีประโยชน์ ({review.helpful})
                          </button>
                        </div>
                      </div>
                    ))}
                    <Link
                      href={`/explore/${slug}/reviews`}
                      className="block text-center text-sm text-primary font-bold hover:underline py-3"
                    >
                      ดูรีวิวทั้งหมด →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* How to Join (ONLINE_LIVE + ONSITE) */}
          {(course.courseType === 'ONLINE_LIVE' || course.courseType === 'ONSITE') && (
            <div className="bg-gradient-to-br from-primary/5 to-blue-50 rounded-2xl p-6 border border-primary/10">
              <h3 className="font-bold text-gray-900 mb-4">🚀 ขั้นตอนการเข้าเรียน</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { step: '1', title: 'สมัครเรียน', desc: 'เพิ่มคอร์สลงตะกร้าและชำระเงิน' },
                  { step: '2', title: 'รอยืนยัน', desc: 'ทีมงานจะยืนยันภายใน 24 ชม.' },
                  {
                    step: '3',
                    title: 'รับลิงก์',
                    desc:
                      course.courseType === 'ONLINE_LIVE'
                        ? 'รับลิงก์ Zoom ทางอีเมล'
                        : 'รับรายละเอียดสถานที่เรียน',
                  },
                  { step: '4', title: 'เริ่มเรียน!', desc: 'เข้าเรียนตามตารางที่กำหนด' },
                ].map((s) => (
                  <div key={s.step} className="text-center">
                    <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-sm">
                      {s.step}
                    </div>
                    <p className="font-medium text-gray-900 text-sm">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* Right Column — Sticky Price Card        */}
        {/* ═══════════════════════════════════════ */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-28 space-y-5">
            {/* Popular Badge */}
            {(course._count?.enrollments || 0) > 10 && (
              <span className="inline-block px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium border border-yellow-200">
                🔥 คอร์สยอดนิยม
              </span>
            )}

            {/* Price */}
            <div>
              {course.originalPrice && course.originalPrice > course.price && (
                <span className="text-sm text-gray-400 line-through block">
                  ฿{formatPrice(course.originalPrice)}
                </span>
              )}
              <span className="text-3xl font-bold text-gray-900">฿{formatPrice(course.price)}</span>
              {course.originalPrice && course.originalPrice > course.price && (
                <span className="ml-2 px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-bold">
                  ลด {Math.round((1 - course.price / course.originalPrice) * 100)}%
                </span>
              )}
            </div>

            {/* Info */}
            <div className="space-y-3 text-sm">
              {course.maxSeats && (
                <div className="flex items-center justify-between text-gray-600">
                  <span>จำนวนรับ</span>
                  <span className="font-medium">
                    {course._count?.enrollments || 0}/{course.maxSeats}
                  </span>
                </div>
              )}
              {course.duration && (
                <div className="flex items-center justify-between text-gray-600">
                  <span>ระยะเวลา</span>
                  <span className="font-medium">{course.duration}</span>
                </div>
              )}
              {course.enrollStartDate && (
                <div className="flex items-center justify-between text-gray-600">
                  <span>เปิดรับสมัคร</span>
                  <span className="font-medium text-xs">
                    {formatDate(course.enrollStartDate)}
                    {course.enrollEndDate && ` - ${formatDate(course.enrollEndDate)}`}
                  </span>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <button
              onClick={() => addToCart(toCartItem(course))}
              disabled={isInCart(course.id)}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${isInCart(course.id)
                ? 'bg-green-50 text-green-600 cursor-default'
                : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 active:scale-[0.98]'
                }`}
            >
              {isInCart(course.id) ? (
                '✓ อยู่ในตะกร้าแล้ว'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ShoppingCart size={16} /> เพิ่มลงตะกร้า
                </span>
              )}
            </button>
            <Link
              href="/checkout"
              className="block w-full py-3 rounded-xl text-sm font-bold text-center border-2 border-primary text-primary hover:bg-primary/5 transition-colors"
            >
              ซื้อเลย
            </Link>

            {/* Stats */}
            <div className="flex items-center justify-around pt-4 border-t border-gray-100 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900">{course._count?.enrollments || 0}</p>
                <p className="text-xs text-gray-400">ผู้เรียน</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{course._count?.reviews || 0}</p>
                <p className="text-xs text-gray-400">รีวิว</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {reviewStats ? reviewStats.average.toFixed(1) : '-'}
                </p>
                <p className="text-xs text-gray-400">คะแนน</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card Component ───────────────────────────────────
function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
      <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center mx-auto mb-2 text-primary">
        {icon}
      </div>
      <p className="font-bold text-gray-900 text-sm">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
