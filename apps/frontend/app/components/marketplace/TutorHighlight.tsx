"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { tutorApi, TutorProfile, TutorFilterParams } from '@/app/lib/api';
import { CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';

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
 * Displays a list of instructors filtered by the currently active marketplace filters.
 * Re-fetches automatically whenever any filter prop changes.
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
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Re-fetch tutors whenever any filter changes
    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        const params: TutorFilterParams = {
            categoryId,
            levelId,
            courseType,
            minPrice,
            maxPrice,
            search,
        };

        tutorApi.getFiltered(params).then((res) => {
            if (!cancelled && res.success && res.data) {
                setTutors(res.data);
            }
        }).catch(() => {
            // Silently fail — tutor list is non-critical
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });

        return () => { cancelled = true; };
    }, [categoryId, levelId, courseType, minPrice, maxPrice, search]);

    // Display logic: show first 8 when collapsed, all when expanded
    const displayedTutors = isExpanded ? tutors : tutors.slice(0, 8);

    if (loading) {
        return (
            <section className="py-8 max-w-7xl mx-auto px-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">TUTOR HIGHLIGHT</h2>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center flex-shrink-0">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 animate-pulse" />
                            <div className="w-20 h-4 bg-gray-200 rounded mt-2 animate-pulse" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (tutors.length === 0) return null;

    return (
        <section className="py-8 max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">TUTOR HIGHLIGHT</h2>

                {/* Desktop: Toggle button */}
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
            <div ref={scrollContainerRef} className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 pb-4">
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
                <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 transition-all duration-300">
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

                {/* Mobile: Toggle button (inside desktop block for desktop layout — kept as-is) */}
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
