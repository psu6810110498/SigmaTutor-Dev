"use client";

import { useState, useEffect } from "react";
import { Search, BookOpen, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { FaShoppingCart } from "react-icons/fa";
import { useCourse, ALL_COURSES } from "@/app/context/CourseContext";
import { fetchCategories, fetchLevels } from "@/app/lib/api"; // Import API functions
import type { Category, Level } from "@/app/lib/types"; // Import types

export default function ExplorePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 3;
    const { addToCart } = useCourse();

    // State for filters
    const [categories, setCategories] = useState<Category[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [loadingFilters, setLoadingFilters] = useState(true);

    // Fetch filters on mount
    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [cats, lvls] = await Promise.all([fetchCategories(), fetchLevels()]);
                // @ts-ignore - API response handling might need refinement but for now assuming direct data access or success check
                if (cats.success) setCategories(cats.data);
                // @ts-ignore
                if (lvls.success) setLevels(lvls.data);
            } catch (error) {
                console.error("Failed to load filters", error);
            } finally {
                setLoadingFilters(false);
            }
        };
        loadFilters();
    }, []);

    return (
        <>
            {/* Hero Section */}
            <header className="pt-12 pb-16 bg-[#0F172A] text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between">
                    <div className="max-w-2xl">
                        <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-medium mb-4 border border-white/20">
                            ปลดล็อกศักยภาพของคุณกับ SIGMA TUTOR
                        </span>
                        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                            ปลดล็อกศักยภาพ <br />
                            <span className="text-blue-400">ในตัวคุณ</span>
                        </h1>
                        <p className="text-gray-300 text-lg mb-8">
                            เรียนรู้กับติวเตอร์ชั้นนำและผู้เชี่ยวชาญในทุกวิชาด้วยโปรแกรมการเรียนรู้ที่ออกแบบมาเพื่อความสำเร็จของคุณ
                        </p>
                        <div className="flex gap-4">
                            <button className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30">
                                เริ่มเรียนเลยวันนี้ ↗
                            </button>
                            <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-all backdrop-blur-sm border border-white/10">
                                ดูวิดีโอแนะนำ
                            </button>
                        </div>
                    </div>
                    <div className="hidden md:flex w-80 h-64 bg-white/5 rounded-2xl border-2 border-dashed border-white/10 items-center justify-center mt-8 md:mt-0">
                        <p className="text-gray-400 text-sm">พื้นที่สำหรับรูปภาพ (Hero)</p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
                        {/* Mobile Search */}
                        <div className="lg:hidden">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="ค้นหาคอร์สเรียน..."
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
                            </div>
                        </div>

                        {/* Filter Section */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Filter className="text-primary" size={14} /> ตัวกรอง
                                </h3>
                                <button className="text-xs text-blue-600 hover:underline">ล้างตัวกรอง</button>
                            </div>

                            {loadingFilters ? (
                                // Skeletons
                                <div className="space-y-6 animate-pulse">
                                    <div>
                                        <div className="h-4 bg-gray-100 rounded w-20 mb-3" />
                                        <div className="space-y-2">
                                            <div className="h-3 bg-gray-100 rounded w-3/4" />
                                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                                            <div className="h-3 bg-gray-100 rounded w-2/3" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="h-4 bg-gray-100 rounded w-20 mb-3" />
                                        <div className="space-y-2">
                                            <div className="h-3 bg-gray-100 rounded w-full" />
                                            <div className="h-3 bg-gray-100 rounded w-2/3" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Actual Filters
                                <div className="space-y-6">
                                    {/* Categories */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 mb-3">ประเภทคอร์ส</h4>
                                        <div className="space-y-2">
                                            {categories.length > 0 ? (
                                                categories.map((category) => (
                                                    <label key={category.id} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-primary">
                                                        <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary/20" />
                                                        {category.name}
                                                    </label>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-400">ไม่มีข้อมูลหมวดหมู่</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Levels */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 mb-3">ระดับชั้น</h4>
                                        <div className="space-y-2">
                                            {levels.length > 0 ? (
                                                levels.map((level) => (
                                                    <label key={level.id} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-primary">
                                                        <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary/20" />
                                                        {level.name}
                                                    </label>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-400">ไม่มีข้อมูลระดับชั้น</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-grow">
                        {/* Top Bar */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">สำรวจคอร์สเรียน</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {searchQuery
                                        ? `กำลังค้นหา: "${searchQuery}"`
                                        : "รายการคอร์สเรียนทั้งหมดจะแสดงที่นี่"}
                                </p>
                            </div>
                            <div className="hidden md:block relative w-64">
                                <input
                                    type="text"
                                    placeholder="ค้นหาคอร์สเรียน..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Search className="absolute left-3 top-3 text-gray-400" size={14} />
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="w-full h-96 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 text-gray-300 shadow-sm">
                                {searchQuery ? <Search size={32} /> : <BookOpen size={32} />}
                            </div>
                            <h3 className="text-lg font-bold text-gray-500 mb-2">
                                {searchQuery ? "ไม่พบข้อมูล (Backend ยังไม่พร้อม)" : "พื้นที่สำหรับแสดงรายการคอร์ส"}
                            </h3>
                            <p className="text-gray-400 text-sm max-w-sm mb-6">
                                เมื่อระบบ Backend เชื่อมต่อกับฐานข้อมูลแล้ว รายการคอร์สเรียนจะปรากฏขึ้นที่นี่
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => addToCart(ALL_COURSES[0])}
                                    className="bg-white border border-primary text-primary hover:bg-primary hover:text-white font-bold py-2 px-6 rounded-full transition-all shadow-sm flex items-center gap-2 text-sm"
                                >
                                    <FaShoppingCart /> ทดลองเพิ่มตะกร้า
                                </button>

                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-gray-100">
                            <p className="text-sm text-gray-500">แสดง 0 จาก 0 รายการ</p>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                {[1, 2, 3].map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${currentPage === page
                                            ? "bg-primary text-white shadow-md shadow-blue-500/20"
                                            : "border border-gray-200 text-gray-600 hover:border-primary hover:text-primary bg-white"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}