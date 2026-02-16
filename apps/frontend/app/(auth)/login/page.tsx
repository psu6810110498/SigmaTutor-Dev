"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
// ✅ แก้ไข: เอา FaFacebookF ออกจากรายการ import
import { FaGoogle, FaArrowLeft } from 'react-icons/fa';

export default function LoginPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setStatus('loading');

    try {
      const BACKEND_URL = 'http://localhost:4000/api'; 
      
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }

      if (responseData.success && responseData.data) {
        const token = responseData.data.accessToken || responseData.data.token;
        const userProfile = responseData.data.user || responseData.data;

        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(userProfile)); 
      }

      setStatus('success');
      
      setTimeout(() => {
        window.location.href = '/'; 
      }, 1000);

    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message === 'Failed to fetch' ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Backend ได้' : error.message);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden font-sans bg-[#F8F9FB]">
      
      {/* 🔵 ฝั่งซ้าย: รูปห้องสมุดพรีเมียม (คงเดิม) */}
      <div className="hidden lg:flex w-1/2 relative bg-gray-900 h-full">
        <Image 
          src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2128&auto=format&fit=crop" 
          alt="Login Background Library" 
          fill 
          className="object-cover opacity-60"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

        <Link 
          href="/" 
          className="absolute top-10 left-10 z-20 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-medium hover:bg-white/20 transition-all group"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform text-xs" />
          กลับหน้าหลัก
        </Link>
        
        <div className="absolute bottom-24 left-16 right-16 z-10 text-white">
          <div className="w-16 h-1.5 bg-blue-500 mb-8 rounded-full"></div>
          <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tighter drop-shadow-sm">
            ยินดีต้อนรับ <br /> <span className="text-blue-200">กลับมาอีกครั้ง</span>
          </h1>
          <p className="text-lg text-gray-300 font-light leading-relaxed max-w-lg">
            "ความสม่ำเสมอคือกุญแจสู่ความสำเร็จ" <br/>
            ล็อกอินเพื่อเข้าถึงบทเรียนและสานต่อเป้าหมายของคุณกับ Sigma Tutor
          </p>
        </div>
      </div>

      {/* ⚪ ฝั่งขวา: ฟอร์มเข้าสู่ระบบ */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto bg-[#F8F9FB] relative">
        <div className="min-h-full flex items-center justify-center p-6 py-12">
           <div className="max-w-[480px] w-full bg-white rounded-[40px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] p-10 md:p-14 border border-gray-100/50 relative z-10">
            
            <div className="text-center mb-8">
              <div className="relative w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-blue-50 to-white p-3 rounded-2xl border border-blue-100/50 shadow-sm">
                 <Image src="/Sigma-logo.png" alt="Logo" fill className="object-contain p-2" unoptimized/>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">เข้าสู่ระบบ</h2>
              <p className="text-gray-400 text-sm mt-2">กรอกข้อมูลบัญชีของคุณเพื่อเริ่มใช้งาน</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">อีเมล</label>
                <input 
                  type="email" name="email" required placeholder="name@example.com" onChange={handleChange}
                  className="w-full px-5 py-4 bg-[#F8F9FB] border border-gray-200/80 rounded-2xl focus:ring-[3px] focus:ring-blue-500/10 focus:border-[#0052CC] focus:bg-white outline-none transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">รหัสผ่าน</label>
                <input 
                  type="password" name="password" required placeholder="••••••••" onChange={handleChange}
                  className="w-full px-5 py-4 bg-[#F8F9FB] border border-gray-200/80 rounded-2xl focus:ring-[3px] focus:ring-blue-500/10 focus:border-[#0052CC] focus:bg-white outline-none transition-all text-sm"
                />
              </div>

              <div className="flex items-center justify-between pt-1 px-1">
                <label className="flex items-center gap-2.5 text-xs text-gray-500 cursor-pointer hover:text-gray-700 transition-colors group select-none">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 cursor-pointer" />
                  <span className="font-medium">จำฉันไว้</span>
                </label>
                <Link href="/forgot-password" intrinsic-title="ลืมรหัสผ่าน" className="text-xs text-[#0052CC] font-bold hover:text-blue-700 hover:underline transition-all">
                  ลืมรหัสผ่าน?
                </Link>
              </div>

              {status === 'error' && (
                <div className="text-red-500 text-xs bg-red-50 p-3 rounded-xl border border-red-100 flex items-center justify-center">⚠️ {errorMessage}</div>
              )}
              {status === 'success' && (
                <div className="text-green-600 text-xs bg-green-50 p-3 rounded-xl border border-green-100 flex items-center justify-center">✅ เข้าสู่ระบบสำเร็จ! กำลังพาคุณไป...</div>
              )}

              <button 
                disabled={status === 'loading' || status === 'success'} 
                className="w-full bg-[#0052CC] text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all mt-4 text-sm"
              >
                {status === 'loading' ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
              </button>

              <div className="relative flex items-center py-4">
                 <div className="flex-grow border-t border-gray-100"></div>
                 <span className="flex-shrink mx-4 text-[10px] text-gray-400 uppercase font-bold tracking-widest">หรือเข้าสู่ระบบด้วย</span>
                 <div className="flex-grow border-t border-gray-100"></div>
              </div>

              {/* ✅ แก้ไข: เหลือเพียงปุ่ม Google และปรับความกว้างเป็นเต็มจอ (w-full) */}
              <div className="w-full">
                 <button 
                  type="button" 
                  onClick={() => window.location.href = 'http://localhost:4000/api/auth/google'}
                  className="w-full flex items-center justify-center gap-3 py-3.5 border border-gray-200/80 rounded-2xl hover:bg-gray-50/80 hover:border-gray-300 transition-all text-xs font-bold text-gray-600 active:scale-[0.97]"
                >
                    <FaGoogle className="text-red-500 text-base" /> Google
                 </button>
              </div>
            </form>

            <p className="text-center mt-10 text-sm text-gray-500 font-medium">
              ยังไม่มีบัญชีสมาชิก? <Link href="/register" intrinsic-title="สมัครสมาชิก" className="text-[#0052CC] font-bold hover:text-blue-700 hover:underline transition-all">สมัครสมาชิกฟรี</Link>
            </p>
           </div>
        </div>
      </div>
    </div>
  );
}