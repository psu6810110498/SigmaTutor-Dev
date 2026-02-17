'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
// ✅ แก้ไข: เอา FaFacebookF ออกจากรายการ import, เพิ่ม FcGoogle
import { FaArrowLeft } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '@/app/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth(); // Get login function
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
        credentials: 'include', // Important for cookies
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }

      if (responseData.success && responseData.data) {
        // Backend now sets HttpOnly cookies. We just need to update UI state.
        // responseData.data might be { user: ... } or just user object depending on backend return
        // Based on auth.routes.ts: data: { user: result.user }
        const userProfile = responseData.data.user || responseData.data;
        login(userProfile);

        setStatus('success');

        setTimeout(() => {
          // Check role for redirection
          if (userProfile.role === 'ADMIN') {
            router.push('/admin');
          } else {
            router.push('/dashboard'); // Standard user dashboard
          }
        }, 1000);
      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(
        error.message === 'Failed to fetch'
          ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Backend ได้'
          : error.message
      );
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden font-sans bg-[#F8F9FB]">
      {/* 🔵 Desktop: Left Side Image (Friend's Design) */}
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
          <div className="w-16 h-1.5 bg-primary mb-8 rounded-full"></div>
          <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tighter drop-shadow-sm">
            ยินดีต้อนรับ <br /> <span className="text-primary-light">กลับมาอีกครั้ง</span>
          </h1>
          <p className="text-lg text-gray-300 font-light leading-relaxed max-w-lg">
            "ความสม่ำเสมอคือกุญแจสู่ความสำเร็จ" <br />
            ล็อกอินเพื่อเข้าถึงบทเรียนและสานต่อเป้าหมายของคุณกับ Sigma Tutor
          </p>
        </div>
      </div>

      {/* ⚪ Right Side: Login Form */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto bg-[#F8F9FB] relative">
        <div className="min-h-full flex items-center justify-center p-6 py-12">
          {/* Mobile Only: Back Button */}
          <div className="lg:hidden absolute top-6 left-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors text-sm font-medium"
            >
              <FaArrowLeft /> กลับหน้าหลัก
            </Link>
          </div>

          <div className="max-w-[480px] w-full bg-white rounded-[40px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] p-10 md:p-14 border border-gray-100/50 relative z-10">
            <div className="text-center mb-8">
              <div className="relative w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-primary-light to-white p-3 rounded-2xl border border-primary-light shadow-sm">
                <Image
                  src="/Sigma-logo.png"
                  alt="Logo"
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">เข้าสู่ระบบ</h2>
              <p className="text-gray-400 text-sm mt-2">กรอกข้อมูลบัญชีของคุณเพื่อเริ่มใช้งาน</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                  อีเมล
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@example.com"
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-[#F8F9FB] border border-gray-200/80 rounded-2xl focus:ring-[3px] focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                  รหัสผ่าน
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-[#F8F9FB] border border-gray-200/80 rounded-2xl focus:ring-[3px] focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all text-sm"
                />
              </div>

              <div className="flex items-center justify-between pt-1 px-1">
                <label className="flex items-center gap-2.5 text-xs text-gray-500 cursor-pointer hover:text-gray-700 transition-colors group select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  />
                  <span className="font-medium">จำฉันไว้</span>
                </label>
                <Link
                  href="/forgot-password"
                  intrinsic-title="ลืมรหัสผ่าน"
                  className="text-xs text-primary font-bold hover:text-primary-dark hover:underline transition-all"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>

              {status === 'error' && (
                <div className="text-destructive text-xs bg-destructive-light p-3 rounded-xl border border-destructive-light flex items-center justify-center">
                  ⚠️ {errorMessage}
                </div>
              )}
              {status === 'success' && (
                <div className="text-success text-xs bg-success-light p-3 rounded-xl border border-success-light flex items-center justify-center">
                  ✅ เข้าสู่ระบบสำเร็จ! กำลังพาคุณไป...
                </div>
              )}

              <button
                disabled={status === 'loading' || status === 'success'}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all mt-4 text-sm"
              >
                {status === 'loading' ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
              </button>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink mx-4 text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                  หรือเข้าสู่ระบบด้วย
                </span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>

              {/* ✅ Google Button (Standard Style) */}
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => (window.location.href = 'http://localhost:4000/api/auth/google')}
                  className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium text-gray-700 active:scale-[0.98] shadow-sm"
                >
                  <FcGoogle className="text-xl" /> เข้าสู่ระบบด้วย Google
                </button>
              </div>
            </form>

            <p className="text-center mt-10 text-sm text-gray-500 font-medium">
              ยังไม่มีบัญชีสมาชิก?{' '}
              <Link
                href="/register"
                intrinsic-title="สมัครสมาชิก"
                className="text-primary font-bold hover:text-primary-dark hover:underline transition-all"
              >
                สมัครสมาชิกฟรี
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
