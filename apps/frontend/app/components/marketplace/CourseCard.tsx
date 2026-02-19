"use client";

import Image from 'next/image';
import { Course } from '@/app/lib/types';
import { Star, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMarketplaceFilters } from '@/app/hooks/useMarketplaceFilters';

interface CourseCardProps {
    course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { tutorId, toggleTutor } = useMarketplaceFilters();

    const hasDiscount = course.promotionalPrice && course.promotionalPrice < course.price;
    const discountPercent = hasDiscount
        ? Math.round(((course.price - course.promotionalPrice!) / course.price) * 100)
        : 0;

    const isTutorActive = tutorId === course.instructor.id;
    const displayRating = course.rating ?? 0;
    const reviewCount = course.reviewCount ?? course._count?.reviews ?? 0;

    const handleTutorClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (pathname === '/explore') {
            toggleTutor(course.instructor.id);
        } else {
            router.push(`/explore?tutorId=${course.instructor.id}`);
        }
    };

    return (
        <Link
            href={`/explore/${course.slug}`}
            className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full group w-[280px] md:w-full flex-shrink-0 relative"
        >
            {/* Thumbnail */}
            <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                {course.thumbnail ? (
                    <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-sm">
                        ไม่มีรูปภาพ
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {course.isBestSeller && (
                        <span className="bg-secondary text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                            มาแรง!!
                        </span>
                    )}
                    {hasDiscount && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                            -{discountPercent}%
                        </span>
                    )}
                </div>

                {/* Tutor Avatar — stops card navigation on click */}
                {course.instructor && (
                    <button
                        onClick={handleTutorClick}
                        className={`absolute bottom-3 left-3 w-10 h-10 rounded-full border-2 overflow-hidden shadow-md z-20 transition-all hover:scale-110 ${isTutorActive
                                ? 'border-green-500 ring-2 ring-green-500 ring-offset-1'
                                : 'border-white'
                            }`}
                        title={`กรองตาม ${course.instructor.name}`}
                    >
                        {course.instructor.profileImage ? (
                            <Image
                                src={course.instructor.profileImage}
                                alt={course.instructor.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                                {course.instructor.name.charAt(0)}
                            </div>
                        )}
                        {isTutorActive && (
                            <div className="absolute inset-0 bg-green-500/50 flex items-center justify-center">
                                <CheckCircle2 size={16} className="text-white bg-green-600 rounded-full" />
                            </div>
                        )}
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                {/* Category + Rating */}
                <div className="flex justify-between items-start mb-2">
                    <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                        {course.category?.name || 'วิชาทั่วไป'}
                    </div>
                    {displayRating > 0 && (
                        <div className="flex items-center gap-1 text-orange-400 text-xs font-bold">
                            <Star size={12} fill="currentColor" />
                            <span>{displayRating.toFixed(1)} ({reviewCount})</span>
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2 line-clamp-2 min-h-[3rem]">
                    {course.title}
                </h3>

                {/* Short Description */}
                {course.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">
                        {course.description}
                    </p>
                )}

                {/* Instructor */}
                {course.instructor && (
                    <span className="text-xs text-gray-400 mb-3 block">
                        โดย {course.instructor.name}
                    </span>
                )}

                {/* Price + CTA */}
                <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex flex-col">
                        {hasDiscount ? (
                            <>
                                <span className="text-gray-400 text-xs line-through">
                                    ฿{course.price.toLocaleString()}
                                </span>
                                <span className="text-secondary text-xl font-bold">
                                    ฿{course.promotionalPrice?.toLocaleString()}
                                </span>
                            </>
                        ) : (
                            <span className="text-secondary text-xl font-bold">
                                ฿{course.price.toLocaleString()}
                            </span>
                        )}
                    </div>

                    <span className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold shadow-sm group-hover:bg-primary-dark transition-colors">
                        ดูรายละเอียด
                    </span>
                </div>
            </div>
        </Link>
    );
}
