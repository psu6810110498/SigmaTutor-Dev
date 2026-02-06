"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { HiOutlineMail } from 'react-icons/hi'; // ไอคอนซองจดหมาย
import { FaKey } from 'react-icons/fa'; // ไอคอนกุญแจ
import { FiArrowLeft } from 'react-icons/fi'; // ไอคอนลูกศรกลับ

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // จำลองว่าส่งเมลสำเร็จ
    setIsSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50/50 relative overflow-hidden font-sans py-10">
      
      {/* Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      {/* Main Card */}
      <div className="bg-surface p-8 rounded-2xl shadow-xl w-full max-w-md relative z-10 border border-gray-100 text-center">
        
        {/* Logo Text */}
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary font-sans">Sigma Tutor</h2>
            <p className="text-xs font-bold tracking-[0.2em] text-gray-400 mt-1">PLATFORM</p>
        </div>

        {/* Key Icon & Header */}
        <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4 text-yellow-500 shadow-sm">
                <FaKey size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">ลืมรหัสผ่าน</h1>
            <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
                กรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้คุณ
            </p>
        </div>

        {/* Form */}
        {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">อีเมล</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HiOutlineMail className="text-gray-400 text-lg" />
                        </div>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="กรอกอีเมลของคุณ" 
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-serif placeholder:text-gray-400 text-gray-800"
                        />
                    </div>
                </div>

                <button type="submit" className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-[0.98]">
                    ส่งลิงก์รีเซ็ตรหัสผ่าน
                </button>
            </form>
        ) : (
            // Success State (แสดงเมื่อกดส่งแล้ว)
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <p className="text-green-700 text-sm font-medium">
                    ส่งลิงก์เรียบร้อยแล้ว! <br/>กรุณาตรวจสอบอีเมลของคุณ
                </p>
            </div>
        )}

        {/* Back to Login Link */}
        <div className="mt-8 border-t border-gray-100 pt-6">
            <Link href="/login" className="inline-flex items-center text-gray-500 hover:text-primary transition-colors text-sm font-medium group">
                <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                กลับไปหน้าเข้าสู่ระบบ
            </Link>
        </div>

      </div>

      {/* Footer Text */}
      <div className="absolute bottom-6 text-center text-xs text-gray-400 w-full font-serif opacity-60">
        © 2024 Sigma Tutor Academy. All rights reserved.
      </div>
    </div>
  );
}