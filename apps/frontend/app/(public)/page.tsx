"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Users, Award, Star } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { useCourse, ALL_COURSES } from "@/app/context/CourseContext";

export default function HomePage() {
  const { addToCart, addToWishlist } = useCourse();

  return (
    <>
      {/* Hero Section */}
      <section className="pt-12 pb-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                🎓 แพลตฟอร์มเรียนออนไลน์อันดับ 1
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                อัปเกรดคะแนน
                <br />
                <span className="text-primary">ให้พุ่งทะยาน</span>
              </h1>
              <p className="text-gray-600 text-lg mb-8 max-w-lg leading-relaxed">
                เรียนรู้กับติวเตอร์ชั้นนำระดับประเทศ ด้วยโปรแกรมที่ออกแบบมาเพื่อความสำเร็จของคุณ
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/explore">
                  <Button size="lg">
                    <span className="flex items-center gap-2">
                      เริ่มเรียนเลย <ArrowRight size={20} />
                    </span>
                  </Button>
                </Link>
                <Button variant="outline" size="lg">
                  ดูวิดีโอแนะนำ
                </Button>
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center">
              <div className="w-full h-80 bg-white/60 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center backdrop-blur-sm">
                <p className="text-gray-400 text-sm">พื้นที่สำหรับรูปภาพ Hero</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: <Users size={24} />, value: "10,000+", label: "นักเรียนทั่วประเทศ" },
              { icon: <BookOpen size={24} />, value: "200+", label: "คอร์สคุณภาพ" },
              { icon: <Award size={24} />, value: "50+", label: "ผู้สอนมืออาชีพ" },
              { icon: <Star size={24} />, value: "4.9/5", label: "คะแนนรีวิว" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mx-auto mb-3 text-primary">
                  {stat.icon}
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">คอร์สเรียนแนะนำ</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              คอร์สเรียนยอดนิยมจากผู้สอนชั้นนำ คัดสรรมาเพื่อคุณโดยเฉพาะ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ALL_COURSES.slice(0, 3).map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all group"
              >
                {/* Image placeholder */}
                <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                  <BookOpen size={48} className="text-gray-300" />
                  {course.category && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-primary">
                      {course.category}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {course.instructor} · {course.level}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      ฿{course.price.toLocaleString()}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => addToCart(course)}
                    >
                      เพิ่มลงตะกร้า
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/explore">
              <Button variant="outline" size="lg">
                <span className="flex items-center gap-2">
                  ดูคอร์สทั้งหมด <ArrowRight size={18} />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">เสียงจากนักเรียน</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              นักเรียนกว่า 10,000 คนเชื่อมั่นใน Sigma Tutor
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "น้องปลื้ม", score: "คะแนนเพิ่ม 40%", text: "การสอนเข้าใจง่ายมาก ทำให้คะแนนพุ่งขึ้นอย่างไม่น่าเชื่อ" },
              { name: "น้องออม", score: "สอบติดจุฬาฯ", text: "คอร์สคุณภาพดีมาก อาจารย์ใจดี สอนเทคนิคที่ไม่มีในตำราเรียน" },
              { name: "น้องซัน", score: "IELTS 7.5", text: "เรียนง่าย เข้าใจง่าย มีแบบฝึกหัดให้ทำเยอะ ดีมากครับ" },
            ].map((testimonial, i) => (
              <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">{testimonial.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold text-sm">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{testimonial.name}</p>
                    <p className="text-xs text-primary font-medium">{testimonial.score}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">พร้อมเริ่มต้นเรียนรู้แล้วหรือยัง?</h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            สมัครสมาชิกวันนี้และเข้าถึงคอร์สเรียนคุณภาพสูงจากผู้สอนชั้นนำ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button variant="secondary" size="lg">
                สมัครสมาชิกฟรี
              </Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                ดูคอร์สทั้งหมด
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}