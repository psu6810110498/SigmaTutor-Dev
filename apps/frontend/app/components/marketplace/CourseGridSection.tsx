"use client";

import { useState, useEffect } from 'react';
import { Course } from '@/app/lib/types';
import { courseApi } from '@/app/lib/api';
import CourseCard from '@/app/components/marketplace/CourseCard';
import Link from 'next/link';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface CourseGridSectionProps {
    title: string;
    subtitle?: string;
    categoryId?: string; // Optional: if null, might fetch all or based on other criteria
    levelId?: string | null;
    tutorId?: string | null;
    courseType?: string | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    search?: string;
    initialLimit?: number;
    className?: string; // For custom styling (e.g. background icons)
    icon?: React.ReactNode;
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
    initialLimit = 4,
    className = "",
    icon
}: CourseGridSectionProps) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [totalCourses, setTotalCourses] = useState(0);

    useEffect(() => {
        setLoading(true);
        const fetchCourses = async () => {
            try {
                // Fetch all courses when expanded, or just initial limit
                // Mobile and Desktop: Show all courses when expanded (no pagination, stay on same page)
                const limit = isExpanded ? 1000 : initialLimit;

                const res = await courseApi.getMarketplace({
                    categoryId,
                    levelId: levelId || undefined,
                    tutorId: tutorId || undefined,
                    // @ts-ignore - API supports these but types might be lagging in this file context, safe to ignore for now
                    courseType,
                    minPrice,
                    maxPrice,
                    search,
                    limit,
                    sort: 'popular' // Or any default sort
                });

                if (res.success && res.data) {
                    setCourses(res.data.courses);
                    setTotalCourses(res.data.pagination.total);
                }
            } catch (error) {
                console.error(`Failed to fetch courses for ${title}`, error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [categoryId, levelId, tutorId, courseType, minPrice, maxPrice, search, isExpanded, initialLimit, title]);

    if (loading) {
        return (
            <section className="py-12 px-4 max-w-7xl mx-auto">
                <div className="h-8 w-64 bg-gray-100 rounded mb-4 animate-pulse" />
                {/* Mobile: Horizontal scroll skeleton */}
                <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
                    <div className="flex gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-[300px] w-[280px] bg-gray-50 rounded-2xl animate-pulse flex-shrink-0" />
                        ))}
                    </div>
                </div>
                {/* Desktop: Grid skeleton */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-[300px] bg-gray-50 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </section>
        );
    }

    if (courses.length === 0) return null;

    return (
        <section className={`py-12 md:py-16 ${className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                            {icon && <span className="text-primary">{icon}</span>}
                            {title}
                        </h2>
                        {subtitle && <p className="text-gray-500 mt-2 font-serif">{subtitle}</p>}
                    </div>

                    {/* Toggle Button (Desktop) */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="hidden md:flex items-center text-primary font-bold hover:bg-primary/5 px-4 py-2 rounded-lg transition-colors"
                    >
                        {isExpanded ? (
                            <>ย่อลง <ChevronDown className="ml-2 w-4 h-4" /></>
                        ) : (
                            <>ดูทั้งหมด <ChevronRight className="ml-2 w-4 h-4" /></>
                        )}
                    </button>
                </div>

                {/* Grid */}
                {/* Mobile: Horizontal scroll (single row) */}
                {/* Desktop: Vertical grid (all courses) */}
                <div className="md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6">
                    {/* Mobile: Horizontal scroll container */}
                    <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 pb-4">
                        <div className="flex gap-4">
                            {courses.map((course) => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    </div>
                    {/* Desktop: Grid layout */}
                    <div className="hidden md:contents">
                        {courses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                </div>

                {/* Mobile Toggle Button */}
                <div className="mt-8 text-center md:hidden">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {isExpanded ? 'ย่อลง' : 'ดูคอร์สทั้งหมด'}
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>
            </div>
        </section>
    );
}
