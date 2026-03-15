'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FaArrowRight,
  FaBook,
  FaChevronDown,
  FaStar,
  FaGraduationCap,
  FaQuoteLeft,
  FaPlay,
} from 'react-icons/fa';
import { courseApi, categoryApi, siteContentApi, bannerApi } from '@/app/lib/api';
import { Course, Category, Banner } from '@/app/lib/types';
import FeatureSection from '@/app/components/home/FeatureSection';
import { Separator } from '@/app/components/ui/separator';
import QuickFilters from '../components/marketplace/QuickFilters';
import CourseCard from '@/app/components/marketplace/CourseCard';

const FILTER_TABS = ['ทั้งหมด', 'ประถม', 'ม.ต้น', 'ม.ปลาย', 'TCAS', 'SAT', 'IELTS'];

interface StudentItem {
  faculty: string;
  major: string;
  color: string;
  image?: string | null;
}
interface StatItem {
  value: string;
  label: string;
}
interface UniversityItem {
  name: string;
  abbr: string;
  bg: string;
  text: string;
  image?: string | null;
}
interface TutorItem {
  name: string;
  subject: string;
  desc: string;
  initial: string;
  color: string;
  image?: string | null;
}
interface TestimonialData {
  quote: string;
  name: string;
  faculty: string;
  image?: string | null;
}
interface FaqItem {
  q: string;
  a: string;
}

// ─── Animated stat with intersection observer ─────────────
function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <h3 className="text-4xl md:text-5xl font-extrabold text-primary mb-2 tabular-nums">
        {value}
      </h3>
      <p className="text-gray-600 font-medium">{label}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────
export default function HomePage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">กำลังโหลด...</div>}>
      <HomeContent />
    </React.Suspense>
  );
}

function HomeContent() {
  const [popularCourses, setPopularCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ทั้งหมด');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [tutors, setTutors] = useState<TutorItem[]>([]);
  const [testimonial, setTestimonial] = useState<TestimonialData | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [heroBanner, setHeroBanner] = useState<Banner | null>(null);

  // Fetch site content + categories once
  useEffect(() => {
    Promise.all([
      categoryApi.list(),
      siteContentApi.getAll(),
      bannerApi.getActive('LANDING_HERO'),
    ]).then(([catRes, contentRes, bannerRes]) => {
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
      if (bannerRes.success && bannerRes.data && bannerRes.data.length > 0) {
        setHeroBanner(bannerRes.data[0]);
      }
    });
  }, []);

  // Re-fetch courses whenever activeTab changes
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const matchedCategory = categories.find((c) => c.name === activeTab);
        const params = {
          sort: 'popular' as const,
          limit: 5,
          excludeFull: true,
          ...(activeTab !== 'ทั้งหมด' && matchedCategory ? { categoryId: matchedCategory.id } : {}),
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
      {/* ═══════════ 1. HERO ═══════════ */}
      <section className="relative overflow-hidden bg-[#0f1744] min-h-140">
        {/* Animated gradient blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-125 h-125 rounded-full bg-blue-500/20 blur-[100px] animate-pulse" />
          <div className="absolute bottom-0 -left-20 w-100 h-100 rounded-full bg-indigo-600/25 blur-[80px] animate-pulse [animation-delay:1s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-75 rounded-full bg-primary/10 blur-[120px]" />
        </div>

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='%23fff' stroke-width='.5'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-xs font-medium text-blue-200 mb-6">
                <FaStar className="text-yellow-400" size={10} />
                แพลตฟอร์มติวเตอร์อันดับ 1 ของไทย
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.15] mb-6 tracking-tight">
                สอบติดคณะในฝัน
                <br />
                <span className="bg-linear-to-r from-yellow-300 via-orange-300 to-yellow-200 bg-clip-text text-transparent">
                  ไม่ใช่เรื่องบังเอิญ
                </span>
              </h1>

              <p className="text-blue-200/90 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
                เรียนรู้กับติวเตอร์มืออาชีพระดับประเทศ เจาะลึกทุกเทคนิค ไม่เน้นท่อง ไม่มีบ่น
                แต่สอบผ่านแน่นอน
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <Link href="/explore">
                  <button className="group bg-linear-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5 text-base flex items-center gap-2">
                    ค้นหาคอร์สที่ใช่
                    <FaArrowRight
                      size={12}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </button>
                </Link>
                <Link href="/explore">
                  <button className="border-2 border-white/30 hover:border-white/60 text-white font-bold px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:bg-white/5 text-base flex items-center gap-2">
                    <FaPlay size={10} />
                    ทดลองเรียนฟรี
                  </button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-blue-200/80">
                <span className="flex items-center gap-1.5">
                  <FaGraduationCap className="text-yellow-400" /> นักเรียน 10,000+
                </span>
                <span className="w-1 h-1 rounded-full bg-blue-400/40" />
                <span className="flex items-center gap-1.5">
                  <FaStar className="text-yellow-400" /> 4.9/5 คะแนนรีวิว
                </span>
                <span className="w-1 h-1 rounded-full bg-blue-400/40" />
                <span>40+ คอร์สเรียน</span>
              </div>
            </div>

            {/* Right: Visual element */}
            <div className="hidden lg:flex justify-center items-center">
              <div className="relative">
                {/* Main visual */}
                {heroBanner ? (
                  <div className="w-80 h-80 rounded-3xl overflow-hidden shadow-2xl shadow-blue-600/30 border-4 border-white/10">
                    <img
                      src={heroBanner.imageUrl}
                      alt={heroBanner.title || 'Sigma Tutor'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-64 h-64 rounded-full bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-600/30 border-4 border-white/10">
                    <span className="text-white text-8xl font-extrabold opacity-90">ส</span>
                  </div>
                )}
                {/* Floating card 1 */}
                <div className="absolute -top-4 -right-8 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 text-center animate-bounce [animation-duration:3s]">
                  <p className="text-3xl font-extrabold text-yellow-300">40+</p>
                  <p className="text-xs mt-1 text-blue-200">คอร์สคุณภาพ</p>
                </div>
                {/* Floating card 2 */}
                <div className="absolute -bottom-6 -left-10 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 text-center animate-bounce [animation-duration:4s] [animation-delay:.5s]">
                  <p className="text-3xl font-extrabold text-green-300">90%</p>
                  <p className="text-xs mt-1 text-blue-200">สอบติด</p>
                </div>
                {/* Glow ring */}
                {!heroBanner && (
                  <div className="absolute inset-0 rounded-full border-2 border-blue-400/20 animate-ping [animation-duration:3s]" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full h-auto">
            <path d="M0 60h1440V30c-240 30-480 30-720 0S240 0 0 30v30z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ═══════════ 2. POPULAR COURSES ═══════════ */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-primary font-semibold text-sm mb-1 tracking-wide uppercase">
                Popular Courses
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">คอร์สเรียนยอดฮิต</h2>
              <p className="text-gray-500 text-sm mt-1">คอร์สยกเครื่อง ครบจบที่เดียว</p>
            </div>
            <Link
              href="/explore"
              className="hidden md:flex items-center text-primary font-semibold hover:underline text-sm gap-1.5"
            >
              ดูทั้งหมด <FaArrowRight className="text-xs" />
            </Link>
          </div>

          <QuickFilters
            filters={FILTER_TABS}
            activeFilter={activeTab}
            onFilterChange={(tab) => setActiveTab(tab)}
            className="mb-8"
          />

          {!loading && popularCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {popularCourses.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} priority={i < 5} />
              ))}
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
                >
                  <div className="h-36 bg-gray-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-50 rounded w-1/2" />
                    <div className="h-5 bg-gray-100 rounded w-1/3 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
              <FaBook size={24} className="mx-auto mb-4 opacity-40" />
              <h3 className="text-base font-bold mb-1">ยังไม่มีคอร์สเรียน</h3>
              <p className="text-sm">ลองเลือกหมวดหมู่อื่น หรือกลับมาใหม่ภายหลัง</p>
            </div>
          )}

          <div className="mt-7 text-center md:hidden">
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm hover:underline"
            >
              ดูคอร์สเรียนทั้งหมด <FaArrowRight size={10} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ 3. STUDENT SUCCESS ═══════════ */}
      <section className="py-16 md:py-24 bg-linear-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-primary font-semibold text-sm mb-2 tracking-wide uppercase">
              Success Stories
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              รวมความสำเร็จลูกศิษย์
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              พาน้องๆ ไปถึงคณะในฝัน ด้วยแนวทางที่พิสูจน์แล้ว
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-14">
            {students.map((s, i) => (
              <div
                key={i}
                className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-white border border-gray-100 hover:-translate-y-1"
              >
                <div
                  className={`h-44 bg-linear-to-br ${s.color} flex items-center justify-center overflow-hidden relative`}
                >
                  {s.image ? (
                    <img
                      src={s.image}
                      alt={s.faculty}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center text-white text-2xl font-bold">
                      น
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                </div>
                <div className="p-4 text-center">
                  <span className="inline-block bg-linear-to-r from-yellow-400 to-amber-400 text-gray-900 text-[10px] font-extrabold px-3 py-1 rounded-full mb-2 shadow-sm">
                    🎉 CONGRATS!
                  </span>
                  <p className="font-bold text-sm text-gray-900 leading-snug">{s.faculty}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.major}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {stats.map((s, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <AnimatedStat value={s.value} label={s.label} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 4. UNIVERSITIES ═══════════ */}
      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-primary font-semibold text-sm mb-2 tracking-wide uppercase">
              Our Alumni
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              ศิษย์เก่าของเราสอบติดที่ไหนบ้าง?
            </h2>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {universities.map((u, i) => (
              <div
                key={i}
                className="group flex flex-col items-center gap-2.5 transition-transform hover:-translate-y-1"
              >
                <div
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center  overflow-hidden`}
                >
                  {u.image ? (
                    <img src={u.image} alt={u.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className={`${u.text} font-extrabold text-sm`}>{u.abbr}</span>
                  )}
                </div>
                <span className="text-xs text-gray-500 font-medium text-center max-w-20 leading-tight">
                  {u.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 5. TUTOR PROFILES ═══════════ */}
      <section className="py-16 md:py-24 bg-linear-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-primary font-semibold text-sm mb-2 tracking-wide uppercase">
              Expert Tutors
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              ติวเตอร์ตัวจริง จากสนามสอบจริง
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              อาจารย์ผู้สอนทุกคนผ่านประสบการณ์สนามสอบจริง มีผลคะแนนที่พิสูจน์ได้
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tutors.map((t, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative mb-5">
                  {t.image ? (
                    <img
                      src={t.image}
                      alt={t.name}
                      className="w-28 h-28 rounded-full object-cover shadow-lg ring-4 ring-white"
                    />
                  ) : (
                    <div
                      className={`w-28 h-28 rounded-full bg-linear-to-br ${t.color} flex items-center justify-center text-white text-3xl font-extrabold shadow-lg ring-4 ring-white`}
                    >
                      {t.initial}
                    </div>
                  )}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <span className="bg-linear-to-r from-orange-400 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm whitespace-nowrap">
                      {t.subject}
                    </span>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mt-2 mb-2">{t.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5 line-clamp-3">{t.desc}</p>
                <Link
                  href="/explore"
                  className="mt-auto inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline group-hover:gap-2.5 transition-all"
                >
                  ดูคอร์สเรียนทั้งหมด
                  <FaArrowRight
                    size={10}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 6. TESTIMONIAL ═══════════ */}
      {testimonial && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-primary font-semibold text-sm mb-2 tracking-wide uppercase">
                Testimonial
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                เสียงยืนยันจากคนที่ทำสำเร็จแล้ว
              </h2>
            </div>
            <div className="relative bg-linear-to-br from-primary/5 via-blue-50/50 to-indigo-50/30 border border-primary/10 rounded-3xl p-8 md:p-12">
              <FaQuoteLeft size={40} className="absolute top-6 left-6 text-primary/10" />
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
                <div className="shrink-0">
                  {testimonial.image ? (
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-white"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-linear-to-br from-primary to-blue-400 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-white">
                      {testimonial.name?.charAt(0) || 'น'}
                    </div>
                  )}
                </div>
                <div className="text-center md:text-left">
                  <p className="text-gray-800 text-lg md:text-xl leading-relaxed mb-6 italic font-medium">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{testimonial.name}</p>
                    <p className="text-primary text-sm font-medium">{testimonial.faculty}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ 7. FEATURES ═══════════ */}
      <FeatureSection />

      {/* Divider */}
      <div className="py-2 px-4 sm:px-6 lg:px-8">
        <Separator className="max-w-7xl mx-auto bg-primary/20" />
      </div>

      {/* ═══════════ 8. FAQ ═══════════ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-primary font-semibold text-sm mb-2 tracking-wide uppercase">FAQ</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">คำถามที่พบบ่อย</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-2xl overflow-hidden bg-white hover:border-gray-300 transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center px-6 py-5 text-left font-semibold text-gray-900 hover:bg-gray-50/50 transition-colors"
                >
                  <span className="pr-4">{faq.q}</span>
                  <FaChevronDown
                    className={`shrink-0 text-primary transition-transform duration-300 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                    size={13}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 9. CTA BANNER ═══════════ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* Background */}
        <div className="absolute inset-0 bg-[#0f1744]">
          <div className="absolute inset-0 bg-linear-to-r from-primary/80 via-blue-600/60 to-indigo-900/80" />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-orange-400/10 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-blue-400/15 blur-[80px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-medium text-blue-200 mb-6 backdrop-blur-sm border border-white/10">
            ⏰ อย่ารอจนสายเกินไป
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
            เริ่มเตรียมตัววันนี้
            <br />
            เพื่ออนาคต
            <span className="bg-linear-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              ที่เลือกได้
            </span>
          </h2>
          <p className="text-blue-200/90 mb-10 text-base md:text-lg max-w-lg mx-auto">
            เวลาไม่คอยใคร แต่ระหว่างนี้ เราพร้อมพาทุกคนไปถึงฝัน
          </p>
          <Link href="/register">
            <button className="group bg-linear-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white text-lg font-extrabold px-12 py-4 rounded-xl shadow-xl shadow-orange-500/20 transition-all hover:-translate-y-1 inline-flex items-center gap-2">
              สมัครเรียนเลย
              <FaArrowRight className="transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
