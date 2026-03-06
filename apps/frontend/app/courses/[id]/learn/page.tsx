"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PlayCircle, CheckCircle, Lock, BookOpen, Download, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useToast } from "@/app/components/ui/Toast";
import { SigmaLogo } from '@/app/components/icons/SigmaLogo';

export default function LearningPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();

    const courseId = params.id as string;
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // State สำหรับการเรียน
    const [currentLesson, setCurrentLesson] = useState<any>(null);
    const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                // Fetch public course detail (which includes chapters/schedules)
                const res = await fetch(`http://localhost:4000/api/courses/${courseId}`);
                const data = await res.json();

                if (data.success) {
                    setCourse(data.data);

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

    const toggleChapter = (chapterId: string) => {
        const newExpanded = new Set(expandedChapters);
        if (newExpanded.has(chapterId)) {
            newExpanded.delete(chapterId);
        } else {
            newExpanded.add(chapterId);
        }
        setExpandedChapters(newExpanded);
    };

    const toggleCompleted = (lessonId: string) => {
        const newCompleted = new Set(completedLessons);
        if (newCompleted.has(lessonId)) {
            newCompleted.delete(lessonId);
        } else {
            newCompleted.add(lessonId);
        }
        setCompletedLessons(newCompleted);
        // ในระบบจริงควรจะ Request ไป Backend ยืนยันว่าเรียนจบ
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
    const progressPercent = totalItems === 0 ? 0 : Math.round((completedLessons.size / totalItems) * 100);

    // Note: video rendering logic is now inline in the JSX below,
    // supporting both YouTube and Gumlet providers.

    return (
        <div className="flex h-screen bg-slate-50 text-slate-700 font-sans overflow-hidden">

            {/* --- Sidebar ซ้ายสุด (Navigation เล็กๆ) --- */}
            <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-6 shrink-0 z-10 shadow-sm">
                <div className="mb-8">
                    <SigmaLogo size="sm" showText={false} href="/my-courses" />
                </div>
                <nav className="flex flex-col gap-6">
                    <Link href="/my-courses" className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="คอร์สของฉัน">
                        <ArrowLeft size={20} />
                    </Link>
                </nav>
            </div>

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
                        {currentLesson?.videoProvider === 'GUMLET' && currentLesson?.gumletVideoId ? (
                            <iframe
                                src={`https://play.gumlet.io/embed/${currentLesson.gumletVideoId}`}
                                className="w-full h-full"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                                title={currentLesson?.title || 'Gumlet Video'}
                            />
                        ) : (() => {
                            const rawUrl = currentLesson?.videoUrl || currentLesson?.youtubeUrl || course.demoVideoUrl;
                            const vid = rawUrl
                                ? (rawUrl.includes('v=') ? rawUrl.split('v=')[1]?.split('&')[0] : rawUrl.split('/').pop())
                                : '';
                            return vid ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${vid}?autoplay=0&rel=0`}
                                    className="w-full h-full"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-100 gap-3">
                                    <PlayCircle size={48} className="opacity-50 text-slate-300" />
                                    <p className="font-medium text-slate-500">ไม่มีวิดีโอสำหรับบทเรียนนี้</p>
                                </div>
                            );
                        })()}
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
                                onClick={goToPrev}
                                disabled={currentIndex <= 0}
                                className={`px-4 py-2 font-bold text-sm rounded-xl border transition-colors flex items-center gap-2
                                    ${currentIndex <= 0
                                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                            >
                                <ArrowLeft size={16} /> ก่อนหน้า
                            </button>
                            <button
                                onClick={goToNext}
                                disabled={currentIndex >= allLessons.length - 1}
                                className={`px-4 py-2 font-bold text-sm rounded-xl transition-all flex items-center gap-2
                                    ${currentIndex >= allLessons.length - 1
                                        ? 'bg-blue-300 text-white cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'}`}
                            >
                                ถัดไป <ArrowLeft size={16} className="rotate-180" />
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
                        <span>{completedLessons.size} จาก {totalItems} บทเรียน</span>
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
                <div className="p-4 border-t border-slate-100 bg-white">
                    <button
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                            ${currentLesson && completedLessons.has(currentLesson.id)
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'}`}
                        onClick={() => currentLesson && toggleCompleted(currentLesson.id)}
                    >
                        {currentLesson && completedLessons.has(currentLesson.id) ? (
                            <><CheckCircle size={18} /> เรียนจบแล้ว</>
                        ) : (
                            'ทำเครื่องหมายว่าเรียนจบ'
                        )}
                    </button>
                </div>
            </div>

        </div>
    );
}
