"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Banner, Category, Level } from '@/app/lib/types';
import { bannerApi, categoryApi, levelApi } from '@/app/lib/api';
import BannerStrip from '@/app/components/common/BannerStrip';
import QuickFilters from '@/app/components/marketplace/QuickFilters';
import AdvancedFilterBar from '@/app/components/marketplace/AdvancedFilterBar';
import CourseGridSection from '@/app/components/marketplace/CourseGridSection';
import { useMarketplaceFilters } from '@/app/hooks/useMarketplaceFilters';
import { Filter, X } from 'lucide-react';

export default function MarketplacePage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
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

    // Find the selected root category object
    const selectedRoot = useMemo(
        () => rootCategories.find(c => c.id === rootCategoryId),
        [rootCategories, rootCategoryId]
    );

    // Children of selected root for Subject dropdown
    const childCategories = useMemo(() => {
        if (!rootCategoryId) return [];
        return categories.filter(c => c.parentId === rootCategoryId);
    }, [categories, rootCategoryId]);

    // Determine active Quick Filter label
    const activeFilterLabel = selectedRoot?.name || "ทั้งหมด";

    // Handle Quick Filter click
    const handleQuickFilterChange = (label: string) => {
        if (label === "ทั้งหมด") {
            setRootCategory(null);
            return;
        }
        // Find root category by name
        const found = rootCategories.find(c => c.name === label);
        if (found) setRootCategory(found.id);
    };

    // Active filter chips
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

    // Determine what sections to show
    const sectionsToShow = useMemo(() => {
        // Specific child selected → single section
        if (categoryId) {
            const cat = categories.find(c => c.id === categoryId);
            return cat ? [cat] : [];
        }
        // Root selected → show its children
        if (rootCategoryId && childCategories.length > 0) {
            return childCategories;
        }
        // Root with no children → show root itself
        if (rootCategoryId) {
            const root = categories.find(c => c.id === rootCategoryId);
            return root ? [root] : [];
        }
        // "ทั้งหมด" → show only 6 root categories (NOT children)
        return rootCategories;
    }, [categories, rootCategoryId, categoryId, childCategories, rootCategories]);

    return (
        <div className="min-h-screen bg-white">

            {/* 1. Banner (EXPLORE_TOP) */}
            <div>
                {topBanners.length > 0 ? (
                    <BannerStrip banners={topBanners} />
                ) : (
                    /* Fallback Hero Banner */
                    <div className="relative overflow-hidden" style={{ height: 'clamp(200px, 30vw, 400px)' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]" />
                        {/* Decorative Shapes */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4 text-center z-10">
                            <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight">
                                คอร์สเรียนทั้งหมด
                            </h1>
                            <p className="text-base md:text-xl opacity-80 max-w-lg font-light">
                                เลือกคอร์สที่ใช่ เพื่ออนาคตที่ชอบ
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Quick Filters — uses hardcoded 7 labels from component */}
            <div className="sticky top-20 z-40 -mt-8">
                <QuickFilters
                    activeFilter={activeFilterLabel}
                    onFilterChange={handleQuickFilterChange}
                />
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

            {/* 4. Active Filter Chips */}
            {activeFilters.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 mt-6 flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-500 flex items-center gap-1">
                        <Filter size={14} /> กำลังกรอง:
                    </span>
                    {activeFilters.map(f => (
                        <span key={f.key} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                            {f.label}
                            <button onClick={f.onRemove} className="hover:text-red-500 transition-colors"><X size={12} /></button>
                        </span>
                    ))}
                    <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 underline ml-2">
                        ล้างทั้งหมด
                    </button>
                </div>
            )}

            {/* 5. Middle Banner */}
            {middleBanners.length > 0 && (
                <div className="mt-8 mb-4">
                    <BannerStrip banners={middleBanners} />
                </div>
            )}

            {/* 6. Course Sections */}
            <div className="pb-24">
                {loading ? (
                    /* Skeleton Loading */
                    <div className="max-w-7xl mx-auto px-4 py-12">
                        {[1, 2].map((i) => (
                            <div key={i} className="mb-12">
                                <div className="h-8 w-48 bg-gray-100 rounded-lg mb-6 animate-pulse" />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[1, 2, 3, 4].map((j) => (
                                        <div key={j} className="h-[320px] bg-gray-50 rounded-2xl animate-pulse" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
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
                        <button onClick={clearAll} className="text-primary font-bold hover:underline">
                            ดูคอร์สทั้งหมด
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}