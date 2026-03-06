'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowRight, FaBook, FaShoppingCart, FaHeart } from 'react-icons/fa';
import { useCourse } from '../context/CourseContext';
import { courseApi } from '@/app/lib/api';
import { Course } from '@/app/lib/types';
import CategorySection from '@/app/components/home/CategorySection';
import FeatureSection from '@/app/components/home/FeatureSection';

export default function HomePage() {
  // ✅ รวมความสามารถ: ใช้ทั้ง addToCart และ cartItems
  const { addToCart, cartItems } = useCourse();

  const [popularCourses, setPopularCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseRes = await courseApi.getMarketplace({ sort: 'popular', limit: 4 });
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
      {/* 1. Hero Section */}
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
              <p className="text-lg text-gray-600 max-w-lg mx-auto lg:mx-0 leading-relaxed">
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
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-100/30 rounded-full blur-3xl opacity-30 animate-blob"></div>
              <div className="relative h-[400px] lg:h-[500px] w-full bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                <div className="text-center p-8 opacity-40">
                  <p className="font-bold text-xl text-gray-400">พื้นที่สำหรับรูปภาพ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Stats Section (เก็บไว้จากกิ่ง main) */}
      <section className="py-10 bg-white border-y border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100 text-center opacity-50">
            <div className="p-4">
              <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {popularCourses.length || 0}+
              </h3>
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

      {/* 4. Category Section */}
      <CategorySection />

      {/* 5. Popular Courses Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">คอร์สยอดนิยม</h2>
              <p className="text-gray-500">
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
                <Link
                  key={course.id}
                  href={`/course/${course.slug || course.id}`}
                  className="group block"
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
                    <div className="aspect-video bg-gray-200 relative overflow-hidden">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-primary">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm text-gray-500">{course.instructor?.name}</span>
                      </div>
                      <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                        <div className="text-yellow-400 text-sm font-bold">
                          ⭐ {course.rating?.toFixed(1) || '5.0'}
                        </div>
                        <div className="text-lg font-bold text-primary">
                          ฿{course.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
              <FaBook size={24} className="mx-auto mb-4" />
              <h3 className="text-lg font-bold">กำลังโหลดข้อมูลคอร์ส...</h3>
            </div>
          )}
        </div>
      </section>

      {/* 6. Student Success Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">รวมความสำเร็จลูกศิษย์</h2>
            <p className="text-gray-500">กี่โพวท์ ได้พาน้องๆ ไปถึงคณะในฝัน</p>
          </div>
          {/* Student cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
            {[
              { faculty: 'วิศวกรรมศาสตร์', major: 'สาขาคอมพิวเตอร์' },
              { faculty: 'วิศวกรรมศาสตร์', major: 'สาขาคอมพิวเตอร์' },
              { faculty: 'วิศวกรรมศาสตร์', major: 'สาขาคอมพิวเตอร์' },
              { faculty: 'วิศวกรรมศาสตร์', major: 'สาขาคอมพิวเตอร์' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl overflow-hidden shadow-md bg-white">
                <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">S</div>
                </div>
                <div className="p-4 text-center">
                  <span className="inline-block bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full mb-2">CONGRATS!!</span>
                  <p className="font-bold text-sm text-gray-900">{s.faculty}</p>
                  <p className="text-xs text-gray-500">{s.major}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-4xl font-extrabold text-primary mb-2">10,000+</h3>
              <p className="text-gray-600 font-medium">นักเรียนที่ไว้วางใจ</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-4xl font-extrabold text-primary mb-2">40+</h3>
              <p className="text-gray-600 font-medium">คอร์สเรียนคุณภาพ</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-4xl font-extrabold text-primary mb-2">98%</h3>
              <p className="text-gray-600 font-medium">สอบคณะที่หวัง</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. University Logos Section */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
            ศิษย์เก่าของเราสอบติดที่ไหนบ้าง?
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {[
              { name: 'จุฬา', color: 'from-pink-400 to-pink-600' },
              { name: 'มหิดล', color: 'from-blue-400 to-blue-600' },
              { name: 'ธรรมศาสตร์', color: 'from-yellow-400 to-yellow-600' },
              { name: 'เกษตร', color: 'from-green-400 to-green-600' },
              { name: 'ลาดกระบัง', color: 'from-purple-400 to-purple-600' },
              { name: 'KMUTT', color: 'from-orange-400 to-orange-600' },
            ].map((u, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${u.color} flex items-center justify-center shadow-md`}>
                  <span className="text-white font-bold text-xs text-center leading-tight px-1">{u.name.slice(0,2)}</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">{u.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Tutor Profiles Section */}
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
            {[
              { name: 'พี่บอส (สรวิธ วิฒนรงค์)', subject: 'วิชา: คอมพิวเตอร์', desc: 'ประสบการณ์สอนมากกว่า 20 ปี เชี่ยวชาญการเตรียมสอบคอมพิวเตอร์โอลิมปิก' },
              { name: 'พี่พีช (พารีย์ ยาเก)', subject: 'วิชา: คอมพิวเตอร์', desc: 'ประสบการณ์สอนมากกว่า 20 ปี เชี่ยวชาญการเตรียมสอบคอมพิวเตอร์ระดับชาติ' },
              { name: 'พี่บอส (สรวิธ วิฒนรงค์)', subject: 'วิชา: คอมพิวเตอร์', desc: 'ประสบการณ์สอนมากกว่า 20 ปี เชี่ยวชาญการเตรียมสอบคอมพิวเตอร์ระดับชาติ' },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-lg transition-shadow">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/60 flex items-center justify-center text-primary text-3xl font-bold mb-4 shadow">
                  {t.name.charAt(3)}
                </div>
                <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full mb-3">{t.subject}</span>
                <h3 className="font-bold text-gray-900 mb-2">{t.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{t.desc}</p>
                <a href="#" className="text-primary text-sm font-semibold hover:underline">ดูคอร์สเรียน &amp; หลักสูตรทั้งหมด →</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Testimonial Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
            เสียงยืนยันจากกรุ๊ปที่... ที่ทำสำเร็จแล้ว
          </h2>
          <div className="bg-primary/5 border-2 border-primary/20 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/40 to-primary flex items-center justify-center text-white text-2xl font-bold shadow">
                น
              </div>
            </div>
            <div>
              <p className="text-gray-800 text-lg leading-relaxed mb-4 italic">
                &ldquo;จากที่เกลียดฟิสิกส์ กลายเป็นวิชาทำคะแนน!
                เทคนิคของพี่บอส ช่วยให้มองงานยากกว่าออก ไม่ต้องท่องสูตร สอบติด
                วิศวกรรมคอมพิวเตอร์ ม.ดัง มาแล้ว ขอบคุณมากๆ&rdquo;
              </p>
              <div>
                <p className="font-bold text-gray-900">น้องพลอย</p>
                <p className="text-primary text-sm font-medium">วิศวกรรมศาสตร์ สาขาคอมพิวเตอร์</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Feature Section */}
      <FeatureSection />

      {/* 11. FAQ Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
            คำถามที่พบบ่อย (FAQ)
          </h2>
          <div className="space-y-3">
            {[
              { q: 'เรียนผ่าน iPad หรือมือถือได้ไหม?', a: 'ได้เลย! ระบบรองรับทุกอุปกรณ์ ทั้ง iPad, มือถือ, แท็บเล็ต และคอมพิวเตอร์ ไม่ต้องติดตั้งแอปเพิ่มเติม' },
              { q: 'สมัครเรียนได้เลยไหม?', a: 'สมัครได้เลยทันที หลังสมัครสามารถเข้าเรียนได้ภายใน 24 ชั่วโมง ไม่มีค่าสมัครเพิ่มเติม' },
              { q: 'มีคอร์สเรียนสดด้วย เรียนที่ไหนบ้างได้บ้าง?', a: 'มีทั้งคอร์สออนไลน์และ Live สด สามารถเรียนได้จากทุกที่ผ่านระบบออนไลน์ของเรา' },
            ].map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className={`ml-4 flex-shrink-0 text-primary transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 12. CTA Banner */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-orange-400 via-orange-500 to-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-snug">
            อย่าให้ถึงวันสอบ...<br />
            เริ่ม<span className="text-yellow-300">เตรียมตัววันนี้</span> เพื่ออนาคต<span className="text-yellow-300">ที่เลือกได้</span>
          </h2>
          <p className="text-orange-100 mb-8 text-lg">
            เวลาไม่คอยใคร แต่ระหว่างนี้ เรา อยู่ที่นี่ พร้อมพาทุกคนไปถึงฝัน
          </p>
          <Link href="/register">
            <button className="bg-white hover:bg-yellow-50 text-primary text-lg font-extrabold px-10 py-4 rounded-xl shadow-lg transition-all hover:-translate-y-1">
              สมัครเรียนเลยตอนนี้
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
