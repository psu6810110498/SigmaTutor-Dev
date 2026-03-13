import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import {
  Target, Users, Clock, Star, BookOpen,
  ArrowRight, CheckCircle, GraduationCap, Trophy, Zap,
} from "lucide-react";
import { tutorApi } from "@/app/lib/api";
import { TutorCard } from "@/app/components/tutors/TutorCard";
import { AnimatedStats } from "@/app/components/about/AnimatedStats";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา - SigmaTutor",
  description: "SigmaTutor พาน้องไปถึงคณะในฝัน ด้วยติวเตอร์คุณภาพและระบบเรียนออนไลน์ที่ดีที่สุด",
};

export const revalidate = 3600;

const WHY_US = [
  {
    icon: <GraduationCap className="w-7 h-7" />,
    color: "bg-blue-50 text-blue-600",
    title: "ติวเตอร์ที่ผ่านมาแล้วจริง",
    desc: "ครูทุกท่านคือผู้ที่ประสบความสำเร็จในเส้นทางนั้น ไม่ใช่แค่ผู้สอนทฤษฎี แต่คือคนที่เดินทางสายนี้มาก่อน",
  },
  {
    icon: <Clock className="w-7 h-7" />,
    color: "bg-indigo-50 text-indigo-600",
    title: "เรียนได้ทุกที่ ทุกเวลา",
    desc: "ไม่ว่าจะเป็นคอร์สออนไลน์, Live สด, หรือเรียนที่สถาบัน เลือกได้ตามไลฟ์สไตล์ของน้องแต่ละคน",
  },
  {
    icon: <Target className="w-7 h-7" />,
    color: "bg-purple-50 text-purple-600",
    title: "โฟกัสที่ผลลัพธ์จริง",
    desc: "เราวัดความสำเร็จจากคะแนนและคณะที่น้องสอบติด ไม่ใช่แค่จำนวนชั่วโมงเรียน",
  },
  {
    icon: <Zap className="w-7 h-7" />,
    color: "bg-yellow-50 text-yellow-600",
    title: "ระบบติดตามความก้าวหน้า",
    desc: "แดชบอร์ดส่วนตัวแสดงความคืบหน้า เปอร์เซ็นต์ที่เรียนไป และ deadline ไม่ให้พลาดแม้แต่บทเดียว",
  },
  {
    icon: <Trophy className="w-7 h-7" />,
    color: "bg-orange-50 text-orange-600",
    title: "ผลงานพิสูจน์ตัวเอง",
    desc: "นักเรียนของเราสอบติดคณะในฝันมาแล้วนับร้อยคน รีวิวจริงจากผู้เรียนจริง ไม่ปั้นแต่ง",
  },
  {
    icon: <CheckCircle className="w-7 h-7" />,
    color: "bg-green-50 text-green-600",
    title: "เข้าถึงได้ง่าย ราคาเป็นธรรม",
    desc: "เชื่อว่าทุกคนสมควรได้รับการศึกษาที่ดี คอร์สของเราจึงถูกออกแบบให้คุ้มค่าที่สุดสำหรับทุกคน",
  },
];

export default async function AboutPage() {
  const res = await tutorApi.getAll();
  const allTutors = res.success && res.data ? res.data : [];
  const featuredTutors = allTutors.slice(0, 4);

  return (
    <main className="bg-white">

      {/* ── Hero / Opening Story ── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
          <p className="text-blue-300 text-sm font-semibold tracking-widest uppercase mb-6">เกี่ยวกับ SigmaTutor</p>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-8">
            เราพาน้อง<span className="text-blue-400">ไปถึง</span><br />
            คณะที่ฝัน
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            ไม่ว่าน้องจะฝันถึงคณะแพทย์ วิศวะ หรือคณะไหนก็ตาม — เราเชื่อว่าฝันนั้นเป็นไปได้
            ถ้ามีคนที่ผ่านเส้นทางนั้นมาแล้ว คอยแนะแนวทางที่ถูกต้อง
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explore" className="px-8 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 justify-center">
              ดูคอร์สทั้งหมด
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/tutors" className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors border border-white/20 flex items-center gap-2 justify-center">
              ดูครูทั้งหมด
              <Users className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-blue-600 font-semibold text-sm tracking-wider uppercase mb-3">เรื่องราวของเรา</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-6">
                เกิดจากนักเรียน<br />เพื่อนักเรียน
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  SigmaTutor ก่อตั้งโดยกลุ่มคนที่เคยเป็นนักเรียนเหมือนกัน เคยนั่งหน้าหนังสือจนดึก
                  เคยสงสัยว่า "เรียนอย่างนี้ถูกทางไหม?" และเคยตั้งคำถามว่าทำไมการเข้าถึงครูดีๆ
                  ถึงยากแสนยากสำหรับคนส่วนใหญ่
                </p>
                <p>
                  วันนั้นเราตัดสินใจสร้างแพลตฟอร์มที่เชื่อมนักเรียนกับครูที่ "ผ่านมาแล้วจริงๆ"
                  โดยตรง ไม่มีคนกลาง ไม่มีราคาที่สูงเกินเอื้อม
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 text-white shadow-xl">
                <blockquote className="text-xl font-medium leading-relaxed italic">
                  "ทุกความฝันในการสอบติดคณะที่ต้องการ เริ่มต้นจากการพบเจอครูที่ใช่"
                </blockquote>
                <p className="mt-4 text-blue-200 text-sm font-medium">— ทีมผู้ก่อตั้ง SigmaTutor</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Animated Stats ── */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-blue-200 text-sm font-semibold tracking-widest uppercase mb-10">ตัวเลขที่พิสูจน์ตัวเอง</p>
          <AnimatedStats />
        </div>
      </section>

      {/* ── Why Us ── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-blue-600 font-semibold text-sm tracking-wider uppercase mb-3">ทำไมต้องเลือก SigmaTutor</p>
            <h2 className="text-4xl font-extrabold text-gray-900">
              เราต่างจากที่อื่นอย่างไร?
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_US.map((item, i) => (
              <div key={i} className="bg-gray-50 hover:bg-white hover:shadow-md border border-gray-100 rounded-2xl p-6 transition-all duration-200">
                <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-4`}>
                  {item.icon}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="bg-slate-900 py-20 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-blue-400 font-semibold text-sm tracking-widest uppercase mb-4">พันธกิจของเรา</p>
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-6">
            "ทำให้การศึกษาคุณภาพสูง<br />
            เข้าถึงได้สำหรับทุกคน"
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            เราเชื่อว่านักเรียนทุกคนสมควรได้รับโอกาสเดียวกัน ไม่ว่าจะอยู่จังหวัดไหน
            มีพื้นฐานแค่ไหน — ถ้ามีความมุ่งมั่น เราจะอยู่ตรงนี้เพื่อน้องเสมอ
          </p>
        </div>
      </section>

      {/* ── Featured Tutors ── */}
      {featuredTutors.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-blue-600 font-semibold text-sm tracking-wider uppercase mb-3">ทีมผู้สอน</p>
              <h2 className="text-4xl font-extrabold text-gray-900">พบกับครูของเรา</h2>
              <p className="text-gray-500 mt-3 text-base">แต่ละท่านคือผู้เชี่ยวชาญที่ผ่านเส้นทางมาแล้วจริงๆ</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredTutors.map((tutor) => (
                <TutorCard key={tutor.id} tutor={tutor} />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/tutors" className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm">
                ดูครูทั้งหมด
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA ── */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-20 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-extrabold mb-4">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
          <p className="text-blue-200 text-lg mb-10 leading-relaxed">
            เลือกคอร์สที่ใช่ เจอครูที่เหมาะ แล้วก้าวแรกสู่คณะในฝันของน้องจะเริ่มต้นที่นี่
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explore" className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-2 justify-center text-base">
              <BookOpen className="w-5 h-5" />
              ดูคอร์สทั้งหมด
            </Link>
            <Link href="/tutors" className="px-8 py-4 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl transition-colors border border-white/30 flex items-center gap-2 justify-center text-base">
              <Users className="w-5 h-5" />
              ดูครูทั้งหมด
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
