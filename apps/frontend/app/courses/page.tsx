"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaSearch, FaFilter, FaBookOpen, FaShoppingCart, FaHeart, FaRegHeart, FaTimes, FaTrash } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
// 1. เรียกใช้ Context
import { useCourse, ALL_COURSES } from '../context/CourseContext';

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // State สำหรับ Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 3; 
  
  const { cartItems, wishlistItems, addToCart, removeFromCart, addToWishlist, removeFromWishlist, isInCart, isInWishlist } = useCourse();
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  
  const cartRef = useRef<HTMLDivElement>(null);
  const wishlistRef = useRef<HTMLDivElement>(null);

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

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
    <div className="font-sans text-gray-900 bg-white min-h-screen flex flex-col">
      
      {/* 1. Navbar - ปรับเป็นสีขาวทึบ (bg-white) */}
      <nav className="fixed w-full z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <div className="relative w-10 h-10">
                 <Image src="/Sigma-logo.png" alt="Sigma Logo" fill className="object-contain"/>
              </div>
              <span className="font-bold text-xl text-primary tracking-wide">Sigma Tutor</span>
            </Link>

            {/* Menu Links */}
            <div className="hidden md:flex space-x-8 text-gray-600 font-medium">
              <Link href="/" className="hover:text-primary transition-colors">หน้าแรก</Link>
              <Link href="/courses" className="text-primary font-bold">รวมคอร์ส</Link>
              <Link href="#" className="hover:text-primary transition-colors">เกี่ยวกับเรา</Link>
              <Link href="#" className="hover:text-primary transition-colors">ติดต่อเรา</Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
               {/* Cart & Wishlist Section */}
               <div className="hidden md:flex items-center space-x-1 border-r border-gray-200 pr-4 mr-1">
                 
                 {/* Wishlist Button */}
                 <div ref={wishlistRef} className="relative">
                    <button 
                        className={`transition-colors relative p-2 rounded-full hover:bg-gray-50 ${isWishlistOpen ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                        onClick={() => setIsWishlistOpen(!isWishlistOpen)}
                    >
                        {wishlistItems.length > 0 ? <FaHeart size={20} className="text-red-500" /> : <FaRegHeart size={20} />}
                        {wishlistItems.length > 0 && (
                            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-bounce-short">
                                {wishlistItems.length}
                            </span>
                        )}
                    </button>

                    {/* Wishlist Popover */}
                    {isWishlistOpen && (
                        <div className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in-up">
                            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-gray-800">คอร์สที่ถูกใจ ({wishlistItems.length})</h3>
                                <button onClick={() => setIsWishlistOpen(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {wishlistItems.length === 0 ? (
                                    <div className="py-10 text-center flex flex-col items-center justify-center text-gray-400">
                                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-3">
                                            <FaRegHeart size={24} className="text-red-300" />
                                        </div>
                                        <p className="text-sm font-medium">ยังไม่มีคอร์สที่ถูกใจ</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {wishlistItems.map((item) => (
                                            <div key={item.id} className="p-3 flex gap-3 hover:bg-gray-50 transition-colors">
                                                <div className="w-16 h-12 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden relative">
                                                     <div className="w-full h-full bg-purple-100 flex items-center justify-center text-xs text-purple-400 font-bold">IMG</div>
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
                                                    <p className="text-sm text-gray-500">฿{item.price.toLocaleString()}</p>
                                                </div>
                                                <button onClick={() => removeFromWishlist(item.id)} className="text-gray-300 hover:text-red-500 p-1">
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                 </div>

                 {/* Cart Button */}
                 <div ref={cartRef} className="relative">
                    <button 
                        className={`transition-colors relative p-2 rounded-full hover:bg-gray-50 ${isCartOpen ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
                        onClick={() => setIsCartOpen(!isCartOpen)}
                    >
                        <FaShoppingCart size={20} className={cartItems.length > 0 ? "text-primary" : ""} />
                        {cartItems.length > 0 && (
                            <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-bounce-short">
                                {cartItems.length}
                            </span>
                        )}
                    </button>

                    {/* Cart Popover */}
                    {isCartOpen && (
                        <div className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in-up">
                            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-gray-800">รถเข็นของฉัน ({cartItems.length})</h3>
                                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {cartItems.length === 0 ? (
                                    <div className="py-10 text-center flex flex-col items-center justify-center text-gray-400">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                            <FaShoppingCart size={24} className="opacity-30" />
                                        </div>
                                        <p className="text-sm font-medium">ยังไม่มีสินค้าในรถเข็น</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {cartItems.map((item) => (
                                            <div key={item.id} className="p-3 flex gap-3 hover:bg-gray-50 transition-colors">
                                                <div className="w-16 h-12 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden relative">
                                                    <div className="w-full h-full bg-blue-100 flex items-center justify-center text-xs text-blue-400 font-bold">IMG</div>
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
                                                    <p className="text-sm text-red-500 font-bold">฿{item.price.toLocaleString()}</p>
                                                </div>
                                                <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 p-1">
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Footer ยอดรวม & ปุ่มชำระเงิน */}
                            {cartItems.length > 0 && (
                                <div className="p-4 border-t border-gray-100 bg-white">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm text-gray-500">ยอดรวม</span>
                                        <span className="text-lg font-bold text-primary">฿{totalPrice.toLocaleString()}</span>
                                    </div>
                                    <Link href="/payment">
                                        <button className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-all shadow-md active:scale-95">
                                            ชำระเงิน
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                 </div>

              </div>

              {/* Login / Register */}
              <div className="flex items-center space-x-3">
                <Link href="/login" className="hidden md:block text-primary font-medium px-4 py-2 hover:bg-blue-50 rounded-lg transition-colors">
                  เข้าสู่ระบบ
                </Link>
                <Link href="/register" className="bg-primary hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                  ลงทะเบียน
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section (Banner) */}
      <header className="pt-32 pb-16 bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 w-full h-full opacity-20">
            <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
         </div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between">
            <div className="max-w-2xl">
                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-medium mb-4 border border-white/20">
                    ปลดล็อกศักยภาพของคุณกับ SIGMA TUTOR
                </span>
                <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                    ปลดล็อกศักยภาพ <br/> <span className="text-blue-400">ในตัวคุณ</span>
                </h1>
                <p className="text-gray-300 text-lg mb-8 font-serif">
                    เรียนรู้กับติวเตอร์ชั้นนำและผู้เชี่ยวชาญในทุกวิชาด้วยโปรแกรมการเรียนรู้ที่ออกแบบมาเพื่อความสำเร็จของคุณ
                </p>
                <div className="flex gap-4">
                    <button className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30">
                        เริ่มเรียนเลยวันนี้ ↗
                    </button>
                    <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-all backdrop-blur-sm border border-white/10">
                        ดูวิดีโอแนะนำ
                    </button>
                </div>
            </div>
            <div className="hidden md:block w-80 h-64 bg-white/5 rounded-2xl border-2 border-dashed border-white/10 relative mt-8 md:mt-0 backdrop-blur-md flex items-center justify-center">
                 <p className="text-gray-400 text-sm">พื้นที่สำหรับรูปภาพ (Hero)</p>
            </div>
         </div>
      </header>

      {/* 3. Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
         <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
                
                {/* Search Mobile */}
                <div className="lg:hidden mb-4">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="ค้นหาคอร์สเรียน..." 
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
                    </div>
                </div>

                {/* Filter Groups */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm opacity-60 pointer-events-none select-none grayscale">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <FaFilter className="text-primary" size={14} /> ตัวกรอง
                        </h3>
                        <button className="text-xs text-blue-600 hover:underline">ล้างตัวกรอง</button>
                    </div>

                    <div className="mb-6">
                        <h4 className="text-sm font-bold text-gray-700 mb-3">ประเภทคอร์ส</h4>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h4 className="text-sm font-bold text-gray-700 mb-3">ระดับชั้น</h4>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-full"></div>
                            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Content Area */}
            <div className="flex-grow">
                
                {/* Top Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">สำรวจคอร์สเรียน</h2>
                        <p className="text-sm text-gray-500 mt-1">
                             {searchQuery ? `กำลังค้นหา: "${searchQuery}"` : "รายการคอร์สเรียนทั้งหมดจะแสดงที่นี่"}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="hidden md:block relative w-64">
                            <input 
                                type="text" 
                                placeholder="ค้นหาคอร์สเรียน..." 
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <FaSearch className="absolute left-3 top-3 text-gray-400" size={14} />
                        </div>
                    </div>
                </div>

                {/* --- Empty State Box --- */}
                <div className="w-full h-96 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 text-gray-300 shadow-sm">
                        {searchQuery ? <FaSearch size={32} /> : <FaBookOpen size={32} />}
                    </div>
                    <h3 className="text-lg font-bold text-gray-500 mb-2">
                        {searchQuery ? "ไม่พบข้อมูล (Backend ยังไม่พร้อม)" : "พื้นที่สำหรับแสดงรายการคอร์ส"}
                    </h3>
                    <p className="text-gray-400 text-sm max-w-sm mb-6">
                        เมื่อระบบ Backend เชื่อมต่อกับฐานข้อมูลแล้ว รายการคอร์สเรียนจะปรากฏขึ้นที่นี่
                    </p>

                    {/* Demo Buttons */}
                    <div className="flex gap-4">
                        <button 
                            onClick={() => addToCart(ALL_COURSES[0])}
                            className="bg-white border border-primary text-primary hover:bg-primary hover:text-white font-bold py-2 px-6 rounded-full transition-all shadow-sm flex items-center gap-2 text-sm"
                        >
                            <FaShoppingCart /> ทดลองเพิ่มตะกร้า
                        </button>
                        <button 
                            onClick={() => addToWishlist(ALL_COURSES[1])}
                            className="bg-white border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold py-2 px-6 rounded-full transition-all shadow-sm flex items-center gap-2 text-sm"
                        >
                            <FaHeart /> ทดลองกดถูกใจ
                        </button>
                    </div>
                </div>

                {/* --- Pagination --- */}
                <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        แสดง 0 จาก 0 รายการ
                    </p>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiChevronLeft />
                        </button>
                        {[1, 2, 3].map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                                    currentPage === page 
                                        ? 'bg-primary text-white shadow-md shadow-blue-500/20' 
                                        : 'border border-gray-200 text-gray-600 hover:border-primary hover:text-primary bg-white'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiChevronRight />
                        </button>
                    </div>
                </div>

            </div>
         </div>
      </main>

      {/* 4. Footer */}
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