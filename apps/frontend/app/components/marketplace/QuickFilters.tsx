"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickFiltersProps {
    filters?: string[];
    activeFilter?: string;
    onFilterChange: (filter: string) => void;
    disabled?: boolean;
    className?: string;
}

export default function QuickFilters({
    filters = ["ทั้งหมด", "ประถม", "ม.ต้น", "ม.ปลาย", "TCAS", "SAT", "IELTS"],
    activeFilter = "ทั้งหมด",
    onFilterChange,
    disabled = false,
    className
}: QuickFiltersProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    // Debug: Log props changes
    useEffect(() => {
        console.log('🎨 QuickFilters props:', { activeFilter, disabled, filtersCount: filters.length });
    }, [activeFilter, disabled, filters]);

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
        console.log('🎯 QuickFilter handleFilterClick called:', { filter, disabled, activeFilter });
        if (disabled) {
            console.warn('⚠️ QuickFilter disabled - categories not loaded yet');
            return;
        }
        console.log('✅ QuickFilter calling onFilterChange:', filter);
        onFilterChange(filter);
    };

    return (
        <div className={cn("relative w-full max-w-7xl mx-auto px-2 md:px-6", className)}>
            {/* Mobile: Flex wrap (ไม่ต้องเลื่อน) */}
            <div className="md:hidden">
                <div className="flex flex-wrap gap-2 justify-center py-3 px-2">
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
                                disabled={disabled}
                                className={`
                                    relative z-50
                                    px-3 py-1.5
                                    rounded-full
                                    text-xs
                                    font-semibold
                                    transition-all
                                    duration-200
                                    whitespace-nowrap
                                    select-none
                                    focus:outline-none
                                    focus:ring-2
                                    focus:ring-primary
                                    focus:ring-offset-1
                                    ${disabled
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                        : isActive
                                            ? 'bg-secondary text-white shadow-md shadow-secondary/30 scale-105 cursor-pointer'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-sm cursor-pointer'
                                    }
                                `}
                                aria-pressed={isActive}
                                aria-disabled={disabled}
                                aria-label={`กรองตาม ${filter}`}
                            >
                                {filter}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Desktop: Scroll container with buttons */}
            <div className="hidden md:block relative">
                {/* Desktop: Left scroll button */}
                {canScrollLeft && (
                    <button
                        onClick={scrollLeft}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-white shadow-lg rounded-full p-2 text-gray-600 hover:text-primary hover:bg-gray-50 transition-all items-center justify-center"
                        aria-label="เลื่อนซ้าย"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}

                {/* Desktop: Left gradient overlay */}
                {canScrollLeft && (
                    <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white via-white/80 to-transparent z-20 pointer-events-none" />
                )}

                {/* Scroll container */}
                <div
                    ref={scrollContainerRef}
                    className="overflow-x-auto scrollbar-hide scroll-smooth w-full flex justify-center"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {/* Filters container */}
                    <div className="flex gap-4 justify-center items-center py-4 px-4 bg-white/95 backdrop-blur-sm rounded-full border border-gray-100 shadow-sm min-w-max">
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
                                    disabled={disabled}
                                    className={`
                                        relative z-50
                                        px-6 lg:px-8
                                        py-2.5
                                        rounded-full
                                        text-base
                                        font-semibold
                                        transition-all
                                        duration-200
                                        whitespace-nowrap
                                        select-none
                                        focus:outline-none
                                        focus:ring-2
                                        focus:ring-primary
                                        focus:ring-offset-2
                                        ${disabled
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                            : isActive
                                                ? 'bg-secondary text-white shadow-md shadow-secondary/30 scale-105 cursor-pointer'
                                                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md cursor-pointer'
                                        }
                                    `}
                                    aria-pressed={isActive}
                                    aria-disabled={disabled}
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
                    <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent z-20 pointer-events-none" />
                )}

                {/* Desktop: Right scroll button */}
                {canScrollRight && (
                    <button
                        onClick={scrollRight}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-white shadow-lg rounded-full p-2 text-gray-600 hover:text-primary hover:bg-gray-50 transition-all items-center justify-center"
                        aria-label="เลื่อนขวา"
                    >
                        <ChevronRight size={20} />
                    </button>
                )}
            </div>
        </div>
    );
}
