'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowRight, FaBook, FaStar, FaChevronDown } from 'react-icons/fa';
import { courseApi } from '@/app/lib/api';
import { Course } from '@/app/lib/types';
import FeatureSection from '@/app/components/home/FeatureSection';
import QuickFilters from '../components/marketplace/QuickFilters';

const FILTER_TABS = ['ทั้งหมด', 'ประถม', 'ม.ต้น', 'ม.ปลาย', 'TCAS', 'SAT', 'IELTS'];

const TUTORS = [
  {
    name: 'พี่บอส (สรวิธ วิฒนรงค์)',
    subject: 'วิชา: คอมพิวเตอร์',
    desc: 'ประสบการณ์สอนมากกว่า 20 ปี เชี่ยวชาญการเตรียมสอบคอมพิวเตอร์โอลิมปิกและสอบเข้ามหาวิทยาลัย',
    initial: 'บ',
    color: 'from-blue-500 to-primary',
  },
  {
    name: 'พี่พีช (พารีย์ ยาเก)',
    subject: 'วิชา: คอมพิวเตอร์',
    desc: 'ประสบการณ์สอนมากกว่า 20 ปี เชี่ยวชาญการเตรียมสอบคอมพิวเตอร์ระดับชาติและนานาชาติ',
    initial: 'พ',
    color: 'from-purple-500 to-blue-600',
  },
  {
    name: 'พี่บอส (สรวิธ วิฒนรงค์)',
    subject: 'วิชา: คอมพิวเตอร์',
    desc: 'ประสบการณ์สอนมากกว่า 20 ปี เชี่ยวชาญการเตรียมสอบคอมพิวเตอร์ระดับชาติและนานาชาติ',
    initial: 'บ',
    color: 'from-blue-500 to-primary',
  },
];

const FAQS = [
  {
    q: 'เรียนผ่าน iPad หรือมือถือได้ไหม?',
    a: 'ได้เลย! ระบบรองรับทุกอุปกรณ์ ทั้ง iPad, มือถือ, แท็บเล็ต และคอมพิวเตอร์ ไม่ต้องติดตั้งแอปเพิ่มเติม',
  },
  {
    q: 'สมัครเรียนได้เลยไหม?',
    a: 'สมัครได้เลยทันที หลังสมัครสามารถเข้าเรียนได้ภายใน 24 ชั่วโมง ไม่มีค่าสมัครเพิ่มเติม',
  },
  {
    q: 'มีคอร์สเรียนสดด้วย เรียนที่ไหนบ้างได้บ้าง?',
    a: 'มีทั้งคอร์สออนไลน์และ Live สด สามารถเรียนได้จากทุกที่ผ่านระบบออนไลน์ของเรา',
  },
];

export default function HomePage() {
  const [popularCourses, setPopularCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ทั้งหมด');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes = await courseApi.getMarketplace({ sort: 'popular', limit: 5 });
        if (courseRes.success && courseRes.data) setPopularCourses(courseRes.data.courses);
      } catch (error) {
        console.error('Failed to fetch homepage data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

          {/* filter tabs */}
          <QuickFilters
            filters={FILTER_TABS}
            activeFilter={activeTab}
            onFilterChange={(tab) => setActiveTab(tab)}
            className="mb-7"
          />

          {!loading && popularCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {popularCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/course/${course.slug || course.id}`}
                  className="group block"
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
                          <FaBook size={28} className="text-blue-200" />
                        </div>
                      )}
                      <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        Best Seller
                      </span>
                    </div>
                    <div className="p-4 flex flex-col grow">
                      <h3 className="font-bold text-sm text-gray-900 mb-1.5 line-clamp-2 group-hover:text-primary leading-snug">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs mb-1">
                        <span className="text-yellow-500 font-bold">
                          {course.rating?.toFixed(1) || '4.8'}
                        </span>
                        <FaStar size={10} className="text-yellow-400" />
                        <span className="text-gray-400">({course.reviewCount || 220} รีวิว)</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">1,500+ ผู้เรียน</p>
                      <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
                        <div>
                          <span className="text-primary font-extrabold text-sm">
                            ฿{course.price.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[11px] bg-primary/10 hover:bg-primary hover:text-white text-primary font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer">
                          ดูรายละเอียด
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
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
            <p className="text-gray-500">กี่โพวท์ ได้พาน้องๆ ไปถึงคณะในฝัน</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              {
                faculty: 'วิศวกรรมศาสตร์',
                major: 'สาขาคอมพิวเตอร์',
                color: 'from-blue-400 to-indigo-600',
              },
              {
                faculty: 'วิศวกรรมศาสตร์',
                major: 'สาขาคอมพิวเตอร์',
                color: 'from-purple-400 to-blue-600',
              },
              {
                faculty: 'วิศวกรรมศาสตร์',
                major: 'สาขาคอมพิวเตอร์',
                color: 'from-cyan-400 to-blue-500',
              },
              {
                faculty: 'วิศวกรรมศาสตร์',
                major: 'สาขาคอมพิวเตอร์',
                color: 'from-indigo-400 to-purple-600',
              },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl overflow-hidden shadow-md bg-white">
                <div className={`h-44 bg-linear-to-br ${s.color} flex items-center justify-center`}>
                  <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center text-white text-2xl font-bold">
                    น
                  </div>
                </div>
                <div className="p-4 text-center">
                  <span className="inline-block bg-yellow-400 text-gray-900 text-[11px] font-extrabold px-3 py-1 rounded-full mb-2">
                    CONGRATS!!
                  </span>
                  <p className="font-bold text-sm text-gray-900">{s.faculty}</p>
                  <p className="text-xs text-gray-500">{s.major}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { value: '10,000+', label: 'นักเรียนที่ไว้วางใจ' },
              { value: '40+', label: 'คอร์สเรียนคุณภาพ' },
              { value: '98%', label: 'สอบคณะที่หวัง' },
            ].map((s, i) => (
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
            {[
              { name: 'จุฬาฯ', bg: 'bg-pink-100', text: 'text-pink-600', abbr: 'จฬ' },
              { name: 'มหิดล', bg: 'bg-blue-100', text: 'text-blue-600', abbr: 'มห' },
              { name: 'ธรรมศาสตร์', bg: 'bg-red-100', text: 'text-red-600', abbr: 'ธศ' },
              { name: 'เกษตรฯ', bg: 'bg-green-100', text: 'text-green-600', abbr: 'กษ' },
              { name: 'ลาดกระบัง', bg: 'bg-orange-100', text: 'text-orange-600', abbr: 'ลก' },
              { name: 'มจธ.', bg: 'bg-purple-100', text: 'text-purple-600', abbr: 'มจ' },
            ].map((u, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className={`w-16 h-16 rounded-full ${u.bg} flex items-center justify-center shadow-sm`}
                >
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
            {TUTORS.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
              >
                <div
                  className={`w-24 h-24 rounded-full bg-linear-to-br ${t.color} flex items-center justify-center text-white text-3xl font-extrabold mb-4 shadow-lg`}
                >
                  {t.initial}
                </div>
                <span className="bg-orange-400 text-white text-xs font-bold px-4 py-1 rounded-full mb-3">
                  {t.subject}
                </span>
                <h3 className="font-bold text-gray-900 mb-2">{t.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-5">{t.desc}</p>
                <Link
                  href="/explore"
                  className="text-primary text-sm font-semibold hover:underline"
                >
                  ดูคอร์สเรียน &amp; หลักสูตรทั้งหมด →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. TESTIMONIAL ──────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
            เสียงยืนยันจากกรุ๊ปที่... ที่ทำสำเร็จแล้ว
          </h2>
          <div className="bg-primary/5 border-2 border-primary/20 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row gap-6 items-start">
            <div className="shrink-0">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-primary to-blue-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                น
              </div>
            </div>
            <div>
              <p className="text-gray-800 text-lg leading-relaxed mb-5 italic">
                &ldquo;จากที่เกลียดฟิสิกส์ กลายเป็นวิชาทำคะแนน! เทคนิคของพี่บอส
                ช่วยให้มองงานยากกว่าออก ไม่ต้องท่องสูตร สอบติด วิศวกรรมคอมพิวเตอร์ ม.ดัง มาแล้ว
                ขอบคุณมากๆ&rdquo;
              </p>
              <p className="font-bold text-gray-900">น้องพลอย</p>
              <p className="text-primary text-sm font-medium">วิศวกรรมศาสตร์ สาขาคอมพิวเตอร์</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. FEATURE ──────────────────────────────────────────────── */}
      <FeatureSection />

      {/* ─── 9. FAQ ──────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
            คำถามที่พบบ่อย (FAQ)
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
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
