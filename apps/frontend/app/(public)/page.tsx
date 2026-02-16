"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowRight, FaBook, FaShoppingCart, FaHeart, FaRegHeart, FaTimes, FaTrash, FaFilter, FaSearch, FaStar } from 'react-icons/fa';
// ✅ 1. เพิ่มการนำเข้า Navbar (Relative Path)
import Navbar from '../../components/Navbar'; 
// เรียกใช้ Context
import { useCourse, ALL_COURSES } from '../context/CourseContext';

export default function HomePage() {
  // ดึงข้อมูลและฟังก์ชันจาก Context
  const { cartItems, wishlistItems, removeFromCart, removeFromWishlist, addToCart, addToWishlist } = useCourse();
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  
  const cartRef = useRef<HTMLDivElement>(null);
  const wishlistRef = useRef<HTMLDivElement>(null);

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  // ปิด Popover เมื่อคลิกที่อื่น
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setIsCartOpen(false);
      }
      if (wishlistRef.current && !wishlistRef.current.contains(event.target as Node)) {
        setIsWishlistOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="font-sans text-gray-900 bg-white flex flex-col min-h-screen">
      
      {/* ✅ 2. เพิ่ม Navbar กลับมาไว้ด้านบนสุดของหน้าจอ */}
      <Navbar />

      {/* 1. Hero Section (ปรับ padding-top จาก pt-16 กลับเป็น pt-32 เพื่อเว้นที่ให้ Navbar) */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden relative flex-grow">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
               
               <div className="text-center lg:text-left space-y-6">
                  <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6" style={{ lineHeight: '1.6' }}>
                    <span className="block mb-2">อัปเกรดคะแนนให้พุ่ง</span>
                    <span className="block">
                      ด้วย <span className="text-secondary">เทคนิคระดับท็อป</span>
                    </span>
                  </h1>
                  <p className="text-lg text-gray-600 max-w-lg mx-auto lg:mx-0 font-serif leading-relaxed">
                    เรียนรู้และพัฒนาเพื่อเตรียมตัวสอบในโรงเรียน หรือสอบเข้ามหาวิทยาลัย 
                    ด้วยเนื้อหาที่เข้มข้นและอาจารย์ผู้สอนมืออาชีพระดับประเทศ
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                    <Link href="/courses">
                      <button className="bg-primary hover:bg-blue-700 text-white text-lg font-bold px-8 py-3.5 rounded-xl shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-1">
                        สำรวจคอร์สเรียน ↗
                      </button>
                    </Link>
                    <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-lg font-medium px-8 py-3.5 rounded-xl transition-all">
                      ดูวิดีโอตัวอย่าง
                    </button>
                  </div>
               </div>

               <div className="relative">
                  <div className="absolute -top-10 -right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                  <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                  
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

      {/* 2. Demo Buttons Area */}
      <section className="py-8 bg-white border-b border-gray-100">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-sm font-bold mb-4 text-gray-500 uppercase tracking-wide">ทดสอบระบบเชื่อมต่อข้อมูล (Context Demo)</h3>
            <div className="flex gap-4 justify-center">
                <button 
                    onClick={() => addToCart(ALL_COURSES[0])}
                    className="bg-white border border-primary text-primary hover:bg-primary hover:text-white font-bold py-2 px-6 rounded-full transition-all shadow-sm flex items-center gap-2 text-sm"
                >
                    <FaShoppingCart /> เพิ่ม "{ALL_COURSES[0].title}" ลงตะกร้า
                </button>
                <button 
                    onClick={() => addToWishlist(ALL_COURSES[1])}
                    className="bg-white border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold py-2 px-6 rounded-full transition-all shadow-sm flex items-center gap-2 text-sm"
                >
                    <FaHeart /> กดถูกใจ "{ALL_COURSES[1].title}"
                </button>
            </div>
         </div>
      </section>

      {/* 3. Stats Section */}
      <section className="py-10 bg-white border-y border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100 text-center opacity-50">
             <div className="p-4">
                 <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">---</h3>
                 <p className="text-gray-600 font-medium">คอร์สเรียน</p>
             </div>
             <div className="p-4">
                 <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">---</h3>
                 <p className="text-gray-600 font-medium">ผู้เรียน</p>
             </div>
             <div className="p-4">
                 <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">---</h3>
                 <p className="text-gray-600 font-medium">ผู้สอนมืออาชีพ</p>
             </div>
             <div className="p-4">
                 <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">---</h3>
                 <p className="text-gray-600 font-medium">ความพึงพอใจ</p>
             </div>
          </div>
        </div>
      </section>

      {/* 4. Popular Courses Section (Empty State) */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">คอร์สยอดนิยม</h2>
              <p className="text-gray-500 font-serif">เลือกเรียนวิชาที่คุณต้องการ เพื่อพัฒนาศักยภาพของคุณวันนี้</p>
            </div>
            <Link href="/courses" className="hidden md:flex items-center text-primary font-bold hover:underline">
               ดูคอร์สทั้งหมด <FaArrowRight className="ml-2 text-sm"/>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
               <FaBook size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-500">ยังไม่มีข้อมูลคอร์สแนะนำ</h3>
            <p className="text-gray-400 text-sm mt-1">รายการคอร์สเรียนยอดนิยมจะปรากฏที่นี่เมื่อระบบเชื่อมต่อกับฐานข้อมูล</p>
          </div>

        </div>
      </section>

      {/* 5. Footer */}
      <footer className="bg-primary text-white pt-16 pb-8 mt-auto">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
               <div>
                  <div className="flex items-center gap-2 mb-4">
                     <div className="relative w-8 h-8 bg-white rounded flex items-center justify-center p-1">
                        <Image src="/Sigma-logo.png" alt="Logo" width={32} height={32} className="object-contain"/>
                     </div>
                     <span className="font-bold text-xl">Sigma Tutor</span>
                  </div>
                  <p className="text-blue-100 text-sm leading-relaxed mb-6 font-serif">
                     มุ่งมั่นพัฒนาการเรียนรู้ด้วยเทคโนโลยีที่ทันสมัย เพื่อสร้างอนาคตที่ดีกว่าสำหรับนักเรียนทุกคน
                  </p>
               </div>

               <div>
                  <h4 className="font-bold mb-4 text-lg">Platform</h4>
                  <ul className="space-y-2 text-sm text-blue-100">
                     <li><Link href="/courses" className="hover:text-white transition-colors">ค้นหาคอร์สเรียน</Link></li>
                     <li><Link href="#" className="hover:text-white transition-colors">สมัครเป็นผู้สอน</Link></li>
                     <li><Link href="#" className="hover:text-white transition-colors">เรื่องราวความสำเร็จ</Link></li>
                  </ul>
               </div>

               <div>
                  <h4 className="font-bold mb-4 text-lg">Company</h4>
                  <ul className="space-y-2 text-sm text-blue-100">
                     <li><Link href="#" className="hover:text-white transition-colors">เกี่ยวกับเรา</Link></li>
                     <li><Link href="#" className="hover:text-white transition-colors">ทีมงานผู้สอน</Link></li>
                     <li><Link href="#" className="hover:text-white transition-colors">ติดต่อเรา</Link></li>
                  </ul>
               </div>

               <div>
                  <h4 className="font-bold mb-4 text-lg">Legal</h4>
                  <ul className="space-y-2 text-sm text-blue-100">
                     <li><Link href="#" className="hover:text-white transition-colors">เงื่อนไขการใช้งาน</Link></li>
                     <li><Link href="#" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</Link></li>
                     <li><Link href="#" className="hover:text-white transition-colors">นโยบายคุกกี้</Link></li>
                  </ul>
               </div>
            </div>

            <div className="border-t border-blue-400/30 pt-8 text-center text-sm text-blue-200">
               © 2024 Sigma Tutor Academy. All rights reserved.
            </div>
         </div>
      </footer>

    </div>
  );
}