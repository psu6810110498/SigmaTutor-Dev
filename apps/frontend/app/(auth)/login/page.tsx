"use client";

import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi'; // เพิ่ม FiArrowLeft
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50/50 relative overflow-hidden font-sans">
      
      {/* --- ปุ่มย้อนกลับ (Back to Home) --- */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center text-gray-500 hover:text-primary transition-colors font-medium z-20"
      >
        <FiArrowLeft className="mr-2" size={20} />
        กลับสู่หน้าหลัก
      </Link>

      {/* Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      {/* Card */}
      <div className="bg-surface p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md relative z-10 border border-gray-100">
        
        {/* Header & Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
             <div className="relative w-24 h-24">
               <Image 
                 src="/Sigma-logo.png" 
                 alt="Sigma Tutor Logo" 
                 fill
                 className="object-contain"
                 priority
               />
             </div>
          </div>
          <h2 className="text-2xl font-bold text-primary font-sans">SIGMA TUTOR</h2>
          <h1 className="text-xl font-bold text-gray-900 mt-1">เข้าสู่ระบบ</h1>
          <p className="text-gray-500 text-sm mt-1 font-serif">ยินดีต้อนรับกลับ! เข้าสู่ระบบเพื่อเริ่มเรียน</p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <input 
              type="email" 
              placeholder="กรอกอีเมลของคุณ" 
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-serif placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="กรอกรหัสผ่าน" 
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-serif placeholder:text-gray-400"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary" />
              <span className="text-gray-600">จดจำฉัน</span>
            </label>
            <Link href="/forgot-password" className="text-primary hover:text-blue-700 font-medium transition-colors">
              ลืมรหัสผ่าน?
            </Link>
          </div>

          <button type="submit" className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-[0.98]">
            เข้าสู่ระบบ
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-surface text-gray-400 font-medium">หรือ</span>
          </div>
        </div>

        {/* Social Login */}
        <Link href="/google-login" className="block w-full">
          <button type="button" className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors flex items-center justify-center space-x-3 group">
            <FcGoogle className="text-2xl group-hover:scale-110 transition-transform" />
            <span>เข้าสู่ระบบด้วย Google</span>
          </button>
        </Link>

        {/* Register Link */}
        <div className="text-center mt-8 text-sm text-gray-600">
          ยังไม่มีบัญชี? <Link href="/register" className="text-primary hover:text-blue-700 font-bold ml-1 hover:underline">สมัครสมาชิก</Link>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-6 text-center text-xs text-gray-400 w-full font-serif opacity-60">
        © 2024 Sigma Tutor Academy. All rights reserved.
      </div>
    </div>
  );
}