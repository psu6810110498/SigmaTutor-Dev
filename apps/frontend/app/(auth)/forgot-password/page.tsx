"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('http://localhost:4000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'ไม่พบอีเมลนี้ในระบบ');
      }

      setStatus('success');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
    }
  };

  // ✅ หน้าจอเมื่อส่งอีเมลสำเร็จ (ปรับปรุงเพื่อ User จริง)
  if (status === 'success') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FB] p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-[48px] p-12 text-center shadow-xl border border-gray-50 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <FaCheckCircle className="text-green-500 text-4xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">ตรวจสอบอีเมลของคุณ</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปที่อีเมลของคุณแล้ว <br/>
            <span className="text-sm font-medium text-blue-600">
              (หากไม่พบ โปรดตรวจสอบในกล่องจดหมายขยะ หรือ Junk mail)
            </span>
          </p>
          <div className="space-y-4">
            <Link href="/login" className="block w-full bg-[#0052CC] text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 text-center">
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
            <button 
              onClick={() => setStatus('idle')}
              className="text-sm text-gray-400 hover:text-blue-600 transition-colors font-medium"
            >
              ไม่ได้รับอีเมล? ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex overflow-hidden font-sans bg-[#F8F9FB]">
      {/* ฝั่งรูปภาพประกอบ */}
      <div className="hidden lg:flex w-1/2 relative">
        <Image src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2128&auto=format&fit=crop" alt="bg" fill className="object-cover" priority unoptimized/>
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-900/40 to-transparent"></div>
        <Link href="/login" className="absolute top-10 left-10 z-20 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-medium hover:bg-white/20 transition-all group">
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          กลับหน้าเข้าสู่ระบบ
        </Link>
        <div className="absolute bottom-20 left-20 right-20 z-10 text-white">
          <div className="w-12 h-1 bg-blue-500 mb-6 rounded-full"></div>
          <h1 className="text-6xl font-extrabold mb-6 leading-tight tracking-tighter">ไม่ต้องกังวล <br /> <span className="text-blue-400">เราช่วยคุณได้</span></h1>
        </div>
      </div>

      {/* ฝั่งฟอร์มกรอกข้อมูล */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative bg-[#F8F9FB]">
        <div className="max-w-[460px] w-full bg-white rounded-[48px] shadow-[0_25px_70px_rgba(0,0,0,0.04)] p-12 md:p-16 relative z-10 border border-gray-50">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">ลืมรหัสผ่าน?</h2>
            <p className="text-gray-400 text-sm mt-3 leading-relaxed">กรอกอีเมลที่ลงทะเบียนไว้เพื่อรับลิงก์รีเซ็ต</p>
          </div>

          {status === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
              <FaExclamationCircle /> {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">อีเมลของคุณ</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="name@example.com" 
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-[#0052CC] outline-none transition-all text-gray-700"
              />
            </div>
            <button 
              type="submit" 
              disabled={status === 'loading'} 
              className="w-full bg-[#0052CC] text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-70"
            >
              {status === 'loading' ? 'กำลังส่งข้อมูล...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}