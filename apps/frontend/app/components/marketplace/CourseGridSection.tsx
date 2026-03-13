"use client";

/**
 * CourseGridSection — Lazy-loaded, filterable course grid with smart expand behavior.
 *
 * Expand UX:
 *  - Mobile (<md): horizontal scroll → expands to 2-column vertical grid ("Load More" chunks)
 *  - Desktop (≥md): "ดูทั้งหมด" navigates to /explore with pre-set category/level filters
 *    (avoids loading 1000+ items inline which kills perf and loses page position)
 *
 * Course count note:
 *  Only courses with status=PUBLISHED are shown. Draft courses are expected to be hidden.
 *  initialLimit defaults to 8 (was 4) so you see a useful amount at a glance.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Course } from '@/app/lib/types';
import { courseApi } from '@/app/lib/api';
import CourseCard from '@/app/components/marketplace/CourseCard';
import CourseCardSkeleton from '@/app/components/marketplace/CourseCardSkeleton';
import { ChevronRight, ChevronDown, ArrowUpRight } from 'lucide-react';

// How many additional cards to reveal per "Load More" tap on mobile
const LOAD_MORE_STEP = 8;

interface CourseGridSectionProps {
    title: string;
    subtitle?: string;
    categoryId?: string;
    levelId?: string | null;
    tutorId?: string | null;
    courseType?: string | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    search?: string;
    /** How many cards to show initially. Raised to 8 (was 4) for better first impression. */
    initialLimit?: number;
    className?: string;
    icon?: React.ReactNode;
    /** If provided, "ดูทั้งหมด" on desktop navigates here instead of /explore */
    viewAllHref?: string;
}

export default function CourseGridSection({
    title,
    subtitle,
    categoryId,
    levelId,
    tutorId,
    courseType,
    minPrice,
    maxPrice,
    search,
    initialLimit = 8,
    className = "",
    icon,
    viewAllHref,
}: CourseGridSectionProps) {
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasIntersected, setHasIntersected] = useState(false);
    const [totalCourses, setTotalCourses] = useState(0);

    // Mobile expand: how many cards to show in vertical 2-col grid
    const [mobileLimit, setMobileLimit] = useState(initialLimit);
    // Desktop expand: whether we've navigated or expanded (navigation mode)
    const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);

    const sectionRef = useRef<HTMLElement>(null);

    // ── Intersection Observer for lazy loading ────────────────────────────────
    useEffect(() => {
        if (!sectionRef.current) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setHasIntersected(true); observer.disconnect(); } },
            { rootMargin: '300px' }
        );
        observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    // ── Fetch courses ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!hasIntersected) return;
        setLoading(true);
        const ctrl = new AbortController();

        const fetch = async () => {
            try {
                // On desktop expanded: fetch all (up to 200, avoid 1000 which is excessive)
                const limit = isDesktopExpanded ? 200 : initialLimit;
                const res = await courseApi.getMarketplace({
                    categoryId,
                    levelId: levelId || undefined,
                    tutorId: tutorId || undefined,
                    // @ts-ignore
                    courseType,
                    minPrice,
                    maxPrice,
                    search,
                    limit,
                    sort: 'popular',
                }, { signal: ctrl.signal });

                if (!ctrl.signal.aborted && res.success && res.data) {
                    setCourses(res.data.courses);
                    setTotalCourses(res.data.pagination.total);
                }
            } catch (err: unknown) {
                if (err instanceof Error && err.name !== 'AbortError') {
                    console.error(`CourseGridSection: fetch failed for "${title}"`, err);
                }
            } finally {
                if (!ctrl.signal.aborted) setLoading(false);
            }
        };

        const t = setTimeout(fetch, 300);
        return () => { clearTimeout(t); ctrl.abort(); };
    }, [categoryId, levelId, tutorId, courseType, minPrice, maxPrice, search, initialLimit, title, hasIntersected, isDesktopExpanded]);

    // Reset mobile limit when filters change
    useEffect(() => { setMobileLimit(initialLimit); }, [categoryId, levelId, tutorId, courseType, minPrice, maxPrice, search, initialLimit]);

    // ── "ดูทั้งหมด" handler — navigates to /explore on desktop ──────────────
    const buildExploreHref = useCallback(() => {
        if (viewAllHref) return viewAllHref;
        const params = new URLSearchParams();
        if (categoryId) params.set('categoryId', categoryId);
        if (levelId) params.set('levelId', levelId);
        if (courseType) params.set('courseType', courseType);
        params.set('sort', 'popular');
        return `/explore?${params.toString()}`;
    }, [viewAllHref, categoryId, levelId, courseType]);

    // ── Render states ─────────────────────────────────────────────────────────
    if (!hasIntersected || loading) {
        return (
            <section ref={sectionRef} className={`py-10 px-4 max-w-7xl mx-auto min-h-[380px] ${className}`}>
                <div className="h-7 w-56 bg-gray-100 rounded mb-4 animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(initialLimit > 4 ? 4 : initialLimit)].map((_, i) => (
                        <CourseCardSkeleton key={i} />
                    ))}
                </div>
            </section>
        );
    }

    if (courses.length === 0) return null;

    // Cards to show on mobile (vertical grid, expandable via Load More)
    const mobileCards = courses.slice(0, mobileLimit);
    const hasMoreMobile = mobileLimit < courses.length || mobileLimit < totalCourses;

    // Cards for desktop (all fetched, shown in grid)
    const desktopCards = isDesktopExpanded ? courses : courses.slice(0, initialLimit);
    const hasMoreDesktop = !isDesktopExpanded && (courses.length > initialLimit || totalCourses > initialLimit);

    return (
        <section ref={sectionRef} className={`py-10 md:py-14 min-h-[380px] ${className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ── Section header ───────────────────────────────────────── */}
                <div className="flex items-end justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            {icon && <span className="text-primary">{icon}</span>}
                            {title}
                        </h2>
                        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
                    </div>

                    {/* Desktop "ดูทั้งหมด" — navigate to /explore */}
                    {hasMoreDesktop && (
                        <button
                            onClick={() => router.push(buildExploreHref())}
                            className="hidden md:flex items-center gap-1.5 text-sm text-primary font-bold hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                        >
                            ดูทั้งหมด ({totalCourses})
                            <ArrowUpRight size={15} />
                        </button>
                    )}
                    {isDesktopExpanded && (
                        <button
                            onClick={() => setIsDesktopExpanded(false)}
                            className="hidden md:flex items-center gap-1 text-sm text-gray-500 font-bold hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                        >
                            ย่อลง <ChevronDown size={15} />
                        </button>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════════
                    MOBILE: 2-column vertical grid (replaces horizontal scroll)
                    — Users can "Load More" to see additional cards
                ══════════════════════════════════════════════════════════════ */}
                <div className="md:hidden">
                    <div className="grid grid-cols-2 gap-3">
                        {mobileCards.map((course, i) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                index={i}
                                priority={i < 4}
                            />
                        ))}
                    </div>

                    {hasMoreMobile && (
                        <button
                            onClick={() => {
                                if (mobileLimit >= courses.length && totalCourses > courses.length) {
                                    // Need to fetch more — navigate to explore
                                    router.push(buildExploreHref());
                                } else {
                                    setMobileLimit(prev => prev + LOAD_MORE_STEP);
                                }
                            }}
                            className="mt-5 w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
                        >
                            ดูเพิ่มเติม ({Math.min(totalCourses - mobileCards.length, LOAD_MORE_STEP)} คอร์ส)
                            <ChevronRight size={16} />
                        </button>
                    )}

                    {/* Link to full explore when all cards are shown */}
                    {!hasMoreMobile && totalCourses > 0 && (
                        <button
                            onClick={() => router.push(buildExploreHref())}
                            className="mt-3 w-full text-primary text-sm font-semibold py-2 flex items-center justify-center gap-1.5 hover:underline"
                        >
                            ดูทั้งหมด {totalCourses} คอร์ส <ArrowUpRight size={14} />
                        </button>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════════
                    DESKTOP: standard responsive grid
                ══════════════════════════════════════════════════════════════ */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {desktopCards.map((course, i) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            index={i}
                            priority={i < 4}
                        />
                    ))}
                </div>

                {/* Desktop: inline expand (if navigating to explore is not wanted) */}
                {isDesktopExpanded && courses.length < totalCourses && (
                    <div className="hidden md:flex justify-center mt-6">
                        <button
                            onClick={() => router.push(buildExploreHref())}
                            className="flex items-center gap-2 text-primary font-bold border border-primary/20 hover:bg-primary/5 px-6 py-2.5 rounded-xl text-sm transition-colors"
                        >
                            ดูทั้งหมด {totalCourses} คอร์สใน Explore <ArrowUpRight size={15} />
                        </button>
                    </div>
                )}

            </div>
        </section>
    );
}
