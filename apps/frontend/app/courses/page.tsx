"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaSearch, FaFilter, FaChevronDown, FaBookOpen } from 'react-icons/fa';
// ✅ นำเข้า Navbar (ตรวจสอบ Path ให้ตรงกับโครงสร้างโฟลเดอร์ของคุณ)
import Navbar from '../../components/Navbar'; 

export default function CoursesPage() {
  // --- State สำหรับจัดการตัวกรอง (เพิ่ม/ลด หมวดหมู่ตรงนี้ได้ครับ) ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'ทั้งหมด',
    levels: [] as string[],
    subjects: [] as string[],
    prices: [] as string[]
  });

  // ฟังก์ชันสำหรับล้างค่าตัวกรองทั้งหมด
  const clearAllFilters = () => {
    setSelectedFilters({
      type: 'ทั้งหมด',
      levels: [],
      subjects: [],
      prices: []
    });
  };

  // ฟังก์ชันจัดการการเลือก Checkbox
  const handleCheckboxChange = (category: 'levels' | 'subjects' | 'prices', value: string) => {
    setSelectedFilters(prev => {
      const current = prev[category];
      const next = current.includes(value) 
        ? current.filter(item => item !== value) 
        : [...current, value];
      return { ...prev, [category]: next };
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
      
      {/* 🚀 1. ส่วน Navbar หลัก */}
      <Navbar />

      {/* 2. Header Section (ปรับ pt-32 เพื่อเว้นที่ให้ Navbar) */}
      <header className="bg-white pt-32 pb-10 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
           <h1 className="text-3xl font-bold text-gray-900">สำรวจคอร์สเรียน</h1>
           <p className="text-gray-500 mt-1">ค้นหาคอร์สเรียนที่ตรงใจคุณเพื่อพัฒนาศักยภาพที่ Sigma Tutor</p>
        </div>
      </header>

      {/* 3. Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ---------------- Sidebar Filter (Sticky และปรับแต่งได้เอง) ---------------- */}
          {/* lg:sticky lg:top-24 ทำให้ตัวกรองติดอยู่ที่เดิมเวลาเลื่อนจอ */}
          <aside className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-24 h-fit space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <FaFilter className="text-primary" size={14} /> ตัวกรอง
                    </h3>
                    <button 
                        onClick={clearAllFilters}
                        className="text-[10px] text-blue-600 font-bold hover:underline transition-all"
                    >
                        ล้างตัวกรอง
                    </button>
                </div>

                <div className="space-y-6">
                    {/* หมวดหมู่: ประเภทคอร์ส (Radio) */}
                    <div className="filter-group">
                        <h4 className="text-sm font-bold text-gray-800 mb-3">ประเภทคอร์ส</h4>
                        <div className="space-y-2">
                            {['ทั้งหมด', 'Onsite (สอนสด)', 'Online (วิดีโอ)'].map((item) => (
                                <label key={item} className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="radio" 
                                        name="course_type" 
                                        checked={selectedFilters.type === item}
                                        onChange={() => setSelectedFilters({...selectedFilters, type: item})}
                                        className="w-4 h-4 text-primary border-gray-300 focus:ring-primary cursor-pointer" 
                                    />
                                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{item}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* หมวดหมู่: ระดับชั้น (Checkbox) */}
                    <div className="pt-4 border-t border-gray-50 filter-group">
                        <h4 className="text-sm font-bold text-gray-800 mb-3">ระดับชั้น</h4>
                        <div className="space-y-2">
                            {['ม.1-3 (มัธยมต้น)', 'ม.4-6 (มัธยมปลาย)'].map((item) => (
                                <label key={item} className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedFilters.levels.includes(item)}
                                        onChange={() => handleCheckboxChange('levels', item)}
                                        className="w-4 h-4 rounded text-primary border-gray-200 focus:ring-primary cursor-pointer" 
                                    />
                                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{item}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* หมวดหมู่: วิชา (Checkbox) */}
                    <div className="pt-4 border-t border-gray-50 filter-group">
                        <h4 className="text-sm font-bold text-gray-800 mb-3">วิชา</h4>
                        <div className="space-y-2">
                            {['คณิตศาสตร์', 'ฟิสิกส์', 'เคมี', 'ภาษาอังกฤษ'].map((item) => (
                                <label key={item} className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedFilters.subjects.includes(item)}
                                        onChange={() => handleCheckboxChange('subjects', item)}
                                        className="w-4 h-4 rounded text-primary border-gray-200 focus:ring-primary cursor-pointer" 
                                    />
                                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{item}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* หมวดหมู่: ราคา (Checkbox) */}
                    <div className="pt-4 border-t border-gray-50 filter-group">
                        <h4 className="text-sm font-bold text-gray-800 mb-3">ราคา</h4>
                        <div className="space-y-2">
                            {['ต่ำกว่า ฿1,000', '฿1,000 - ฿3,000', '฿3,000 ขึ้นไป'].map((item) => (
                                <label key={item} className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedFilters.prices.includes(item)}
                                        onChange={() => handleCheckboxChange('prices', item)}
                                        className="w-4 h-4 rounded text-primary border-gray-200 focus:ring-primary cursor-pointer" 
                                    />
                                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{item}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* ✨ ปุ่มสำหรับเพิ่มตัวกรองเองในอนาคต */}
                    <div className="pt-2">
                        <button 
                            className="w-full py-2 border-2 border-dashed border-gray-100 rounded-xl text-[10px] text-gray-300 font-bold hover:border-primary/20 hover:text-primary transition-all uppercase tracking-widest"
                            onClick={() => alert('คุณสามารถเพิ่มหมวดหมู่ใหม่ได้โดยการก๊อปปี้ Block filter-group ในโค้ดครับ')}
                        >
                            + เพิ่มตัวกรองใหม่
                        </button>
                    </div>
                </div>
            </div>
          </aside>


          {/* ---------------- Course Content Area ---------------- */}
          <div className="flex-grow">
            {/* ส่วนค้นหาและจัดเรียง */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                <div className="relative w-full md:w-80">
                    <input 
                        type="text" 
                        placeholder="ค้นหาชื่อคอร์ส หรือวิชา..." 
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <FaSearch className="absolute left-3 top-3 text-gray-400" size={14} />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">เรียงโดย:</span>
                    <select className="text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer hover:text-primary transition-colors">
                        <option>ล่าสุด</option>
                        <option>ราคาน้อยไปมาก</option>
                        <option>คะแนนยอดนิยม</option>
                    </select>
                </div>
            </div>

            {/* Empty State Box (รอดึงข้อมูลจาก Admin) */}
            <div className="w-full h-[600px] bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-10 shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                    <FaBookOpen size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">ยังไม่มีข้อมูลคอร์สเรียน</h3>
                <p className="text-gray-500 max-w-sm leading-relaxed">
                    รายการคอร์สเรียนจะปรากฏที่นี่เมื่อระบบ Backend และระบบ Admin จัดการข้อมูลเรียบร้อยแล้ว
                </p>
            </div>
          </div>

        </div>
      </main>

      {/* 4. Footer Section (สีน้ำเงินสด #0052CC ตามแบบรูปที่สอง) */}
      <footer className="bg-[#0052CC] text-white pt-16 pb-8 mt-auto">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
               
               {/* Column 1: Brand */}
               <div className="col-span-1 md:col-span-1">
                  <div className="flex items-center gap-2 mb-6">
                     <div className="bg-white p-1 rounded-lg">
                        <Image src="/Sigma-logo.png" alt="Logo" width={32} height={32} />
                     </div>
                     <span className="font-bold text-2xl tracking-tight">Sigma Tutor</span>
                  </div>
                  <p className="text-blue-100 text-sm leading-relaxed opacity-80">
                     มุ่งมั่นพัฒนาการเรียนรู้ด้วยเทคโนโลยีที่ทันสมัย เพื่อสร้างอนาคตที่ดีกว่าสำหรับนักเรียนทุกคน
                  </p>
               </div>

               {/* Column 2: Platform */}
               <div>
                  <h4 className="font-bold mb-6 text-lg">Platform</h4>
                  <ul className="space-y-3 text-sm text-blue-50/80">
                     <li><Link href="/courses" className="hover:text-white transition-colors">ค้นหาคอร์สเรียน</Link></li>
                     <li><Link href="#" className="hover:text-white transition-colors">สมัครเป็นผู้สอน</Link></li>
                     <li><Link href="#" className="hover:text-white transition-colors">เรื่องราวความสำเร็จ</Link></li>
                  </ul>
               </div>

               {/* Column 3: Company */}
               <div>
                  <h4 className="font-bold mb-6 text-lg">Company</h4>
                  <ul className="space-y-3 text-sm text-blue-50/80">
                     <li><Link href="#" className="hover:text-white transition-colors">เกี่ยวกับเรา</Link></li>
                     <li><Link href="#" className="hover:text-white transition-colors">ทีมงานผู้สอน</Link></li>
                     <li><Link href="#" className="hover:text-white transition-colors">ติดต่อเรา</Link></li>
                  </ul>
               </div>

               {/* Column 4: Legal */}
               <div>
                  <h4 className="font-bold mb-6 text-lg">Legal</h4>
                  <ul className="space-y-3 text-sm text-blue-50/80">
                     <li><Link href="#" className="hover:text-white transition-colors">เงื่อนไขการใช้งาน</Link></li>
                     <li><Link href="#" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</Link></li>
                     <li><Link href="#" className="hover:text-white transition-colors">นโยบายคุกกี้</Link></li>
                  </ul>
               </div>

            </div>

            {/* Bottom Copyright */}
            <div className="border-t border-white/10 pt-8 text-center text-sm text-blue-100/60 font-serif">
               © 2024 Sigma Tutor Academy. All rights reserved.
            </div>
         </div>
      </footer>

    </div>
  );
}