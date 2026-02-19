"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface QuickFiltersProps {
    filters?: string[];
    activeFilter?: string;
    onFilterChange: (filter: string) => void;
}

export default function QuickFilters({
    filters = ["ทั้งหมด", "ประถม", "ม.ต้น", "ม.ปลาย", "TCAS", "SAT", "IELTS"],
    activeFilter = "ทั้งหมด",
    onFilterChange
}: QuickFiltersProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    // Check scroll position
    const checkScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        checkScroll();
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);
        }
        return () => {
            if (container) {
                container.removeEventListener('scroll', checkScroll);
            }
            window.removeEventListener('resize', checkScroll);
        };
    }, []);

    // Scroll functions
    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    // Handle filter click
    const handleFilterClick = (filter: string) => {
        console.log('🎯 QuickFilter clicked:', filter);
        onFilterChange(filter);
    };

    return (
        <div className="relative w-full max-w-7xl mx-auto px-4 md:px-6 flex justify-center">
            {/* Desktop: Left scroll button */}
            {canScrollLeft && (
                <button
                    onClick={scrollLeft}
                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-white shadow-lg rounded-full p-2 text-gray-600 hover:text-primary hover:bg-gray-50 transition-all items-center justify-center"
                    aria-label="เลื่อนซ้าย"
                >
                    <ChevronLeft size={20} />
                </button>
            )}

            {/* Desktop: Left gradient overlay */}
            {canScrollLeft && (
                <div className="hidden md:block absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white via-white/80 to-transparent z-20 pointer-events-none" />
            )}

            {/* Scroll container */}
            <div
                ref={scrollContainerRef}
                className="overflow-x-auto scrollbar-hide scroll-smooth w-full flex justify-center"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {/* Filters container */}
                <div className="flex gap-3 md:gap-4 justify-center items-center py-3 md:py-4 px-2 md:px-4 bg-white/95 backdrop-blur-sm rounded-full border border-gray-100 shadow-sm min-w-max">
                    {filters.map((filter) => {
                        const isActive = activeFilter === filter;
                        return (
                            <button
                                key={filter}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleFilterClick(filter);
                                }}
                                className={`
                                    relative z-50
                                    px-4 md:px-6 lg:px-8
                                    py-2 md:py-2.5
                                    rounded-full
                                    text-sm md:text-base
                                    font-semibold
                                    transition-all
                                    duration-200
                                    whitespace-nowrap
                                    cursor-pointer
                                    select-none
                                    focus:outline-none
                                    focus:ring-2
                                    focus:ring-primary
                                    focus:ring-offset-2
                                    ${isActive
                                        ? 'bg-secondary text-white shadow-md shadow-secondary/30 scale-105'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
                                    }
                                `}
                                aria-pressed={isActive}
                                aria-label={`กรองตาม ${filter}`}
                            >
                                {filter}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Desktop: Right gradient overlay */}
            {canScrollRight && (
                <div className="hidden md:block absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent z-20 pointer-events-none" />
            )}

            {/* Desktop: Right scroll button */}
            {canScrollRight && (
                <button
                    onClick={scrollRight}
                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-white shadow-lg rounded-full p-2 text-gray-600 hover:text-primary hover:bg-gray-50 transition-all items-center justify-center"
                    aria-label="เลื่อนขวา"
                >
                    <ChevronRight size={20} />
                </button>
            )}
        </div>
    );
}
