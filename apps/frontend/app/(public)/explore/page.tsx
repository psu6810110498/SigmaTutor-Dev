'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Banner, Category, Level } from '@/app/lib/types';
import { bannerApi, categoryApi, levelApi, courseApi } from '@/app/lib/api';
import BannerStrip from '@/app/components/common/BannerStrip';
import QuickFilters from '@/app/components/marketplace/QuickFilters';
import AdvancedFilterBar from '@/app/components/marketplace/AdvancedFilterBar';
import TutorHighlight from '@/app/components/marketplace/TutorHighlight';
import CourseGridSection from '@/app/components/marketplace/CourseGridSection';
import { useMarketplaceFilters } from '@/app/hooks/useMarketplaceFilters';
import { useQuickFilter } from '@/app/hooks/useQuickFilter';
import { Filter, X } from 'lucide-react';

// ✅ เปลี่ยนชื่อเป็น ExplorePage ให้ตรงกับกิ่ง main และตำแหน่งไฟล์
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
        setPriceRange, clearAll, setSearch, toggleTutor
    } = useMarketplaceFilters();

    // State
    const [topBanners, setTopBanners] = useState<Banner[]>([]);
    const [middleBanners, setMiddleBanners] = useState<Banner[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [tutors, setTutors] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch reference data once (memoized)
    useEffect(() => {
        let cancelled = false;
        
        const fetchData = async () => {
            try {
                const [topRes, middleRes, catRes, lvlRes, coursesRes] = await Promise.all([
                    bannerApi.getActive('EXPLORE_TOP'),
                    bannerApi.getActive('EXPLORE_MIDDLE'),
                    categoryApi.list(),
                    levelApi.list(),
                    courseApi.getMarketplace({ limit: 100 }), // Fetch courses to extract tutors
                ]);
                
                if (cancelled) return;
                
                if (topRes.success && topRes.data) setTopBanners(topRes.data);
                if (middleRes.success && middleRes.data) setMiddleBanners(middleRes.data);
                if (catRes.success && catRes.data) setCategories(catRes.data);
                if (lvlRes.success && lvlRes.data) setLevels(lvlRes.data);
                
                // Extract unique tutors from courses
                if (coursesRes.success && coursesRes.data) {
                    const uniqueTutors = new Map<string, { id: string; name: string }>();
                    coursesRes.data.courses.forEach((c: any) => {
                        if (c.instructor && !uniqueTutors.has(c.instructor.id)) {
                            uniqueTutors.set(c.instructor.id, {
                                id: c.instructor.id,
                                name: c.instructor.name
                            });
                        }
                    });
                    setTutors(Array.from(uniqueTutors.values()));
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to fetch data", error);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        
        fetchData();
        
        return () => {
            cancelled = true;
        };
    }, []);

    // ── QuickFilter Hook (Clean & Fast) ─────────────────────────
    const {
        rootCategories,
        childCategories,
        activeFilterLabel,
        handleQuickFilterChange,
    } = useQuickFilter({
        categories,
        rootCategoryId,
        onRootCategoryChange: setRootCategory,
        onCategoryChange: setCategory,
        onLevelChange: setLevel,
    });

    // Find the selected root category object (for display)
    const selectedRoot = useMemo(
        () => rootCategories.find(c => c.id === rootCategoryId),
        [rootCategories, rootCategoryId]
    );

    // Find the selected level object (for display)
    const selectedLevel = useMemo(
        () => levels.find(l => l.id === levelId),
        [levels, levelId]
    );

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
    if (tutorId) {
        const tutor = tutors.find(t => t.id === tutorId);
        if (tutor) {
            activeFilters.push({ key: 'tutor', label: tutor.name, onRemove: () => toggleTutor(tutorId) });
        }
    }

    // Determine what sections to show with priority sorting
    const sectionsToShow = useMemo(() => {
        // Specific child selected → single section (highest priority)
        if (categoryId) {
            const cat = categories.find(c => c.id === categoryId);
            return cat ? [cat] : [];
        }
        
        // Root selected → show its children first, then other categories
        if (rootCategoryId && childCategories.length > 0) {
            // Selected root's children come first
            return childCategories;
        }
        
        // Root with no children → show root itself
        if (rootCategoryId) {
            const root = categories.find(c => c.id === rootCategoryId);
            if (root) {
                // Show selected root first, then other root categories
                const otherRoots = rootCategories.filter(c => c.id !== rootCategoryId);
                return [root, ...otherRoots];
            }
        }
        
        // "ทั้งหมด" → show all root categories (no specific order needed)
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

            {/* 2. Quick Filters — separated from banner */}
            {/* Mobile: Not sticky (scrolls with page), Desktop: Sticky (follows when scrolling) */}
            <div className="md:sticky md:top-20 z-40 mt-6 relative w-full flex justify-center">
                <QuickFilters
                    activeFilter={activeFilterLabel}
                    onFilterChange={handleQuickFilterChange}
                />
            </div>



            {/* 3. Advanced Filter Bar */}
            <div className="max-w-7xl mx-auto px-4 mt-6 md:mt-8">
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

            {/* 4. Tutor Highlight */}
            <div className="mt-8">
                <TutorHighlight
                    activeTutorId={tutorId}
                    onTutorClick={toggleTutor}
                />
            </div>

            {/* 5. Active Filter Chips */}
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
                    sectionsToShow.map((cat, index) => {
                        // Priority: selected category shows more courses and appears first
                        const isSelectedCategory = rootCategoryId === cat.id || categoryId === cat.id;
                        const isFirstSection = index === 0;
                        
                        return (
                            <CourseGridSection
                                key={cat.id}
                                title={cat.name}
                                categoryId={cat.id}
                                levelId={levelId}
                                tutorId={tutorId}
                                courseType={courseType}
                                minPrice={minPrice ? Number(minPrice) : null}
                                maxPrice={maxPrice ? Number(maxPrice) : null}
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