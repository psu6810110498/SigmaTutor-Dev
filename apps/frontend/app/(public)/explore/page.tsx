'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Banner, Category, Level } from '@/app/lib/types';
import { bannerApi, categoryApi, levelApi } from '@/app/lib/api';
import BannerStrip from '@/app/components/common/BannerStrip';
import QuickFilters from '@/app/components/marketplace/QuickFilters';
import AdvancedFilterBar from '@/app/components/marketplace/AdvancedFilterBar';
import TutorHighlight from '@/app/components/marketplace/TutorHighlight';
import CourseGridSection from '@/app/components/marketplace/CourseGridSection';
import { useMarketplaceFilters } from '@/app/hooks/useMarketplaceFilters';
import { useQuickFilter } from '@/app/hooks/useQuickFilter';
import { Filter, X } from 'lucide-react';

export default function ExplorePage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>}>
            <MarketplaceContent />
        </React.Suspense>
    );
}

function MarketplaceContent() {
    const {
        rootCategoryId, categoryId, levelId, courseType, tutorId,
        minPrice, maxPrice, search, searchInput,
        setRootCategory, setCategory, setLevel, setCourseType,
        setPriceRange, clearAll, setSearch, toggleTutor, updateParams
    } = useMarketplaceFilters();

    // 🌟 ยึดค่าจาก URL ตรงๆ เพียงอย่างเดียว เพื่อหยุดลูป Re-render
    const effectiveRootCategoryId = rootCategoryId;

    const [topBanners, setTopBanners] = useState<Banner[]>([]);
    const [middleBanners, setMiddleBanners] = useState<Banner[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);

    // ดึงข้อมูล Reference (ดึงครั้งเดียวตอนโหลดหน้า)
    useEffect(() => {
        let cancelled = false;
        const fetchReferenceData = async () => {
            try {
                const [topRes, middleRes, catRes, lvlRes] = await Promise.all([
                    bannerApi.getActive('EXPLORE_TOP'),
                    bannerApi.getActive('EXPLORE_MIDDLE'),
                    categoryApi.list(),
                    levelApi.list(),
                ]);
                if (cancelled) return;
                if (topRes.success && topRes.data) setTopBanners(topRes.data);
                if (middleRes.success && middleRes.data) setMiddleBanners(middleRes.data);
                if (catRes.success && catRes.data) setCategories(catRes.data);
                if (lvlRes.success && lvlRes.data) setLevels(lvlRes.data);
            } catch {
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchReferenceData();
        return () => { cancelled = true; };
    }, []);

    const {
        rootCategories,
        childCategories,
        activeFilterLabel,
        handleQuickFilterChange,
        isReady: quickFilterReady,
    } = useQuickFilter({
        categories,
        rootCategoryId: effectiveRootCategoryId,
        onQuickFilterChange: useCallback((id: string | null) => {
            // Clear categoryId, levelId, AND tutorId when switching root category.
            // Tutors are scoped to categories — a stale tutorId causes empty results
            // when the selected tutor has no courses in the new category.
            updateParams({ root: id, categoryId: null, levelId: null, tutorId: null });
        }, [updateParams])
    });

    const activeFilters = useMemo(() => {
        const chips: { key: string; label: string; onRemove: () => void }[] = [];
        if (categoryId) {
            const cat = categories.find(c => c.id === categoryId);
            if (cat) chips.push({ key: 'cat', label: cat.name, onRemove: () => setCategory(null) });
        }
        if (levelId) {
            const lvl = levels.find(l => l.id === levelId);
            if (lvl) chips.push({ key: 'level', label: lvl.name, onRemove: () => setLevel(null) });
        }
        if (courseType) {
            const labels: Record<string, string> = { ONLINE: 'Online', ONLINE_LIVE: 'Live สด', ONSITE: 'เรียนที่สถาบัน' };
            chips.push({ key: 'type', label: labels[courseType] ?? courseType, onRemove: () => setCourseType(null) });
        }
        return chips;
    }, [categoryId, levelId, courseType, categories, levels, setCategory, setLevel, setCourseType]);

    // ตรรกะการหาหมวดหมู่ที่จะแสดง (คงเดิมเพื่อรักษาความถูกต้องของหมวดหมู่)
    const sectionsToShow = useMemo(() => {
        if (categoryId) {
            const cat = categories.find(c => c.id === categoryId);
            return cat ? [cat] : [];
        }
        if (effectiveRootCategoryId && childCategories.length > 0) {
            return childCategories;
        }
        if (effectiveRootCategoryId) {
            const root = categories.find(c => c.id === effectiveRootCategoryId);
            if (root) {
                const otherRoots = rootCategories.filter(c => c.id !== effectiveRootCategoryId);
                return [root, ...otherRoots];
            }
        }
        return rootCategories;
    }, [categories, effectiveRootCategoryId, categoryId, childCategories, rootCategories]);

    const uniqueMiddleBanners = useMemo(() => {
        const topIds = new Set(topBanners.map(b => b.id));
        const topImages = new Set(topBanners.map(b => b.imageUrl));
        return middleBanners.filter(b => !topIds.has(b.id) && !topImages.has(b.imageUrl));
    }, [topBanners, middleBanners]);

    const tutorCategoryId = categoryId ?? effectiveRootCategoryId;

    const filteredLevels = useMemo(() => {
        if (!activeFilterLabel || activeFilterLabel === "ทั้งหมด") return levels;

        switch (activeFilterLabel) {
            case "ประถม":
                return levels.filter(l => l.name.startsWith("ป."));
            case "ม.ต้น":
                return levels.filter(l => ["ม.1", "ม.2", "ม.3"].includes(l.name));
            case "ม.ปลาย":
                return levels.filter(l => ["ม.4", "ม.5", "ม.6"].includes(l.name));
            case "TCAS":
                return levels.filter(l => l.name === "สอบเข้ามหาลัย");
            case "SAT":
            case "IELTS":
                return levels.filter(l => l.name === "ทั่วไป");
            default:
                return levels;
        }
    }, [levels, activeFilterLabel]);

    return (
        <div className="min-h-screen bg-white">
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

            <div className="md:sticky md:top-20 z-40 mt-6 relative w-full flex justify-center">
                <QuickFilters
                    activeFilter={activeFilterLabel}
                    onFilterChange={handleQuickFilterChange}
                    disabled={!quickFilterReady || loading}
                />
            </div>

            {/* ── Middle Promo Banner (วางระหว่าง QuickFilter และ Advanced Filter) ── */}
            {middleBanners.length > 0 && (
                <div className="max-w-5xl mx-auto px-4 mt-4">
                    <BannerStrip banners={middleBanners} variant="middle" />
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 mt-6 md:mt-8">
                <AdvancedFilterBar
                    subjectCategories={childCategories}
                    levels={filteredLevels}
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

            <div className="mt-8">
                <TutorHighlight
                    activeTutorId={tutorId || undefined}
                    onTutorClick={toggleTutor}
                    categoryId={tutorCategoryId || undefined}
                    levelId={levelId || undefined}
                    courseType={courseType || undefined}
                    minPrice={minPrice || undefined}
                    maxPrice={maxPrice || undefined}
                    search={search || undefined}
                />
            </div>

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

            <div className="pb-24">
                {loading ? (
                    <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-400">กำลังโหลดข้อมูล...</div>
                ) : sectionsToShow.length > 0 ? (
                    sectionsToShow.map((cat, index) => {
                        const isSelectedCategory = effectiveRootCategoryId === cat.id || categoryId === cat.id;
                        const isFirstSection = index === 0;
                        return (
                            <CourseGridSection
                                key={cat.id}
                                title={cat.name}
                                categoryId={cat.id}
                                levelId={levelId}
                                tutorId={tutorId}
                                courseType={courseType}
                                minPrice={minPrice && !isNaN(Number(minPrice)) ? Number(minPrice) : undefined}
                                maxPrice={maxPrice && !isNaN(Number(maxPrice)) ? Number(maxPrice) : undefined}
                                search={search}
                                initialLimit={isSelectedCategory ? 12 : (isFirstSection ? 8 : 4)}
                                className="border-b border-gray-50 last:border-0"
                            />
                        );
                    })
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