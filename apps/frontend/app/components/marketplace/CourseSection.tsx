import { ChevronRight } from 'lucide-react';
import { Course } from '@/app/lib/types';
import CourseCard from './CourseCard';

interface CourseSectionProps {
    title: string;
    courses: Course[];
    icon?: React.ReactNode;
    viewAllLink?: string;
}

export default function CourseSection({ title, courses, icon, viewAllLink = "#" }: CourseSectionProps) {
    return (
        <section className="py-8">
            <div className="flex flex-row justify-between items-center md:items-end mb-4 md:mb-6 gap-2">
                <h2 className="text-lg md:text-2xl font-bold text-gray-900 flex items-center gap-2 line-clamp-1 md:line-clamp-none">
                    {icon}
                    <span className="truncate">{title}</span>
                </h2>
                <a href={viewAllLink} className="text-primary hover:underline text-xs md:text-sm font-semibold flex items-center gap-1 shrink-0 bg-primary/5 px-3 py-1 rounded-full hover:bg-primary/10 transition-colors">
                    ดูทั้งหมด <ChevronRight size={14} />
                </a>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="flex overflow-x-auto gap-6 pb-8 pt-2 px-1 -mx-1 scrollbar-hide snap-x">
                {courses.length > 0 ? (
                    courses.map((course) => (
                        <div key={course.id} className="snap-center">
                            <CourseCard course={course} />
                        </div>
                    ))
                ) : (
                    <div className="w-full text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                        <p>ยังไม่มีคอร์สในหมวดหมู่นี้</p>
                    </div>
                )}
            </div>
        </section>
    );
}
