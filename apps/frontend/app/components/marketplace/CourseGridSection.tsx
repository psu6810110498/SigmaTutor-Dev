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
        const fetchCourses = async () => {
            try {
                // Fetch more if expanded, or just initial limit
                // Optimization: Fetch all needed or paginate. 
                // For simplified "Show All" in-place, we can fetch a larger set (e.g. 12) or 50.
                // If user wants "Show All" to really show ALL, we might need pagination or large limit.
                const limit = isExpanded ? 50 : initialLimit;

                const res = await courseApi.getMarketplace({
                    categoryId,
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
    }, [categoryId, courseType, minPrice, maxPrice, search, isExpanded, initialLimit, title]);

    if (loading) {
        return (
            <section className="py-12 px-4 max-w-7xl mx-auto">
                <div className="h-8 w-64 bg-gray-100 rounded mb-4 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {courses.map((course) => (
                        <CourseCard key={course.id} course={course} />
                    ))}
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
