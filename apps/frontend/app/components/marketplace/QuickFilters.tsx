import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface QuickFiltersProps {
    filters?: string[];
    activeFilter?: string;
    onFilterChange: (filter: string) => void;
}

export default function QuickFilters({
    filters = ["ทั้งหมด", "ประถม", "ม.ต้น", "ม.ปลาย", "TCAS", "SAT", "IELTS"],
    activeFilter = "TCAS", // Default active as per requirement
    onFilterChange
}: QuickFiltersProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftShadow, setShowLeftShadow] = useState(false);
    const [showRightShadow, setShowRightShadow] = useState(true);

    const checkScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftShadow(scrollLeft > 0);
        setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 5); // buffer
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const scrollAmount = 200;
        scrollContainerRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    return (
        <div className="relative z-20 -mt-6 md:-mt-8 px-4 max-w-7xl mx-auto group">

            {/* Left Gradient & Button */}
            <div className={`absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showLeftShadow ? 'opacity-100' : 'opacity-0'}`} />
            {showLeftShadow && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 -mt-2 z-20 bg-white shadow-md rounded-full p-1.5 text-gray-600 hover:text-primary hover:scale-110 transition-all hidden md:flex"
                >
                    <ChevronLeft size={20} />
                </button>
            )}

            {/* Scroll Container */}
            <div
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="w-full pb-4 scrollbar-hide flex justify-center md:justify-center md:overflow-x-auto"
            >
                <div className="flex gap-2.5 md:gap-3 bg-white/95 backdrop-blur-xl p-2 rounded-2xl md:rounded-full border border-gray-100/50 shadow-lg shadow-gray-200/50 flex-wrap justify-center w-full md:w-max md:flex-nowrap md:shrink-0 mx-auto md:mx-0">
                    {filters.map((filter) => {
                        const isActive = activeFilter === filter;
                        return (
                            <button
                                key={filter}
                                onClick={() => onFilterChange(filter)}
                                className={`px-4 md:px-6 py-2 rounded-lg md:rounded-full text-xs md:text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive ? 'bg-secondary text-white shadow-md transform scale-105' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
                            >
                                {filter}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right Gradient & Button */}
            <div className={`absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showRightShadow ? 'opacity-100' : 'opacity-0'}`} />
            {showRightShadow && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 -mt-2 z-20 bg-white shadow-md rounded-full p-1.5 text-gray-600 hover:text-primary hover:scale-110 transition-all hidden md:flex"
                >
                    <ChevronRight size={20} />
                </button>
            )}
        </div>
    );
}
