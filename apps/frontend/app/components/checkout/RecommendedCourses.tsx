'use client';

import { useEffect, useState } from 'react';
import { courseApi } from '@/app/lib/api';
import type { Course } from '@/app/lib/types';
import CourseSection from '@/app/components/marketplace/CourseSection';
import { Sparkles } from 'lucide-react';

export function RecommendedCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchRecommendations() {
            try {
                const res = await courseApi.getMarketplace({
                    sort: 'popular',
                    limit: 4,
                    status: 'PUBLISHED',
                });
                if (res.success && res.data?.courses) {
                    setCourses(res.data.courses);
                }
            } catch (err) {
                console.error('Failed to fetch recommended courses:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchRecommendations();
    }, []);

    if (isLoading) {
        return (
            <div className="py-10 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
                <div className="flex gap-6 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="min-w-[280px] h-80 bg-gray-100 rounded-2xl shrink-0 border border-gray-100"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (courses.length === 0) return null;

    return (
        <div className="border-t border-gray-100 pt-10 mt-10">
            <CourseSection
                title="คอร์สที่คุณอาจสนใจ"
                icon={<Sparkles className="text-primary fill-primary/20" size={24} />}
                courses={courses}
                viewAllLink="/explore"
            />
        </div>
    );
}
