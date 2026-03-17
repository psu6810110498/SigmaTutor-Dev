"use client";

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaCheckCircle, FaExclamationCircle, FaArrowLeft, FaShieldAlt } from 'react-icons/fa';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token'); 
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // ✅ ฟังก์ชันตรวจสอบความแข็งแกร่งของรหัสผ่าน
  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    return { minLength, hasUpper, hasNumber };
  };

  const checks = validatePassword(password);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. ตรวจสอบรหัสผ่านตรงกันหรือไม่
    if (password !== confirmPassword) {
      setErrorMessage("รหัสผ่านใหม่ไม่ตรงกัน");
      setStatus('error');
      return;
    }

    // 2. ตรวจสอบเงื่อนไขความปลอดภัย
    if (!checks.minLength || !checks.hasUpper || !checks.hasNumber) {
      setErrorMessage("รหัสผ่านไม่เป็นไปตามเงื่อนไขความปลอดภัย");
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api') + '/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'ลิงก์หมดอายุหรือ Token ไม่ถูกต้อง');

      setStatus('success');
      setTimeout(() => router.push('/login'), 3000);

    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message);
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-[480px] w-full bg-white rounded-[40px] shadow-2xl p-10 text-center border border-gray-100 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <FaCheckCircle className="text-green-500 text-4xl" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">เปลี่ยนรหัสสำเร็จ!</h2>
        <p className="text-gray-500 mb-10 leading-relaxed">ระบบกำลังนำคุณกลับไปหน้าเข้าสู่ระบบอัตโนมัติ...</p>
        <Link href="/login" className="block w-full bg-[#1E40AF] text-white font-bold py-4.5 rounded-2xl text-center active:scale-95 transition-all">เข้าสู่ระบบเลย</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] w-full bg-white rounded-[40px] shadow-2xl p-10 md:p-14 border border-gray-100">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-gray-900">ตั้งรหัสผ่านใหม่</h2>
        <p className="text-gray-400 text-sm mt-3">สร้างรหัสผ่านใหม่ที่คาดเดายากเพื่อความปลอดภัย</p>
        
        {!token && (
          <div className="mt-6 p-4 bg-amber-50 text-amber-600 text-xs rounded-xl border border-amber-100 font-bold flex items-center gap-2">
            <FaExclamationCircle className="shrink-0" /> ลิงก์ไม่ถูกต้อง กรุณาเข้าใช้งานผ่านลิงก์จากอีเมลที่คุณได้รับ
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 flex items-center gap-2">
            <FaExclamationCircle className="shrink-0" /> {errorMessage}
          </div>
        )}
      </div>

      <form onSubmit={handleReset} className="space-y-6">
        <div className="space-y-2 text-left">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">รหัสผ่านใหม่</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-5 py-4 bg-[#F8F9FB] border border-gray-200 rounded-2xl focus:border-[#0052CC] outline-none transition-all"/>
          
          {/* ✅ ส่วนแสดงเงื่อนไขความแข็งแกร่ง (Real-time Validation) */}
          <div className="mt-3 grid grid-cols-2 gap-2">
             <div className={`text-[10px] flex items-center gap-1 font-bold ${checks.minLength ? 'text-green-500' : 'text-gray-300'}`}>
                <FaCheckCircle /> อย่างน้อย 8 ตัวอักษร
             </div>
             <div className={`text-[10px] flex items-center gap-1 font-bold ${checks.hasUpper ? 'text-green-500' : 'text-gray-300'}`}>
                <FaCheckCircle /> มีตัวพิมพ์ใหญ่ (A-Z)
             </div>
             <div className={`text-[10px] flex items-center gap-1 font-bold ${checks.hasNumber ? 'text-green-500' : 'text-gray-300'}`}>
                <FaCheckCircle /> มีตัวเลข (0-9)
             </div>
          </div>
        </div>

        <div className="space-y-2 text-left">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">ยืนยันรหัสผ่านใหม่</label>
          <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full px-5 py-4 bg-[#F8F9FB] border border-gray-200 rounded-2xl focus:border-[#0052CC] outline-none transition-all"/>
        </div>

        <button 
          disabled={status === 'loading' || !token || !checks.minLength || !checks.hasUpper || !checks.hasNumber} 
          className="w-full bg-[#1E40AF] text-white font-bold py-4.5 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {status === 'loading' ? 'กำลังบันทึกข้อมูล...' : <><FaShieldAlt /> บันทึกรหัสผ่านใหม่</>}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="h-screen w-full flex bg-[#F8F9FB]">
      <div className="hidden lg:flex w-1/2 relative">
        <Image src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2128&auto=format&fit=crop" alt="bg" fill className="object-cover" priority unoptimized />
        <div className="absolute inset-0 bg-slate-900/40"></div>
        <div className="absolute top-10 left-10 z-20">
           <Link href="/login" className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-medium hover:bg-white/20 transition-all group">
             <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> กลับหน้าเข้าสู่ระบบ
           </Link>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Suspense fallback={<div>กำลังโหลด...</div>}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}