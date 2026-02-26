"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { tutorApi, TutorProfile, TutorFilterParams } from '@/app/lib/api';
import { CheckCircle2, ChevronDown, ChevronRight, Users } from 'lucide-react';

interface TutorHighlightProps {
    activeTutorId?: string | null;
    onTutorClick: (tutorId: string) => void;
    // Filter props — kept in sync with QuickFilter + AdvancedFilter
    categoryId?: string | null;
    levelId?: string | null;
    courseType?: string | null;
    minPrice?: string | null;
    maxPrice?: string | null;
    search?: string;
}

/**
 * Displays a filtered list of instructors based on the active marketplace filters.
 * Re-fetches whenever any filter prop changes.
 * Uses AbortController to cancel stale requests when filters change rapidly.
 */
export default function TutorHighlight({
    activeTutorId,
    onTutorClick,
    categoryId,
    levelId,
    courseType,
    minPrice,
    maxPrice,
    search,
}: TutorHighlightProps) {
    const [tutors, setTutors] = useState<TutorProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    // Re-fetch tutors whenever any filter changes.
    // AbortController cancels in-flight requests when filters change rapidly.
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);

        const params: TutorFilterParams = {
            categoryId,
            levelId,
            courseType,
            minPrice,
            maxPrice,
            search,
        };

        tutorApi
            .getFiltered(params)
            .then((res) => {
                // Skip if this request was aborted (newer fetch already in flight)
                if (controller.signal.aborted) return;
                if (res.success && res.data) {
                    setTutors(res.data);
                } else {
                    setTutors([]);
                }
            })
            .catch(() => {
                // AbortError is expected — don't clear results on cancel
                if (!controller.signal.aborted) setTutors([]);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [categoryId, levelId, courseType, minPrice, maxPrice, search]);

    // Collapse back to first page when filters change
    useEffect(() => {
        setIsExpanded(false);
    }, [categoryId, levelId, courseType, minPrice, maxPrice, search]);

    const displayedTutors = isExpanded ? tutors : tutors.slice(0, 8);

    // ── Loading State ──────────────────────────────────────
    if (loading) {
        return (
            <section className="py-8 max-w-7xl mx-auto px-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">TUTOR HIGHLIGHT</h2>
                <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center flex-shrink-0 gap-2">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 animate-pulse" />
                            <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
                            <div className="w-12 h-2 bg-gray-100 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    // ── Empty State ────────────────────────────────────────
    if (tutors.length === 0) {
        const hasActiveFilter = categoryId || levelId || courseType || minPrice || maxPrice || search;
        return (
            <section className="py-8 max-w-7xl mx-auto px-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">TUTOR HIGHLIGHT</h2>
                <div className="flex items-center gap-3 text-gray-400 py-4 px-1">
                    <Users size={20} className="flex-shrink-0" />
                    <p className="text-sm">
                        {hasActiveFilter
                            ? 'ยังไม่มีติวเตอร์สำหรับตัวกรองที่เลือก — ลองปรับตัวกรองดูครับ'
                            : 'ยังไม่มีติวเตอร์ในขณะนี้'}
                    </p>
                </div>
            </section>
        );
    }

    // ── Tutor List ─────────────────────────────────────────
    return (
        <section className="py-8 max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">TUTOR HIGHLIGHT</h2>

                {tutors.length > 8 && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="hidden md:flex items-center text-primary font-bold hover:bg-primary/5 px-4 py-2 rounded-lg transition-colors"
                    >
                        {isExpanded ? (
                            <>ย่อลง <ChevronDown className="ml-2 w-4 h-4" /></>
                        ) : (
                            <>ดูทั้งหมด ({tutors.length}) <ChevronRight className="ml-2 w-4 h-4" /></>
                        )}
                    </button>
                )}
            </div>

            {/* Mobile: Horizontal scroll */}
            <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 pb-4">
                <div className="flex gap-4">
                    {tutors.map((tutor) => (
                        <TutorCard
                            key={tutor.id}
                            tutor={tutor}
                            isActive={activeTutorId === tutor.id}
                            onTutorClick={onTutorClick}
                            size="sm"
                        />
                    ))}
                </div>
            </div>

            {/* Desktop: Grid layout */}
            <div className="hidden md:block">
                <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                    {displayedTutors.map((tutor) => (
                        <TutorCard
                            key={tutor.id}
                            tutor={tutor}
                            isActive={activeTutorId === tutor.id}
                            onTutorClick={onTutorClick}
                            size="md"
                        />
                    ))}
                </div>

                {tutors.length > 8 && (
                    <div className="mt-8 text-center md:hidden">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {isExpanded ? 'ย่อลง' : `ดูทั้งหมด (${tutors.length})`}
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}

// ── Sub-component ──────────────────────────────────────────

interface TutorCardProps {
    tutor: TutorProfile;
    isActive: boolean;
    onTutorClick: (id: string) => void;
    size: 'sm' | 'md';
}

/** Renders a single tutor avatar card with active state styling */
function TutorCard({ tutor, isActive, onTutorClick, size }: TutorCardProps) {
    const ringSize = size === 'sm' ? 'w-20 h-20' : 'w-24 h-24';
    const textSize = size === 'sm' ? 'text-xs w-20' : 'text-sm';
    const avatarTextSize = size === 'sm' ? 'text-xl' : 'text-2xl';

    return (
        <button
            onClick={() => onTutorClick(tutor.id)}
            className="flex flex-col items-center flex-shrink-0 group relative"
            aria-label={`ติวเตอร์ ${tutor.name}`}
            aria-pressed={isActive}
        >
            {/* Circle with gradient border */}
            <div className={`
                relative ${ringSize} rounded-full p-[3px] mb-2 transition-all duration-300
                ${isActive
                    ? 'bg-gradient-to-tr from-primary via-secondary to-primary scale-110 shadow-lg shadow-primary/30'
                    : 'bg-gradient-to-tr from-gray-200 to-gray-300 group-hover:from-primary group-hover:to-secondary group-hover:scale-105'
                }
            `}>
                <div className="w-full h-full rounded-full border-2 border-white overflow-hidden relative bg-gray-100">
                    {tutor.profileImage ? (
                        <Image
                            src={tutor.profileImage}
                            alt={tutor.name}
                            fill
                            sizes="(max-width: 768px) 80px, 96px"
                            className="object-cover"
                        />
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold ${avatarTextSize}`}>
                            {tutor.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Active checkmark badge */}
                {isActive && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-secondary rounded-full border-2 border-white flex items-center justify-center shadow-md">
                        <CheckCircle2 size={14} className="text-white fill-white" />
                    </div>
                )}
            </div>

            {/* Name */}
            <span className={`
                font-semibold text-center truncate transition-colors ${textSize}
                ${isActive ? 'text-primary' : 'text-gray-700 group-hover:text-primary'}
            `}>
                {tutor.nickname ?? tutor.name.split(' ')[0]}
            </span>

            {/* Title (desktop only) */}
            {tutor.title && size === 'md' && (
                <span className="text-xs text-gray-500 text-center mt-1 line-clamp-1">
                    {tutor.title}
                </span>
            )}
        </button>
    );
}
