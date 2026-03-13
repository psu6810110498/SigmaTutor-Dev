"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PlayCircle, CheckCircle, Lock, BookOpen, Download, ChevronDown, ChevronUp, FileText, Star, X, Loader2 } from 'lucide-react';
import { FiUser, FiGrid, FiBook, FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/app/context/AuthContext';
import { useToast } from "@/app/components/ui/Toast";
import { SigmaLogo } from '@/app/components/icons/SigmaLogo';
import { progressApi, reviewApi } from '@/app/lib/api';
import type { Review } from '@/app/lib/types';

export default function LearningPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user, logout, loading: authLoading } = useAuth();

    const menuItems = [
        { name: 'แดชบอร์ด', icon: FiGrid, href: '/dashboard' },
        { name: 'คอร์สของฉัน', icon: FiBook, href: '/my-courses' },
        { name: 'ข้อมูลส่วนตัว', icon: FiUser, href: '/profile' },
    ];

    const courseId = params.id as string;
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // State สำหรับการเรียน
    const [currentLesson, setCurrentLesson] = useState<any>(null);
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

    // State สำหรับการรีวิว
    const [userReview, setUserReview] = useState<Review | null>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                // Fetch public course detail (which includes chapters/schedules)
                const res = await fetch(`http://localhost:4000/api/courses/${courseId}`);
                const data = await res.json();

                if (data.success) {
                    setCourse(data.data);

                    // Fetch user's completed progress
                    try {
                        const progressRes = await progressApi.getCourseProgress(courseId);
                        if (progressRes.success && progressRes.data) {
                            const completedIds = progressRes.data
                                .filter((p: any) => p.isCompleted)
                                .map((p: any) => p.lessonId || p.scheduleId);
                            setCompletedLessons(new Set(completedIds));
                        }
                    } catch (e) {
                        console.error("Failed to load progress:", e);
                    }

                    // หาบทเรียนแรกมาแสดง
                    const c = data.data;
                    if (c.chapters && c.chapters.length > 0) {
                        const firstChap = c.chapters[0];
                        setExpandedChapters(new Set([firstChap.id]));
                        if (firstChap.lessons && firstChap.lessons.length > 0) {
                            setCurrentLesson(firstChap.lessons[0]);
                        }
                    } else if (c.schedules && c.schedules.length > 0) {
                        setCurrentLesson(c.schedules[0]);
                    }
                } else {
                    toast.error("ไม่สามารถโหลดข้อมูลคอร์สได้");
                    router.push('/my-courses');
                }
            } catch (error) {
                console.error(error);
                toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
            } finally {
                setLoading(false);
            }
        };

        if (courseId) fetchCourse();
    }, [courseId, router, toast]);

    useEffect(() => {
        if (!course?.id || !user?.id) return;
        const fetchReview = async () => {
            try {
                const res = await reviewApi.list({ courseId: course.id, limit: 50 });
                if (res.success && res.data) {
                    const existing = res.data.reviews.find((r: any) => r.userId === user.id || r.user?.id === user.id);
                    if (existing) {
                        setUserReview(existing);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user review:", error);
            }
        };
        fetchReview();
    }, [course?.id, user?.id]);

    const toggleChapter = (chapterId: string) => {
        const newExpanded = new Set(expandedChapters);
        if (newExpanded.has(chapterId)) {
            newExpanded.delete(chapterId);
        } else {
            newExpanded.add(chapterId);
        }
        setExpandedChapters(newExpanded);
    };

    const toggleCompleted = async (lessonId: string): Promise<boolean> => {
        // Optimistic UI updates
        const newCompleted = new Set(completedLessons);
        let isNowCompleted = false;

        if (newCompleted.has(lessonId)) {
            newCompleted.delete(lessonId);
            isNowCompleted = false;
        } else {
            newCompleted.add(lessonId);
            isNowCompleted = true;
        }
        setCompletedLessons(newCompleted);

        // Sync with backend
        try {
            const isSchedule = (!course.chapters || course.chapters.length === 0) && (course.schedules && course.schedules.length > 0);
            const payload = isSchedule ? { scheduleId: lessonId } : { lessonId: lessonId };
            await progressApi.toggleProgress(courseId, payload);
            return true;
        } catch (error) {
            console.error("Failed to sync progress:", error);
            toast.error("ไม่สามารถบันทึกความคืบหน้าได้");
            // Revert state on failure
            if (isNowCompleted) {
                newCompleted.delete(lessonId);
            } else {
                newCompleted.add(lessonId);
            }
            setCompletedLessons(new Set(newCompleted));
            return false;
        }
    };

    // รวมบทเรียนทั้งหมดเป็น flat array เพื่อใช้ในการนำทาง prev/next
    // ⚠️ Hook ต้องอยู่ก่อน early return เสมอ เพื่อไม่ให้ผิดกฎ Rules of Hooks
    const allLessons = useMemo(() => {
        if (!course) return [];
        if (course.chapters?.length > 0) {
            return course.chapters.flatMap((ch: any) => ch.lessons || []);
        } else if (course.schedules?.length > 0) {
            return course.schedules;
        }
        return [];
    }, [course]);

    const currentIndex = allLessons.findIndex((l: any) => l.id === currentLesson?.id);

    const handleOpenReviewModal = () => {
        if (userReview) {
            setReviewRating(userReview.rating);
            setReviewComment(userReview.comment || '');
        } else {
            setReviewRating(0);
            setReviewComment('');
        }
        setIsReviewOpen(true);
    };

    const submitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (reviewRating === 0) {
            toast.error('กรุณาเลือกคะแนนให้คอร์สนี้ก่อนส่งรีวิว');
            return;
        }

        setIsSubmittingReview(true);
        try {
            if (userReview) {
                const res = await reviewApi.update(userReview.id, {
                    rating: reviewRating,
                    comment: reviewComment.trim() || undefined,
                });
                if (res.success && res.data) {
                    setUserReview(res.data);
                    toast.success('แก้ไขรีวิวสำเร็จ!');
                    setIsReviewOpen(false);
                } else {
                    toast.error(res.error || 'เกิดข้อผิดพลาดในการแก้ไขรีวิว');
                }
            } else {
                const res = await reviewApi.create({
                    courseId,
                    rating: reviewRating,
                    comment: reviewComment.trim() || undefined,
                });
                if (res.success && res.data) {
                    setUserReview(res.data);
                    toast.success('ขอบคุณสำหรับรีวิวของคุณ!');
                    setIsReviewOpen(false);
                } else {
                    toast.error(res.error || 'เกิดข้อผิดพลาดในการส่งรีวิว');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const goToPrev = () => {
        if (currentIndex > 0) {
            const prevLesson = allLessons[currentIndex - 1];
            setCurrentLesson(prevLesson);
            // Expand the chapter that contains the prev lesson
            if (course?.chapters?.length > 0) {
                const parentChapter = course.chapters.find((ch: any) =>
                    ch.lessons?.some((l: any) => l.id === prevLesson.id)
                );
                if (parentChapter) {
                    setExpandedChapters(prev => new Set([...prev, parentChapter.id]));
                }
            }
        }
    };

    const goToNext = () => {
        if (currentIndex < allLessons.length - 1) {
            const nextLesson = allLessons[currentIndex + 1];
            setCurrentLesson(nextLesson);
            // Expand the chapter that contains the next lesson
            if (course?.chapters?.length > 0) {
                const parentChapter = course.chapters.find((ch: any) =>
                    ch.lessons?.some((l: any) => l.id === nextLesson.id)
                );
                if (parentChapter) {
                    setExpandedChapters(prev => new Set([...prev, parentChapter.id]));
                }
            }
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!course) return null;

    // คำนวณเปอร์เซ็นต์เรียนจบแบบ UI Fake
    let totalItems = 0;
    if (course.chapters?.length > 0) {
        course.chapters.forEach((ch: any) => totalItems += (ch.lessons?.length || 0));
    } else if (course.schedules?.length > 0) {
        totalItems = course.schedules.length;
    }
    
    // กรองหาเฉพาะบทเรียนที่เรียนจบและยังมีอยู่จริงในคอร์ส เพื่อป้องกันเปอร์เซ็นต์เกิน 100% จากบทเรียนที่ถูกลบไปแล้ว
    const validCompletedLessonsCount = Array.from(completedLessons).filter(id => allLessons.some((l: any) => l.id === id)).length;
    const progressPercent = totalItems === 0 ? 0 : Math.min(100, Math.round((validCompletedLessonsCount / totalItems) * 100));

    // Note: video rendering logic is now inline in the JSX below,
    // supporting both YouTube and Gumlet providers.

    return (
        <div className="flex h-screen bg-slate-50 text-slate-700 font-sans overflow-hidden">

            {/* --- Sidebar ซ้ายสุด (Navigation) --- */}
            <aside className="w-72 bg-white border-r border-gray-100 flex flex-col shrink-0 z-40 hidden md:flex font-sans">
                <div className="h-16 flex items-center px-8 border-b border-gray-50/50 shrink-0">
                    <SigmaLogo size="lg" showText={true} />
                </div>

                <div className="p-8 h-full flex flex-col overflow-y-auto">
                    {/* Profile Section */}
                    <div className="flex flex-col items-center mb-10 text-center">
                        {/* Avatar with Glowing Gradient Ring */}
                        <div className="relative group mb-4">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-purple-500 to-blue-400">
                                <div className="w-full h-full rounded-full bg-white p-1 overflow-hidden">
                                    <img
                                        src={
                                            user?.profileImage ||
                                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`
                                        }
                                        alt="Profile"
                                        className="w-full h-full object-cover rounded-full bg-gray-50"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1 w-full px-2">
                            <h3 className="font-bold text-gray-900 text-lg line-clamp-1 leading-tight">
                                {user?.name || 'Promtada Pippo'}
                            </h3>
                            <p className="text-gray-400 text-xs truncate font-medium">
                                {user?.email || 'pippo662006@gmail.com'}
                            </p>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="space-y-2 flex-1 pt-4">
                        {menuItems.map((item) => {
                            // On the Learning page, we consider "คอร์สของฉัน" as active
                            const isActive = item.name === 'คอร์สของฉัน';
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                                        flex items-center px-5 py-3.5 transition-all duration-200 font-semibold text-sm group
                                        ${isActive
                                            ? 'bg-[#3b82f6] text-white rounded-[12px] shadow-lg shadow-blue-500/30'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600 rounded-[12px]'
                                        }
                                    `}
                                >
                                    <item.icon
                                        className={`w-5 h-5 mr-4 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'
                                            }`}
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout Section */}
                    <div className="pt-6 mt-6 border-t border-gray-50">
                        <button
                            onClick={() => logout()}
                            className="flex items-center px-5 py-3.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-[12px] w-full transition-all duration-200 text-sm font-semibold group"
                        >
                            <FiLogOut className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" />
                            ออกจากระบบ
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- พื้นที่เนื้อหาหลัก (ตรงกลาง) --- */}
            <div className="flex-1 flex flex-col overflow-y-auto w-full relative">
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-100 shrink-0">
                    <Link href="/my-courses" className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">
                        <ArrowLeft size={16} /> กลับไปคอร์สของฉัน
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                            ซิงค์ความคืบหน้าแล้ว
                        </span>
                    </div>
                </div>

                {/* Video & Info Area */}
                <div className="p-8 max-w-5xl mx-auto w-full">
                    {/* Video Player */}
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-200 relative z-0">
                        {/* 1. Lesson has Gumlet */}
                        {(currentLesson?.videoProvider === 'GUMLET' || (!currentLesson?.videoProvider && currentLesson?.gumletVideoId)) && currentLesson?.gumletVideoId ? (
                            <iframe
                                src={`https://play.gumlet.io/embed/${currentLesson.gumletVideoId}`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={currentLesson?.title || 'Gumlet Video'}
                            />
                        ) : ((currentLesson?.videoProvider === 'YOUTUBE' || (!currentLesson?.videoProvider && !currentLesson?.gumletVideoId)) && (currentLesson?.videoUrl || currentLesson?.youtubeUrl)) ? (
                            (() => {
                                const rawUrl = currentLesson?.videoUrl || currentLesson?.youtubeUrl;
                                const vid = rawUrl ? (rawUrl.includes('v=') ? rawUrl.split('v=')[1]?.split('&')[0] : rawUrl.split('/').pop()) : '';
                                return (
                                    <iframe
                                        src={`https://www.youtube.com/embed/${vid}?autoplay=0&rel=0`}
                                        className="w-full h-full"
                                        allowFullScreen
                                    />
                                );
                            })()
                        ) : ((course?.videoProvider === 'GUMLET' || (!course?.videoProvider && course?.gumletVideoId)) && course?.gumletVideoId) ? (
                            <iframe
                                src={`https://play.gumlet.io/embed/${course.gumletVideoId}`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="Course Demo Video"
                            />
                        ) : ((course?.videoProvider === 'YOUTUBE' || !course?.videoProvider) && course?.demoVideoUrl) ? (
                            (() => {
                                const rawUrl = course.demoVideoUrl;
                                const vid = rawUrl ? (rawUrl.includes('v=') ? rawUrl.split('v=')[1]?.split('&')[0] : rawUrl.split('/').pop()) : '';
                                return (
                                    <iframe
                                        src={`https://www.youtube.com/embed/${vid}?autoplay=0&rel=0`}
                                        className="w-full h-full"
                                        allowFullScreen
                                    />
                                );
                            })()
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-100 gap-3">
                                <PlayCircle size={48} className="opacity-50 text-slate-300" />
                                <p className="font-medium text-slate-500">ไม่มีวิดีโอสำหรับบทเรียนนี้</p>
                            </div>
                        )}
                    </div>

                    {/* Lesson Title & Desc */}
                    <div className="mt-8 flex items-start justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900">{currentLesson?.topic || currentLesson?.title || 'ไม่ได้เลือกบทเรียน'}</h1>
                            <p className="text-slate-500 mt-3 text-sm leading-relaxed max-w-3xl">
                                {currentLesson?.description || 'บทเรียนนี้จะอธิบายเนื้อหาตามหัวข้อเพื่อเตรียมความพร้อมสำหรับเนื้อหาขั้นต่อไป โปรดดูวิดีโอและทำแบบฝึกหัดหากมี'}
                            </p>
                        </div>
                        <div className="flex gap-3 shrink-0">
                            <button
                                onClick={handleOpenReviewModal}
                                className={`px-4 py-2 font-bold text-sm rounded-xl border transition-colors flex items-center gap-2
                                    ${userReview 
                                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                            >
                                {userReview ? (
                                    <>แก้ไขรีวิว</>
                                ) : (
                                    <>เขียนรีวิวคอร์ส</>
                                )}
                            </button>
                            <button
                                onClick={async () => {
                                    if (!currentLesson) return;
                                    await toggleCompleted(currentLesson.id);
                                }}
                                className={`px-4 py-2 font-bold text-sm rounded-xl border transition-colors flex items-center gap-2
                                    ${currentLesson && completedLessons.has(currentLesson.id)
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                            >
                                {currentLesson && completedLessons.has(currentLesson.id) ? (
                                    <><CheckCircle size={16} /> เรียนจบแล้ว</>
                                ) : (
                                    <><div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center bg-white" /> ทำเครื่องหมายว่าเรียนจบ</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Documents */}
                    {(currentLesson?.materialUrl || course.materialUrl) && (
                        <div className="mt-10">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <BookOpen size={16} className="text-blue-500" /> เอกสารประกอบการเรียน
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <a
                                    href={currentLesson?.materialUrl || course.materialUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md hover:shadow-blue-50 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">เอกสารแนบ.pdf</p>
                                            <p className="text-xs text-slate-500 mt-0.5">PDF Document</p>
                                        </div>
                                    </div>
                                    <Download size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Sidebar ขวา (Playlist) --- */}
            <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-sm relative z-10">
                {/* Course Overview in Sidebar */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">คอร์สเรียนปัจจุบัน</p>
                    <h2 className="font-bold text-slate-900 text-lg leading-tight mb-4">{course.title}</h2>

                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
                        <span>{validCompletedLessonsCount} จาก {totalItems} บทเรียน</span>
                        <span className="text-blue-600">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>

                {/* Playlist / Chapters */}
                <div className="flex-1 overflow-y-auto">
                    {course.chapters && course.chapters.length > 0 ? (
                        course.chapters.map((chapter: any, chapIdx: number) => {
                            const isExpanded = expandedChapters.has(chapter.id);
                            return (
                                <div key={chapter.id} className="border-b border-slate-100">
                                    <button
                                        onClick={() => toggleChapter(chapter.id)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                                    >
                                        <span className="font-bold text-sm text-slate-800">{chapter.title}</span>
                                        {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                    </button>

                                    {isExpanded && (
                                        <div className="bg-slate-50/50 border-t border-slate-50">
                                            {chapter.lessons?.map((lesson: any, lesIdx: number) => {
                                                const isActive = currentLesson?.id === lesson.id;
                                                const isCompleted = completedLessons.has(lesson.id);
                                                return (
                                                    <div
                                                        key={lesson.id}
                                                        className={`flex items-start gap-3 p-4 pl-6 cursor-pointer transition-colors border-l-2
                                                            ${isActive ? 'bg-blue-50/50 border-blue-500' : 'border-transparent hover:bg-slate-100'}`}
                                                        onClick={() => setCurrentLesson(lesson)}
                                                    >
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleCompleted(lesson.id); }}
                                                            className="mt-0.5 shrink-0"
                                                        >
                                                            {isCompleted ? (
                                                                <CheckCircle size={16} className="text-emerald-500" />
                                                            ) : isActive ? (
                                                                <PlayCircle size={16} className="text-blue-500" />
                                                            ) : (
                                                                <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center bg-white hover:border-slate-400">
                                                                </div>
                                                            )}
                                                        </button>
                                                        <div>
                                                            <p className={`text-sm font-medium leading-tight ${isActive ? 'text-blue-700 font-bold' : 'text-slate-700'}`}>
                                                                {lesson.title}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500 mt-1">{lesson.duration ? `${Math.floor(lesson.duration / 60)}:${(lesson.duration % 60).toString().padStart(2, '0')}` : 'วิดีโอ'}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : course.schedules && course.schedules.length > 0 ? (
                        /* Use Schedules if Chapters don't exist */
                        <div className="bg-slate-50/50 pt-2">
                            {course.schedules.map((sched: any, idx: number) => {
                                const isActive = currentLesson?.id === sched.id;
                                const isCompleted = completedLessons.has(sched.id);
                                return (
                                    <div
                                        key={sched.id}
                                        className={`flex items-start gap-3 p-4 pl-6 cursor-pointer transition-colors border-l-2
                                            ${isActive ? 'bg-blue-50/50 border-blue-500' : 'border-transparent hover:bg-slate-100'}`}
                                        onClick={() => setCurrentLesson(sched)}
                                    >
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleCompleted(sched.id); }}
                                            className="mt-0.5 shrink-0"
                                        >
                                            {isCompleted ? (
                                                <CheckCircle size={16} className="text-emerald-500" />
                                            ) : isActive ? (
                                                <PlayCircle size={16} className="text-blue-500" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center bg-white hover:border-slate-400"></div>
                                            )}
                                        </button>
                                        <div>
                                            <p className={`text-sm font-medium leading-tight ${isActive ? 'text-blue-700 font-bold' : 'text-slate-700'}`}>
                                                {sched.topic || `บทเรียนที่ ${idx + 1}`}
                                            </p>
                                            {sched.chapterTitle && <p className="text-[10px] text-slate-500 mt-1">{sched.chapterTitle}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-slate-400 text-sm italic font-medium">
                            ยังไม่มีเนื้อหาบทเรียน
                        </div>
                    )}
                </div>

                {/* Bottom Action */}
                <div className="p-4 border-t border-slate-100 bg-white flex gap-3">
                    <button
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                            ${currentIndex <= 0
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
                        onClick={goToPrev}
                        disabled={currentIndex <= 0}
                    >
                        <ArrowLeft size={16} /> ก่อนหน้า
                    </button>
                    <button
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                            ${currentIndex >= allLessons.length - 1
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'}`}
                        onClick={goToNext}
                        disabled={currentIndex >= allLessons.length - 1}
                    >
                        ถัดไป <ArrowLeft size={16} className="rotate-180" />
                    </button>
                </div>
            </div>

            {/* Review Modal */}
            {isReviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Star className="text-yellow-500 fill-yellow-500" size={20} />
                                {userReview ? 'แก้ไขรีวิว' : 'เขียนรีวิวคอร์ส'}
                            </h3>
                            <button
                                onClick={() => setIsReviewOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={submitReview} className="p-6">
                            <div className="mb-6 flex flex-col items-center">
                                <label className="block text-sm font-bold text-gray-700 mb-3">คุณให้คะแนนคอร์สนี้เท่าไหร่?</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            type="button"
                                            key={star}
                                            onClick={() => setReviewRating(star)}
                                            className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                                        >
                                            <Star
                                                size={40}
                                                className={`transition-colors ${reviewRating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-50'}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">ความคิดเห็น (ไม่บังคับ)</label>
                                <textarea
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="เล่าประสบการณ์การเรียนของคุณ ประทับใจส่วนไหนบ้าง..."
                                    className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm bg-gray-50 focus:bg-white"
                                    maxLength={1000}
                                />
                                <div className="text-right text-xs text-gray-400 mt-2">
                                    {reviewComment.length}/1000
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                                <button
                                    type="button"
                                    onClick={() => setIsReviewOpen(false)}
                                    className="px-5 py-2.5 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingReview}
                                    className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmittingReview && <Loader2 size={16} className="animate-spin" />}
                                    {userReview ? 'บันทึกการแก้ไข' : 'ส่งรีวิว'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
