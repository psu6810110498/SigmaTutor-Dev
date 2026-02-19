"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { categoryApi } from '@/app/lib/api';
import { Category } from '@/app/lib/types';
import { LayoutGrid, BookOpen, Code, Trophy, Music, Briefcase, Globe } from 'lucide-react';

export default function CategorySection() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await categoryApi.list();
                if (res.success && res.data) {
                    setCategories(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch categories", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // Helper to get random icon/color (Mocking visual variety since DB doesn't have icon yet)
    const getCategoryStyle = (index: number) => {
        const styles = [
            { icon: <BookOpen />, color: "bg-blue-50 text-blue-600 border-blue-100" },
            { icon: <Code />, color: "bg-green-50 text-green-600 border-green-100" },
            { icon: <Trophy />, color: "bg-yellow-50 text-yellow-600 border-yellow-100" },
            { icon: <Briefcase />, color: "bg-purple-50 text-purple-600 border-purple-100" },
            { icon: <Globe />, color: "bg-pink-50 text-pink-600 border-pink-100" },
            { icon: <Music />, color: "bg-orange-50 text-orange-600 border-orange-100" },
        ];
        return styles[index % styles.length];
    };

    if (loading) {
        return (
            <section className="py-12 bg-white container mx-auto px-4">
                <div className="h-8 w-48 bg-gray-100 rounded mb-8 animate-pulse"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            </section>
        );
    }

    if (categories.length === 0) return null;

    return (
        <section className="py-12 md:py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">เลือกเรียนตามหมวดหมู่</h2>
                        <p className="text-gray-500">ค้นหาคอร์สเรียนในวิชาที่คุณสนใจ</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {categories.filter(c => !c.parentId).map((cat, index) => {
                        const style = getCategoryStyle(index);
                        return (
                            <Link
                                key={cat.id}
                                href={`/explore?categoryId=${cat.id}`}
                                className={`
                                    flex flex-col items-center justify-center p-6 rounded-xl border transition-all duration-300
                                    hover:shadow-lg hover:-translate-y-1 group
                                    ${style.color} border-transparent hover:bg-white hover:border-gray-100
                                `}
                            >
                                <div className={`mb-3 p-3 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform`}>
                                    {style.icon}
                                </div>
                                <span className="font-semibold text-center">{cat.name}</span>
                                <span className="text-xs opacity-70 mt-1">{cat._count?.courses || 0} คอร์ส</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
