'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowRight, FaBook, FaChevronDown } from 'react-icons/fa';
import { courseApi, categoryApi, siteContentApi, uploadApi } from '@/app/lib/api';
import { Course, Category } from '@/app/lib/types';
import FeatureSection from '@/app/components/home/FeatureSection';
import QuickFilters from '../components/marketplace/QuickFilters';
import CourseCard from '@/app/components/marketplace/CourseCard';

const FILTER_TABS = ['ทั้งหมด', 'ประถม', 'ม.ต้น', 'ม.ปลาย', 'TCAS', 'SAT', 'IELTS'];

interface StudentItem { faculty: string; major: string; color: string; image?: string | null }
interface StatItem { value: string; label: string }
interface UniversityItem { name: string; abbr: string; bg: string; text: string }
interface TutorItem { name: string; subject: string; desc: string; initial: string; color: string; image?: string | null }
interface TestimonialData { quote: string; name: string; faculty: string; image?: string | null }
interface FaqItem { q: string; a: string }

export default function HomePage() {
  const [popularCourses, setPopularCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ทั้งหมด');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Site content sections
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [tutors, setTutors] = useState<TutorItem[]>([]);
  const [testimonial, setTestimonial] = useState<TestimonialData | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  // Fetch site content + categories once
  useEffect(() => {
    Promise.all([
      categoryApi.list(),
      siteContentApi.getAll(),
    ]).then(([catRes, contentRes]) => {
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (contentRes.success && contentRes.data) {
        const c = contentRes.data as Record<string, any>;
        if (c.students) setStudents(c.students);
        if (c.stats) setStats(c.stats);
        if (c.universities) setUniversities(c.universities);
        if (c.tutors) setTutors(c.tutors);
        if (c.testimonial) setTestimonial(c.testimonial);
        if (c.faqs) setFaqs(c.faqs);
      }
    });
  }, []);

  // Fetch categories once for name → id mapping
  useEffect(() => {
    categoryApi.list().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  // Re-fetch courses whenever activeTab changes
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const matchedCategory = categories.find(
          (c) => c.name === activeTab
        );
        const params = {
          sort: 'popular' as const,
          limit: 5,
          ...(activeTab !== 'ทั้งหมด' && matchedCategory
            ? { categoryId: matchedCategory.id }
            : {}),
        };
        const courseRes = await courseApi.getMarketplace(params);
        if (courseRes.success && courseRes.data) setPopularCourses(courseRes.data.courses);
      } catch (error) {
        console.error('Failed to fetch homepage data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [activeTab, categories]);

  return (
    <div className="font-sans text-gray-900 bg-white flex flex-col min-h-screen">
      {/* ─── 1. HERO ─────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a1f6e 0%, #2563eb 60%, #3b82f6 100%)',
          minHeight: '520px',
        }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/30 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="text-white">
              <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-5">
                สอบติดคณะในฝัน...
                <br />
                <span className="text-yellow-300">ไม่ใช่เรื่องบังเอิญ</span>
              </h1>
              <p className="text-blue-100 text-base md:text-lg leading-relaxed mb-8 max-w-md">
                เรียนรู้และพัฒนาเพื่อเตรียมตัวสอบในโรงเรียน หรือสอบเข้ามหาวิทยาลัย
                ด้วยติวเตอร์มืออาชีพระดับประเทศ ไม่เน้นท่อง ไม่มีบ่น แต่สอบผ่านแน่
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/explore">
                  <button className="bg-orange-400 hover:bg-orange-300 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 text-base">
                    ค้นหาคอร์สที่ใช้
                  </button>
                </Link>
                <Link href="/explore">
                  <button className="border-2 border-white/70 hover:border-white text-white font-bold px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:bg-white/10 text-base">
                    ทดลองเรียนฟรี
                  </button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-center items-center gap-8">
              <div className="relative">
                <div className="w-52 h-52 rounded-full bg-linear-to-br from-blue-300 to-indigo-500 flex items-center justify-center shadow-2xl border-4 border-white/20 text-white text-7xl font-extrabold">
                  ส
                </div>
                <div className="absolute -bottom-3 -right-2 bg-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                  ติวโดย
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-5 text-center">
                <p className="text-3xl font-extrabold text-yellow-300">40+</p>
                <p className="text-sm mt-1 text-blue-100">คอร์สเรียนคุณภาพ</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. POPULAR COURSES ──────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-5">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">คอร์สเรียนยอดฮิต</h2>
              <p className="text-gray-500 text-sm mt-1">กี่โพวท์ ยกเครื่อง จบต้องจบ</p>
            </div>
            <Link
              href="/explore"
              className="hidden md:flex items-center text-primary font-semibold hover:underline text-sm"
            >
              ดูคอร์สเรียนทั้งหมด <FaArrowRight className="ml-1.5 text-xs" />
            </Link>
          </div>

          <QuickFilters
            filters={FILTER_TABS}
            activeFilter={activeTab}
            onFilterChange={(tab) => setActiveTab(tab)}
            className="mb-7"
          />

          {!loading && popularCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {popularCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
              <FaBook size={24} className="mx-auto mb-4 opacity-40" />
              <h3 className="text-base font-bold">กำลังโหลดข้อมูลคอร์ส...</h3>
            </div>
          )}
          <div className="mt-7 text-center md:hidden">
            <Link href="/explore" className="text-primary font-semibold text-sm hover:underline">
              ดูคอร์สเรียนทั้งหมด →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 4. STUDENT SUCCESS ──────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              รวมความสำเร็จลูกศิษย์
            </h2>
            <p className="text-gray-500">ได้พาน้องๆ ไปถึงคณะในฝัน</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {students.map((s, i) => (
              <div key={i} className="rounded-2xl overflow-hidden shadow-md bg-white">
                <div className={`h-44 bg-linear-to-br ${s.color} flex items-center justify-center overflow-hidden`}>
                  {s.image ? (
                    <img src={s.image} alt={s.faculty} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center text-white text-2xl font-bold">น</div>
                  )}
                </div>
                <div className="p-4 text-center">
                  <span className="inline-block bg-yellow-400 text-gray-900 text-[11px] font-extrabold px-3 py-1 rounded-full mb-2">CONGRATS!!</span>
                  <p className="font-bold text-sm text-gray-900">{s.faculty}</p>
                  <p className="text-xs text-gray-500">{s.major}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {stats.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-4xl font-extrabold text-primary mb-2">{s.value}</h3>
                <p className="text-gray-600 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. UNIVERSITY LOGOS ─────────────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
            ศิษย์เก่าของเราสอบติดที่ไหนบ้าง?
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14">
            {universities.map((u, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className={`w-16 h-16 rounded-full ${u.bg} flex items-center justify-center shadow-sm`}>
                  <span className={`${u.text} font-extrabold text-sm`}>{u.abbr}</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">{u.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. TUTOR PROFILES ───────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              ติวเตอร์ตัวจริง... จากสนามสอบจริง
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              อาจารย์ผู้สอนทุกคนผ่านประสบการณ์สนามสอบจริง มีผลคะแนนที่พิสูจน์ได้
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tutors.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
                {t.image ? (
                  <img src={t.image} alt={t.name} className="w-24 h-24 rounded-full object-cover mb-4 shadow-lg" />
                ) : (
                  <div className={`w-24 h-24 rounded-full bg-linear-to-br ${t.color} flex items-center justify-center text-white text-3xl font-extrabold mb-4 shadow-lg`}>
                    {t.initial}
                  </div>
                )}
                <span className="bg-orange-400 text-white text-xs font-bold px-4 py-1 rounded-full mb-3">{t.subject}</span>
                <h3 className="font-bold text-gray-900 mb-2">{t.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">{t.desc}</p>
                <Link href="/explore" className="text-primary text-sm font-semibold hover:underline">
                  ดูคอร์สเรียน &amp; หลักสูตรทั้งหมด →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. TESTIMONIAL ──────────────────────────────────────────── */}
      {testimonial && (
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
              เสียงยืนยันจากกรุ๊ปที่... ที่ทำสำเร็จแล้ว
            </h2>
            <div className="bg-primary/5 border-2 border-primary/20 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row gap-6 items-start">
              <div className="shrink-0">
                {testimonial.image ? (
                  <img src={testimonial.image} alt={testimonial.name} className="w-20 h-20 rounded-full object-cover shadow-lg" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-linear-to-br from-primary to-blue-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {testimonial.name?.charAt(0) || 'น'}
                  </div>
                )}
              </div>
              <div>
                <p className="text-gray-800 text-lg leading-relaxed mb-5 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <p className="font-bold text-gray-900">{testimonial.name}</p>
                <p className="text-primary text-sm font-medium">{testimonial.faculty}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── 8. FEATURE ──────────────────────────────────────────────── */}
      <FeatureSection />

      {/* ─── 9. FAQ ──────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
            คำถามที่พบบ่อย (FAQ)
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <FaChevronDown
                    className={`ml-4 shrink-0 text-primary transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    size={13}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 pt-3 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 10. CTA BANNER ──────────────────────────────────────────── */}
      <section
        className="py-16 md:py-24"
        style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 40%, #2563eb 100%)' }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-snug">
            อย่าให้ถึงวันสอบ...
            <br />
            เริ่ม<span className="text-yellow-300">เตรียมตัววันนี้</span> เพื่ออนาคต
            <span className="text-yellow-300">ที่เลือกได้</span>
          </h2>
          <p className="text-orange-100 mb-8 text-base md:text-lg">
            เวลาไม่คอยใคร แต่ระหว่างนี้ เราอยู่ที่นี่ พร้อมพาทุกคนไปถึงฝัน
          </p>
          <Link href="/register">
            <button className="bg-white hover:bg-yellow-50 text-primary text-lg font-extrabold px-10 py-4 rounded-xl shadow-xl transition-all hover:-translate-y-1">
              สมัครเรียนเลยตอนนี้
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
