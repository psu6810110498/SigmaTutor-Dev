"use client";

import { ChevronDown, Search } from 'lucide-react';
import { Category, Level } from '@/app/lib/types';

interface AdvancedFilterBarProps {
    // Children of the selected QuickFilter (or all if ทั้งหมด)
    subjectCategories: Category[];
    levels: Level[];
    categoryId: string | null;
    levelId: string | null;
    courseType: string | null;
    minPrice: string | null;
    maxPrice: string | null;
    searchInput: string;
    onCategoryChange: (id: string | null) => void;
    onLevelChange: (id: string | null) => void;
    onTypeChange: (type: string | null) => void;
    onPriceChange: (min: number | null, max: number | null) => void;
    onSearchChange: (value: string | null) => void;
}

export default function AdvancedFilterBar({
    subjectCategories,
    levels,
    categoryId,
    levelId,
    courseType,
    minPrice,
    maxPrice,
    searchInput,
    onCategoryChange,
    onLevelChange,
    onTypeChange,
    onPriceChange,
    onSearchChange
}: AdvancedFilterBarProps) {

    // Price Ranges Logic
    const handlePriceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'all') onPriceChange(null, null);
        else if (value === 'under-1000') onPriceChange(0, 1000);
        else if (value === '1000-3000') onPriceChange(1000, 3000);
        else if (value === '3000-5000') onPriceChange(3000, 5000);
        else if (value === 'above-5000') onPriceChange(5000, 100000);
    };

    const getPriceValue = () => {
        if (!minPrice && !maxPrice) return 'all';
        if (Number(maxPrice) === 1000) return 'under-1000';
        if (Number(minPrice) === 1000 && Number(maxPrice) === 3000) return '1000-3000';
        if (Number(minPrice) === 3000 && Number(maxPrice) === 5000) return '3000-5000';
        if (Number(minPrice) === 5000) return 'above-5000';
        return 'all';
    };

    const selectClass = "appearance-none w-full md:w-40 bg-white border border-gray-200 text-gray-700 py-3 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer hover:border-gray-300 transition-colors text-sm font-medium shadow-sm";

    return (
        <div className="py-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-center">

                {/* Filters Group */}
                <div className="flex flex-col md:flex-row flex-wrap gap-3 justify-center w-full md:w-auto">

                    {/* Subject Filter (Children of Quick Filter) */}
                    <div className="relative w-full md:w-auto">
                        <select
                            value={categoryId || 'all'}
                            onChange={(e) => onCategoryChange(e.target.value === 'all' ? null : e.target.value)}
                            className={selectClass}
                        >
                            <option value="all">วิชาทั้งหมด</option>
                            {subjectCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Level Filter (NEW) */}
                    <div className="relative w-full md:w-auto">
                        <select
                            value={levelId || 'all'}
                            onChange={(e) => onLevelChange(e.target.value === 'all' ? null : e.target.value)}
                            className={selectClass}
                        >
                            <option value="all">ทุกระดับชั้น</option>
                            {levels.map((lvl) => (
                                <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Format Filter */}
                    <div className="relative w-full md:w-auto">
                        <select
                            value={courseType || 'all'}
                            onChange={(e) => onTypeChange(e.target.value === 'all' ? null : e.target.value)}
                            className={selectClass}
                        >
                            <option value="all">รูปแบบทั้งหมด</option>
                            <option value="ONLINE">Online (เรียนเอง)</option>
                            <option value="ONLINE_LIVE">Live (เรียนสด)</option>
                            <option value="ONSITE">Onsite (ที่สถาบัน)</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Price Filter */}
                    <div className="relative w-full md:w-auto">
                        <select
                            value={getPriceValue()}
                            onChange={handlePriceChange}
                            className={selectClass}
                        >
                            <option value="all">ช่วงราคาทั้งหมด</option>
                            <option value="under-1000">ต่ำกว่า 1,000 บาท</option>
                            <option value="1000-3000">1,000 - 3,000 บาท</option>
                            <option value="3000-5000">3,000 - 5,000 บาท</option>
                            <option value="above-5000">มากกว่า 5,000 บาท</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-72">
                        <input
                            type="text"
                            placeholder="ค้นหาคอร์สที่ใช่..."
                            value={searchInput}
                            onChange={(e) => onSearchChange(e.target.value || null)}
                            className="w-full py-3 pl-11 pr-4 rounded-lg border border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-sm transition-all placeholder:text-gray-400 shadow-sm"
                        />
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                </div>

            </div>
        </div>
    );
}
