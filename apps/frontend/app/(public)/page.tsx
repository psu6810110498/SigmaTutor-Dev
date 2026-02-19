"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaShoppingCart, FaHeart, FaArrowRight, FaBook } from 'react-icons/fa';
import { useCourse, ALL_COURSES } from '../context/CourseContext';
import { courseApi, bannerApi } from '@/app/lib/api';
import { Banner, Course } from '@/app/lib/types';
import BannerStrip from "@/app/components/common/BannerStrip";
import CategorySection from "@/app/components/home/CategorySection";
import FeatureSection from "@/app/components/home/FeatureSection";

export default function HomePage() {
  const { addToCart } = useCourse();

  const [activeBanners, setActiveBanners] = useState<Banner[]>([]);
  const [popularCourses, setPopularCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bannerRes, courseRes] = await Promise.all([
          bannerApi.getActive('EXPLORE_TOP'), // Use EXPLORE_TOP as agreed (or creating HOME_TOP later if needed)
          courseApi.getMarketplace({ sort: 'popular', limit: 4 })
        ]);

        if (bannerRes.success && bannerRes.data) setActiveBanners(bannerRes.data);
        if (courseRes.success && courseRes.data) setPopularCourses(courseRes.data.courses);
      } catch (error) {
        console.error("Failed to fetch homepage data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const heroBanner = activeBanners.length > 0 ? activeBanners[0] : null;

  return (
    <div className="font-sans text-gray-900 bg-white flex flex-col min-h-screen">

      {/* 1. Full Width Banner Strip (1920x600) */}
      {activeBanners.length > 0 && (
        <div className="w-full pt-20">
          <BannerStrip banners={activeBanners} />
        </div>
      )}

      {/* 2. Fallback Hero Section (Branding Mode - Only if no banners) */}
      {activeBanners.length === 0 && (
        <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden relative flex-grow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left space-y-6">
                <h1
                  className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6"
                  style={{ lineHeight: '1.6' }}
                >
                  <span className="block mb-2">อัปเกรดคะแนนให้พุ่ง</span>
                  <span className="block">
                    ด้วย <span className="text-primary">เทคนิคระดับท็อป</span>
                  </span>
                </h1>
                <p className="text-lg text-gray-600 max-w-lg mx-auto lg:mx-0 font-serif leading-relaxed">
                  เรียนรู้และพัฒนาเพื่อเตรียมตัวสอบในโรงเรียน หรือสอบเข้ามหาวิทยาลัย
                  ด้วยเนื้อหาที่เข้มข้นและอาจารย์ผู้สอนมืออาชีพระดับประเทศ
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                  <Link href="/explore">
                    <button className="bg-primary hover:bg-primary-hover text-white text-lg font-bold px-8 py-3.5 rounded-xl shadow-xl shadow-primary/20 transition-all hover:-translate-y-1">
                      สำรวจคอร์สเรียน ↗
                    </button>
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -top-10 -right-10 w-72 h-72 bg-secondary-light rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-primary-light rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                <div className="relative h-[400px] lg:h-[500px] w-full bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden backdrop-blur-sm bg-white/50">
                  <div className="text-center p-8 opacity-40">
                    <p className="font-bold text-xl text-gray-400">พื้นที่สำหรับรูปภาพ</p>
                    <p className="text-sm text-gray-400 mt-2">Hero Image Placeholder</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Stats Section */}
      <section className="py-10 bg-white border-y border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100 text-center opacity-50">
            <div className="p-4">
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">{popularCourses.length}+</h3>
              <p className="text-gray-600 font-medium">คอร์สเรียน</p>
            </div>
            <div className="p-4">
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">500+</h3>
              <p className="text-gray-600 font-medium">ผู้เรียน</p>
            </div>
            <div className="p-4">
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">10+</h3>
              <p className="text-gray-600 font-medium">ผู้สอนมืออาชีพ</p>
            </div>
            <div className="p-4">
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">4.9</h3>
              <p className="text-gray-600 font-medium">ความพึงพอใจ</p>
            </div>
          </div>
        </div>
      </section>


      {/* 3.1 Category Section */}
      <CategorySection />

      {/* 4. Popular Courses Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">คอร์สยอดนิยม</h2>
              <p className="text-gray-500 font-serif">
                เลือกเรียนวิชาที่คุณต้องการ เพื่อพัฒนาศักยภาพของคุณวันนี้
              </p>
            </div>
            <Link
              href="/explore"
              className="hidden md:flex items-center text-primary font-bold hover:underline"
            >
              ดูคอร์สทั้งหมด <FaArrowRight className="ml-2 text-sm" />
            </Link>
          </div>

          {!loading && popularCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularCourses.map((course) => (
                <Link key={course.id} href={`/courses/${course.slug || course.id}`} className="group block">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gray-200 relative overflow-hidden">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">No Image</div>
                      )}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-gray-700 shadow-sm">
                        {course.category?.name || 'General'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                          {course.instructor?.profileImage && <img src={course.instructor.profileImage} alt="" />}
                        </div>
                        <span className="text-sm text-gray-500">{course.instructor?.name}</span>
                      </div>

                      <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                        <div className="flex items-center gap-1 text-yellow-400 text-sm font-bold">
                          ⭐ {course.rating?.toFixed(1) || 'N/A'}
                          <span className="text-gray-300 font-normal">({course.reviewCount || 0})</span>
                        </div>
                        <div className="text-right">
                          {course.promotionalPrice ? (
                            <>
                              <span className="text-xs text-gray-400 line-through block">฿{course.price.toLocaleString()}</span>
                              <span className="text-lg font-bold text-primary">฿{course.promotionalPrice.toLocaleString()}</span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-primary">฿{course.price.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <FaBook size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-500">
                {loading ? "กำลังโหลดข้อมูล..." : "ยังไม่มีข้อมูลคอร์สแนะนำ"}
              </h3>
            </div>
          )}
        </div>
      </section>

      {/* 5. Feature Section (Why Sigma Tutor) */}
      <FeatureSection />
    </div>
  );
}
