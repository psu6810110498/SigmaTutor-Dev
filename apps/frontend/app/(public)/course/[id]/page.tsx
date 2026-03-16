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
import { useParams, useRouter } from 'next/navigation';
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
  Lock,
  CheckCircle,
  Trash2,
  Edit2,
} from 'lucide-react';
import { courseApi, reviewApi } from '@/app/lib/api';
import { useCourse, toCartItem } from '@/app/context/CourseContext';
import { useAuth } from '@/app/context/AuthContext';
import type { Course, Review, ReviewListResponse, CourseType } from '@/app/lib/types';
import { useCourseAvailability } from '@/app/hooks/useCourseAvailability';
import { SeatProgressBar } from '@/app/components/ui/SeatProgressBar';
import { ReservationCountdown } from '@/app/components/ui/ReservationCountdown';
import { NotifyWhenAvailable } from '@/app/components/ui/NotifyWhenAvailable';

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
    { key: 'lessons', label: '📚 เนื้อหาบทเรียน' },
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
  const router = useRouter();
  const slug = params.id as string;
  const { addToCart, isInCart, removeFromCart, isOwned } = useCourse();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [activeMedia, setActiveMedia] = useState<'video' | 'image'>('image');
  const [isEnrolled, setIsEnrolled] = useState(false);

  const { availability, refetch: refetchAvailability } = useCourseAvailability(
    course?.id ?? '',
    { disabled: !course || course.courseType === 'ONLINE' },
  );

  useEffect(() => {
    // Default to 'image' to prevent heavy iframe loading on mountain (Lazy load)
    // User will manually click the Video Thumbnail or Play overlay to switch
    setActiveMedia('image');
  }, [course]);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewListResponse['stats'] | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [newRating, setNewRating] = useState(0); // 0 = no rating selected
  const [newComment, setNewComment] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

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

  // ── Check Enrollment ──────────────────────────────────
  useEffect(() => {
    if (!course || !user) return;
    const checkEnrollment = async () => {
      try {
        const res = await courseApi.getEnrolled();
        if (res.success && Array.isArray(res.data)) {
          const enrolled = res.data.some((c: any) => c.id === course.id || c.courseId === course.id);
          setIsEnrolled(enrolled);
        }
      } catch (err) {
        console.error('Failed to check enrollment:', err);
      }
    };
    checkEnrollment();
  }, [course, user]);

  // ── Fetch Reviews ─────────────────────────────────────
  useEffect(() => {
    if (!course) return;
    reviewApi.list({ courseId: course.id, limit: 5 }).then((res) => {
      if (res.success && res.data) {
        setReviews(res.data.reviews);
        setReviewStats(res.data.stats);
        if (user) {
           const didReview = res.data.reviews.some((r) => r.user.id === user.id);
           setHasReviewed(didReview);
        }
      }
    });
  }, [course, user]);

  // ── Submit Review ─────────────────────────────────────
  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !user || submittingReview) return;
    if (!editingReviewId && hasReviewed) return;
    
    if (newRating === 0) {
      alert('กรุณาเลือกคะแนนให้คอร์สนี้ก่อนส่งรีวิว');
      return;
    }

    setSubmittingReview(true);
    try {
      if (editingReviewId) {
        // Update existing review
        const res = await reviewApi.update(editingReviewId, {
          rating: newRating,
          comment: newComment.trim() || undefined,
        });

        if (res.success && res.data) {
          // Update the review in the list
          setReviews(reviews.map((r) => (r.id === editingReviewId ? res.data! : r)));
          setEditingReviewId(null);
          
          // Refresh stats
          reviewApi.list({ courseId: course.id, limit: 5 }).then((listRes) => {
             if (listRes.success && listRes.data) {
                 setReviewStats(listRes.data.stats);
             }
          });
          alert('แก้ไขรีวิวสำเร็จ!');
        } else {
          alert(res.error || 'เกิดข้อผิดพลาดในการแก้ไขรีวิว');
        }
      } else {
        // Create new review
        const res = await reviewApi.create({
          courseId: course.id,
          rating: newRating,
          comment: newComment.trim() || undefined,
        });

        if (res.success && res.data) {
          // Optimistically add the new review
          setReviews([res.data, ...reviews]);
          setHasReviewed(true);
          setNewComment('');
          setNewRating(0);
          // Refresh stats
          reviewApi.list({ courseId: course.id, limit: 5 }).then((listRes) => {
             if (listRes.success && listRes.data) {
                 setReviewStats(listRes.data.stats);
             }
          });
          alert('ขอบคุณสำหรับรีวิวของคุณ!');
        } else {
          alert(res.error || 'เกิดข้อผิดพลาดในการส่งรีวิว');
        }
      }
    } catch (error) {
       console.error(error);
       alert('เกิดข้อผิดพลาด');
    } finally {
      setSubmittingReview(false);
    }
  };

  const startEditing = (review: Review) => {
    setEditingReviewId(review.id);
    setNewRating(review.rating);
    setNewComment(review.comment || '');
    // Scroll to form smoothly
    setTimeout(() => {
      document.getElementById('review-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const cancelEditing = () => {
    setEditingReviewId(null);
    setNewRating(0);
    setNewComment('');
  };

  // ── Format ────────────────────────────────────────────
  const formatPrice = (n: number) =>
    new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0 }).format(n);

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (d: string | null | undefined) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const calcTotalMinutes = (lessons: any[]) =>
    lessons.reduce((sum, l) => sum + (l.duration ?? 0), 0);

  const formatMinutes = (mins: number) => {
    if (mins <= 0) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return h + ' ชม. ' + m + ' นาที';
    if (h > 0) return h + ' ชม.';
    return m + ' นาที';
  };

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
          {/* Media Viewer Area (Steam Store Style) */}
          <div className="mb-6">
            {/* Main Viewer */}
            <div className="rounded-2xl overflow-hidden bg-black aspect-video relative shadow-sm border border-gray-100 mb-3">
              {activeMedia === 'video' && ((course.videoProvider === 'GUMLET' && course.gumletVideoId) || course.demoVideoUrl) ? (
                course.videoProvider === 'GUMLET' && course.gumletVideoId ? (
                  <iframe
                    src={`https://play.gumlet.io/embed/${course.gumletVideoId}`}
                    title="Gumlet video player"
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <iframe
                    src={`https://www.youtube.com/embed/${course.demoVideoUrl!.includes('v=') ? course.demoVideoUrl!.split('v=')[1]?.split('&')[0] : course.demoVideoUrl!.split('/').pop()}?autoplay=1`}
                    className="w-full h-full"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    title="Promotional Video"
                  />
                )
              ) : (
                <div className="w-full h-full relative cursor-pointer" onClick={() => {
                  if (((course.videoProvider === 'GUMLET' && course.gumletVideoId) || course.demoVideoUrl)) {
                    setActiveMedia('video');
                  }
                }}>
                  {course.thumbnailLg || course.thumbnail ? (
                    <img
                      src={course.thumbnailLg || course.thumbnail!}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100">
                      <BookOpen size={64} />
                    </div>
                  )}
                  {((course.videoProvider === 'GUMLET' && course.gumletVideoId) || course.demoVideoUrl) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors z-10 group">
                      <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <PlayCircle size={32} />
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Type Badge */}
              <span
                className={`absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg text-sm font-medium border shadow-sm ${typeBadge[course.courseType].className}`}
              >
                {typeBadge[course.courseType].label}
              </span>
            </div>

            {/* Thumbnails Row */}
            {((course.videoProvider === 'GUMLET' && course.gumletVideoId) || course.demoVideoUrl) && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
                <button
                  onClick={() => setActiveMedia('video')}
                  className={`relative w-28 md:w-36 aspect-video rounded-lg overflow-hidden border-2 transition-all flex-none ${activeMedia === 'video' ? 'border-primary ring-2 ring-primary/30' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 hover:bg-black/20 transition-colors">
                    <PlayCircle className="text-white drop-shadow-md" size={32} />
                  </div>
                  {course.videoProvider === 'GUMLET' ? (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <Video className="text-white opacity-50" size={24} />
                    </div>
                  ) : course.demoVideoUrl ? (
                    (() => {
                      const videoId = course.demoVideoUrl.includes('v=') 
                        ? course.demoVideoUrl.split('v=')[1]?.split('&')[0] 
                        : course.demoVideoUrl.split('/').pop()?.split('?')[0];
                      return (
                        <img 
                          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} 
                          className="w-full h-full object-cover" 
                          alt="Video thumbnail" 
                        />
                      );
                    })()
                  ) : null}
                </button>

                <button
                  onClick={() => setActiveMedia('image')}
                  className={`relative w-28 md:w-36 aspect-video rounded-lg overflow-hidden border-2 transition-all flex-none ${activeMedia === 'image' ? 'border-primary ring-2 ring-primary/30' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  {course.thumbnail && (
                    <img src={course.thumbnail} className="w-full h-full object-cover" alt="Cover thumbnail" />
                  )}
                </button>
              </div>
            )}
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
                  value={course.duration || (() => {
                    const vCount = course.videoCount || course.schedules?.filter((s: any) => s.videoUrl)?.length || 0;
                    if (vCount === 0) return '-';
                    const totalHours = vCount + 5;
                    return `${totalHours} ชม.`;
                  })()}
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
                      <div className="flex items-center justify-between mb-3 ml-1">
                        <h3 className="font-bold text-gray-900">{chapter.title}</h3>
                        {chapter.lessons && chapter.lessons.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {chapter.lessons.length} บทเรียน
                            {calcTotalMinutes(chapter.lessons) > 0 && (
                              <> · {formatMinutes(calcTotalMinutes(chapter.lessons))}</>
                            )}
                          </span>
                        )}
                      </div>
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
                                {lesson.isFree && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">ทดลองเรียน</span>
                                )}
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
                                {isEnrolled || lesson.isFree ? (
                                  <>
                                    {((lesson.videoProvider === 'GUMLET' || (!lesson.videoProvider && lesson.gumletVideoId)) && lesson.gumletVideoId) ? (
                                      <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-black">
                                        <iframe
                                          src={`https://play.gumlet.io/embed/${lesson.gumletVideoId}`}
                                          className="w-full h-full"
                                          allow="autoplay; fullscreen; picture-in-picture"
                                          allowFullScreen
                                          title={lesson.title}
                                        />
                                      </div>
                                    ) : lesson.youtubeUrl && (
                                      <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-black">
                                        <iframe
                                          src={`https://www.youtube.com/embed/${lesson.youtubeUrl.includes('v=') ? lesson.youtubeUrl.split('v=')[1]?.split('&')[0] : lesson.youtubeUrl.split('/').pop()}?autoplay=0`}
                                          className="w-full h-full"
                                          allowFullScreen
                                        />
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="mt-3 p-6 bg-gray-900 rounded-xl border border-gray-800 flex flex-col items-center justify-center text-center shadow-inner">
                                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-3">
                                      <Lock size={24} />
                                    </div>
                                    <p className="text-white font-medium mb-1">เนื้อหาสงวนสิทธิ์เฉพาะผู้เรียนคอร์สนี้</p>
                                    <p className="text-gray-400 text-xs mb-4">
                                      กรุณาเข้าสู่ระบบและสมัครเรียนเพื่อรับชมวิดีโอและเอกสารในบทเรียนนี้
                                    </p>
                                    <button
                                      onClick={() => router.push('/checkout')}
                                      className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
                                    >
                                      สั่งซื้อคอร์สเพื่อปลดล็อคเนื้อหา
                                    </button>
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
                    <h3 className="font-bold text-gray-900 mb-3 ml-1">เนื้อหาบทเรียน ({course.schedules.length} บท)</h3>
                    <div className="space-y-2">
                      {course.schedules.map((sched: any, i: number) => {
                        const FREE_PREVIEW_COUNT = 2;
                        const isLocked = i >= FREE_PREVIEW_COUNT && !isEnrolled;
                        return (
                          <div
                            key={sched.id}
                            className={`bg-white rounded-xl border overflow-hidden relative ${isLocked ? 'border-gray-200 opacity-75' : 'border-gray-100'
                              }`}
                          >
                            <button
                              onClick={() => !isLocked && toggleLesson(sched.id)}
                              className={`w-full flex items-center justify-between p-4 transition-colors ${isLocked ? 'cursor-not-allowed' : 'hover:bg-gray-50'
                                }`}
                              disabled={isLocked}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${isLocked ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary'
                                  }`}>
                                  {isLocked ? <Lock size={14} /> : (sched.sessionNumber || i + 1)}
                                </span>
                                <span className={`text-sm font-medium ${isLocked ? 'text-gray-400' : 'text-gray-900'
                                  }`}>
                                  {sched.topic || `บทเรียนที่ ${i + 1}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-gray-400">
                                {isLocked ? (
                                  <span className="text-xs flex items-center gap-1 text-orange-500">
                                    <Lock size={12} /> ล็อค
                                  </span>
                                ) : (
                                  <>
                                    {(sched.videoUrl || sched.gumletVideoId) && (
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
                                  </>
                                )}
                              </div>
                            </button>
                            {!isLocked && expandedLessons.has(sched.id) && (
                              <div className="px-4 pb-4 text-sm text-gray-500 border-t border-gray-50 pt-3 bg-gray-50/50 space-y-3">
                                {sched.chapterTitle && (
                                  <p className="text-gray-700 font-medium">{sched.chapterTitle}</p>
                                )}
                                {((sched.videoProvider === 'GUMLET' || (!sched.videoProvider && sched.gumletVideoId)) && sched.gumletVideoId) ? (
                                  <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-black">
                                    <iframe
                                      src={`https://play.gumlet.io/embed/${sched.gumletVideoId}`}
                                      className="w-full h-full"
                                      allow="autoplay; fullscreen; picture-in-picture"
                                      allowFullScreen
                                      title={sched.topic}
                                    />
                                  </div>
                                ) : sched.videoUrl && (
                                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                    <iframe
                                      src={`https://www.youtube.com/embed/${sched.videoUrl.includes('v=') ? sched.videoUrl.split('v=')[1]?.split('&')[0] : sched.videoUrl.split('/').pop()}?autoplay=0`}
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
                        );
                      })}
                    </div>
                    {/* Paywall Message */}
                    {course.schedules.length > 2 && !isEnrolled && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl text-center">
                        <Lock size={20} className="mx-auto mb-2 text-orange-500" />
                        <p className="text-sm font-bold text-gray-800">
                          🔒 ดูฟรีได้ 2 บทเรียนแรกเท่านั้น
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ต้องชำระเงินซื้อคอร์สก่อน ถึงจะดูเนื้อหาทั้ง {course.schedules.length} บทได้
                        </p>
                        <button
                          onClick={() => router.push('/checkout')}
                          className="inline-block mt-3 px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
                        >
                          <ShoppingCart size={14} className="inline mr-1" /> ซื้อคอร์สเพื่อปลดล็อค
                        </button>
                      </div>
                    )}
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
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="font-medium text-gray-900 text-sm break-words whitespace-pre-wrap">
                              {sched.topic}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDate(sched.date)} · ({sched.startTime} – {sched.endTime})
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

                {/* Write Review Form (Enrolled users only) */}
                {isEnrolled && user && (!hasReviewed || editingReviewId) && (
                  <div id="review-form-section" className="bg-gradient-to-br from-primary/5 to-blue-50 rounded-xl border border-primary/10 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {user.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={user.name} 
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shadow-sm">
                          {user.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-gray-900 flex items-center gap-1">
                          <Star size={16} className="text-yellow-500 fill-yellow-500" /> {editingReviewId ? 'แก้ไขรีวิว' : 'เขียนรีวิวของคุณ'}
                        </h4>
                        <p className="text-xs text-gray-500">โพสต์ในชื่อ {user.name}</p>
                      </div>
                    </div>
                    
                    <form onSubmit={submitReview}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">ให้คะแนน</label>
                        <div className="flex gap-2">
                           {[1, 2, 3, 4, 5].map((star) => (
                             <button
                               type="button"
                               key={star}
                               onClick={() => setNewRating(star)}
                               className={`transition-colors p-1 rounded-full hover:bg-yellow-50 ${newRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                             >
                               <Star size={24} className={newRating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                             </button>
                           ))}
                        </div>
                      </div>
                      <div className="mb-4">
                         <label className="block text-sm font-medium text-gray-700 mb-2">ความคิดเห็น (ไม่บังคับ)</label>
                         <textarea
                           value={newComment}
                           onChange={(e) => setNewComment(e.target.value)}
                           placeholder="เล่าประสบการณ์การเรียนของคุณ..."
                           className="w-full h-24 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-sm"
                           maxLength={1000}
                         />
                      </div>
                      <div className="flex justify-end gap-2">
                         {editingReviewId && (
                           <button
                             type="button"
                             onClick={cancelEditing}
                             className="px-4 py-2 text-gray-500 text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors mr-2"
                           >
                             ยกเลิก
                           </button>
                         )}
                         <button
                           type="submit"
                           disabled={submittingReview}
                           className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                         >
                           {submittingReview && <Loader2 size={16} className="animate-spin" />}
                           {editingReviewId ? 'บันทึกการแก้ไข' : 'ส่งรีวิว'}
                         </button>
                      </div>
                    </form>
                  </div>
                )}
                
                {isEnrolled && user && hasReviewed && !editingReviewId && (
                   <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-xl text-sm flex items-center gap-2 font-medium">
                       <CheckCircle size={18} /> คุณได้รีวิวคอร์สนี้แล้ว ขอบคุณสำหรับความคิดเห็น!
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
                            {/* @ts-ignore - Assuming user payload has profileImage included from API currently or soon */}
                            {review.user.profileImage ? (
                              <img 
                                src={review.user.profileImage} 
                                alt={review.user.name} 
                                className="w-9 h-9 rounded-full object-cover border border-gray-100"
                              />
                            ) : (
                              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                                {review.user.name.charAt(0)}
                              </div>
                            )}
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
                        <div className="mt-3 flex items-center justify-between">
                          <button className="text-xs text-gray-400 hover:text-primary flex items-center gap-1 transition-colors">
                            <ThumbsUp size={12} /> มีประโยชน์ ({review.helpful})
                          </button>
                          
                          {/* Show Edit button if user owns review */}
                          {user?.id === review.userId && !editingReviewId && (
                            <button
                              onClick={() => startEditing(review)}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
                            >
                              <Edit2 size={12} /> แก้ไขรีวิว
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {reviewStats && reviewStats.total > 5 && (
                      <Link
                        href={`/course/${slug}/reviews`}
                        className="block text-center text-sm text-primary font-bold hover:underline py-3 mt-4 border-t border-gray-100"
                      >
                        ดูรีวิวทั้งหมด ({reviewStats.total}) →
                      </Link>
                    )}
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

            {/* Seat Availability */}
            {availability && availability.isLimited && (
              <div className="space-y-2">
                <SeatProgressBar availability={availability} size="md" showCount />
                {availability.isReservedOnly && availability.earliestExpiryInSeconds != null && (
                  <ReservationCountdown
                    expiresInSeconds={availability.earliestExpiryInSeconds}
                    onExpired={refetchAvailability}
                  />
                )}
                {availability.isReservedOnly && (
                  <NotifyWhenAvailable courseId={course.id} courseTitle={course.title} />
                )}
              </div>
            )}

            {/* Info */}
            <div className="space-y-3 text-sm">
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
            {isEnrolled ? (
              <Link
                href={`/courses/${course.id}/learn`}
                className="w-full flex items-center justify-center py-3 rounded-xl text-sm font-bold text-center bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all active:scale-[0.98] gap-2"
              >
                <PlayCircle size={18} /> เข้าสู่บทเรียน
              </Link>
            ) : availability?.isFull && !availability.isReservedOnly ? (
              <div className="text-center py-3 px-4 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium">
                คอร์สนี้ปิดรับสมัครแล้ว
              </div>
            ) : (
              <>
                <button
                  disabled={availability?.isFull}
                  onClick={() => {
                    const owned = isOwned(course.id);
                    if (owned) {
                      alert("คุณลงทะเบียนเรียนคอร์สนี้แล้ว ไม่สามารถเพิ่มลงตะกร้าได้");
                      return;
                    }

                    if (isInCart(course.id)) {
                      removeFromCart(course.id);
                    } else {
                      addToCart(toCartItem(course));
                    }
                  }}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all group disabled:opacity-50 disabled:cursor-not-allowed ${
                    isOwned(course.id)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed hidden'
                      : isInCart(course.id)
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 active:scale-[0.98]'
                  }`}
                  disabled={availability?.isFull || isOwned(course.id)}
                >
                  {isOwned(course.id) ? (
                    <span className="flex items-center justify-center gap-2">
                       คุณเป็นเจ้าของคอร์สนี้แล้ว
                    </span>
                  ) : isInCart(course.id) ? (
                    <>
                      <span className="flex items-center justify-center gap-2 group-hover:hidden">
                        <CheckCircle size={16} /> อยู่ในตะกร้าแล้ว
                      </span>
                      <span className="hidden items-center justify-center gap-2 group-hover:flex">
                        <Trash2 size={16} /> เอาออกจากตะกร้า
                      </span>
                    </>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <ShoppingCart size={16} /> เพิ่มลงตะกร้า
                    </span>
                  )}
                </button>
                <button
                  disabled={availability?.isFull}
                  onClick={() => {
                    const owned = isOwned(course.id);
                    if (owned) {
                       router.push(`/courses/${course.id}/learn`);
                       return;
                    }

                    if (!isInCart(course.id)) {
                      addToCart(toCartItem(course));
                    }
                    setTimeout(() => router.push('/checkout'), 50);
                  }}
                  className={`block w-full py-3 rounded-xl text-sm font-bold text-center border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isOwned(course.id) 
                      ? 'bg-primary text-white hover:bg-primary-dark border-primary hidden'
                      : 'border-primary text-primary hover:bg-primary/5'
                  }`}
                >
                  {isOwned(course.id) ? 'เข้าสู่บทเรียน' : 'ซื้อเลย'}
                </button>
              </>
            )}

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
