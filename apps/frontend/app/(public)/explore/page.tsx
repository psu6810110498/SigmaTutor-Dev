'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Banner, Category, Level } from '@/app/lib/types';
import { bannerApi, categoryApi, levelApi } from '@/app/lib/api';
import BannerStrip from '@/app/components/common/BannerStrip';
import QuickFilters from '@/app/components/marketplace/QuickFilters';
import AdvancedFilterBar from '@/app/components/marketplace/AdvancedFilterBar';
import CourseGridSection from '@/app/components/marketplace/CourseGridSection';
import { useMarketplaceFilters } from '@/app/hooks/useMarketplaceFilters';
import { Filter, X } from 'lucide-react';

// ✅ เปลี่ยนชื่อเป็น ExplorePage ให้ตรงกับกิ่ง main และตำแหน่งไฟล์
export default function ExplorePage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>}>
            <MarketplaceContent />
        </React.Suspense>
    );
}

// Map Quick Filter labels to DB slugs for lookup
const QUICK_FILTER_SLUG_MAP: Record<string, string> = {
    "ประถม": "primary",
    "ม.ต้น": "middle-school",
    "ม.ปลาย": "high-school",
    "TCAS": "tcas",
    "SAT": "sat",
    "IELTS": "ielts",
};

function MarketplaceContent() {
    const {
        rootCategoryId, categoryId, levelId, courseType,
        minPrice, maxPrice, search, searchInput,
        setRootCategory, setCategory, setLevel, setCourseType,
        setPriceRange, clearAll, setSearch
    } = useMarketplaceFilters();

    // State
    const [topBanners, setTopBanners] = useState<Banner[]>([]);
    const [middleBanners, setMiddleBanners] = useState<Banner[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch reference data once
    useEffect(() => {
        const fetchData = async () => {
            try {
                // ✅ ดึงข้อมูลจริงจาก API (ที่เชื่อมกับระบบใหม่)
                const [topRes, middleRes, catRes, lvlRes] = await Promise.all([
                    bannerApi.getActive('EXPLORE_TOP'),
                    bannerApi.getActive('EXPLORE_MIDDLE'),
                    categoryApi.list(),
                    levelApi.list(),
                ]);
                if (topRes.success && topRes.data) setTopBanners(topRes.data);
                if (middleRes.success && middleRes.data) setMiddleBanners(middleRes.data);
                if (catRes.success && catRes.data) setCategories(catRes.data);
                if (lvlRes.success && lvlRes.data) setLevels(lvlRes.data);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Derived: only root categories (parentId is null)
    const rootCategories = useMemo(
        () => categories.filter(c => !c.parentId),
        [categories]
    );

    const selectedRoot = useMemo(
        () => rootCategories.find(c => c.id === rootCategoryId),
        [rootCategories, rootCategoryId]
    );

    const childCategories = useMemo(() => {
        if (!rootCategoryId) return [];
        return categories.filter(c => c.parentId === rootCategoryId);
    }, [categories, rootCategoryId]);

    const activeFilterLabel = selectedRoot?.name || "ทั้งหมด";

    const handleQuickFilterChange = (label: string) => {
        if (label === "ทั้งหมด") {
            setRootCategory(null);
            return;
        }
        const found = rootCategories.find(c => c.name === label);
        if (found) setRootCategory(found.id);
    };

    const activeFilters: { key: string; label: string; onRemove: () => void }[] = [];
    if (categoryId) {
        const cat = categories.find(c => c.id === categoryId);
        if (cat) activeFilters.push({ key: 'cat', label: cat.name, onRemove: () => setCategory(null) });
    }
    if (levelId) {
        const lvl = levels.find(l => l.id === levelId);
        if (lvl) activeFilters.push({ key: 'level', label: lvl.name, onRemove: () => setLevel(null) });
    }
    if (courseType) {
        const labels: Record<string, string> = { ONLINE: 'Online', ONLINE_LIVE: 'Live สด', ONSITE: 'เรียนที่สถาบัน' };
        activeFilters.push({ key: 'type', label: labels[courseType] || courseType, onRemove: () => setCourseType(null) });
    }

    const sectionsToShow = useMemo(() => {
        if (categoryId) {
            const cat = categories.find(c => c.id === categoryId);
            return cat ? [cat] : [];
        }
        if (rootCategoryId && childCategories.length > 0) {
            return childCategories;
        }
        if (rootCategoryId) {
            const root = categories.find(c => c.id === rootCategoryId);
            return root ? [root] : [];
        }
        return rootCategories;
    }, [categories, rootCategoryId, categoryId, childCategories, rootCategories]);

    const uniqueMiddleBanners = useMemo(() => {
        const topIds = new Set(topBanners.map(b => b.id));
        const topImages = new Set(topBanners.map(b => b.imageUrl));
        return middleBanners.filter(b => !topIds.has(b.id) && !topImages.has(b.imageUrl));
    }, [topBanners, middleBanners]);

    return (
        <div className="min-h-screen bg-white">
            {/* 1. Banner Section */}
            <div className="relative z-0">
                {topBanners.length > 0 ? (
                    <BannerStrip banners={topBanners} />
                ) : (
                    <div className="relative overflow-hidden" style={{ height: 'clamp(200px, 30vw, 400px)' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4 text-center z-10">
                            <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight">คอร์สเรียนทั้งหมด</h1>
                            <p className="text-base md:text-xl opacity-80 max-w-lg font-light">เลือกคอร์สที่ใช่ เพื่ออนาคตที่ชอบ</p>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Quick Filters */}
            <div className="sticky top-20 z-50 -mt-8 relative pointer-events-none">
                <div className="pointer-events-auto">
                    <QuickFilters activeFilter={activeFilterLabel} onFilterChange={handleQuickFilterChange} />
                </div>
            </div>

            {/* 3. Advanced Filter Bar */}
            <div className="max-w-7xl mx-auto px-4 mt-8">
                <AdvancedFilterBar
                    subjectCategories={childCategories}
                    levels={levels}
                    categoryId={categoryId}
                    levelId={levelId}
                    courseType={courseType}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    searchInput={searchInput}
                    onCategoryChange={setCategory}
                    onLevelChange={setLevel}
                    onTypeChange={setCourseType}
                    onPriceChange={setPriceRange}
                    onSearchChange={setSearch}
                />
            </div>

            {/* 4. Active Chips */}
            {activeFilters.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 mt-6 flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-500 flex items-center gap-1"><Filter size={14} /> กำลังกรอง:</span>
                    {activeFilters.map(f => (
                        <span key={f.key} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                            {f.label}
                            <button onClick={f.onRemove} className="hover:text-red-500 transition-colors"><X size={12} /></button>
                        </span>
                    ))}
                    <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 underline ml-2">ล้างทั้งหมด</button>
                </div>
            )}

            {/* 5. Course Sections */}
            <div className="pb-24">
                {loading ? (
                    <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-400">กำลังโหลดข้อมูล...</div>
                ) : sectionsToShow.length > 0 ? (
                    sectionsToShow.map((cat) => (
                        <CourseGridSection
                            key={cat.id}
                            title={cat.name}
                            categoryId={cat.id}
                            courseType={courseType}
                            minPrice={minPrice ? Number(minPrice) : null}
                            maxPrice={maxPrice ? Number(maxPrice) : null}
                            search={search}
                            initialLimit={categoryId ? 12 : 4}
                            className="border-b border-gray-50 last:border-0"
                        />
                    ))
                ) : (
                    <div className="text-center py-24 text-gray-400">
                        <p className="text-lg mb-2">ไม่พบคอร์สในหมวดนี้</p>
                        <button onClick={clearAll} className="text-primary font-bold hover:underline">ดูคอร์สทั้งหมด</button>
                    </div>
                )}
            </div>
        </div>
    );
}