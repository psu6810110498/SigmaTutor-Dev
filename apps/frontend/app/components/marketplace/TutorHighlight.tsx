"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Instructor } from '@/app/lib/types';
import { courseApi } from '@/app/lib/api';
import { CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';

interface TutorHighlightProps {
    activeTutorId?: string | null;
    onTutorClick: (tutorId: string) => void;
}

export default function TutorHighlight({ activeTutorId, onTutorClick }: TutorHighlightProps) {
    const [tutors, setTutors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Fetch tutors from courses
    useEffect(() => {
        const fetchTutors = async () => {
            try {
                const res = await courseApi.getMarketplace({ limit: 100 });
                if (res.success && res.data) {
                    // Extract unique instructors
                    const uniqueInstructors = new Map<string, Instructor>();
                    res.data.courses.forEach(c => {
                        if (c.instructor && !uniqueInstructors.has(c.instructor.id)) {
                            uniqueInstructors.set(c.instructor.id, c.instructor);
                        }
                    });
                    setTutors(Array.from(uniqueInstructors.values()));
                }
            } catch (error) {
                console.error("Failed to fetch tutors", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTutors();
    }, []);

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

    // Display logic: show first 8 when collapsed, all when expanded
    const displayedTutors = isExpanded ? tutors : tutors.slice(0, 8);

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

            {/* Mobile: Horizontal scroll (single row) */}
            <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 pb-4">
                <div className="flex gap-4">
                    {tutors.map((tutor) => {
                        const isActive = activeTutorId === tutor.id;
                        return (
                            <button
                                key={tutor.id}
                                onClick={() => onTutorClick(tutor.id)}
                                className="flex flex-col items-center flex-shrink-0 group relative"
                            >
                                {/* Circle with gradient border */}
                                <div className={`
                                    relative w-20 h-20 rounded-full p-[3px] mb-2 transition-all duration-300
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
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-xl">
                                                {tutor.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Check mark when active */}
                                    {isActive && (
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-secondary rounded-full border-2 border-white flex items-center justify-center shadow-md">
                                            <CheckCircle2 size={14} className="text-white fill-white" />
                                        </div>
                                    )}
                                </div>
                                
                                {/* Name */}
                                <span className={`
                                    text-xs font-semibold text-center w-20 truncate transition-colors
                                    ${isActive ? 'text-primary' : 'text-gray-700 group-hover:text-primary'}
                                `}>
                                    {tutor.nickname || tutor.name.split(' ')[0]}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Desktop: Grid layout (expands vertically when "ดูทั้งหมด" is clicked) */}
            <div className="hidden md:block">
                <div className={`
                    grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6
                    transition-all duration-300
                `}>
                    {displayedTutors.map((tutor) => {
                        const isActive = activeTutorId === tutor.id;
                        return (
                            <button
                                key={tutor.id}
                                onClick={() => onTutorClick(tutor.id)}
                                className="flex flex-col items-center group relative"
                            >
                                {/* Circle with gradient border */}
                                <div className={`
                                    relative w-24 h-24 rounded-full p-[3px] mb-3 transition-all duration-300
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
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-2xl">
                                                {tutor.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Check mark when active */}
                                    {isActive && (
                                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-secondary rounded-full border-2 border-white flex items-center justify-center shadow-md">
                                            <CheckCircle2 size={16} className="text-white fill-white" />
                                        </div>
                                    )}
                                </div>
                                
                                {/* Name */}
                                <span className={`
                                    text-sm font-semibold text-center transition-colors
                                    ${isActive ? 'text-primary' : 'text-gray-700 group-hover:text-primary'}
                                `}>
                                    {tutor.nickname || tutor.name.split(' ')[0]}
                                </span>
                                
                                {/* Title */}
                                {tutor.title && (
                                    <span className="text-xs text-gray-500 text-center mt-1 line-clamp-1">
                                        {tutor.title}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Mobile: Toggle button */}
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
