"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
// เอา FaFacebookF ออกจากการ import
import { FaArrowLeft, FaCheckCircle, FaExclamationCircle, FaEye, FaEyeSlash, FaCamera, FaGoogle } from 'react-icons/fa';

// --- ส่วนแสดงความแข็งแกร่งของรหัสผ่าน (คงเดิม) ---
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const criteria = [
    { id: 1, label: "อย่างน้อย 8 ตัวอักษร", regex: /.{8,}/ },
    { id: 2, label: "มีตัวพิมพ์ใหญ่ (A-Z)", regex: /[A-Z]/ },
    { id: 3, label: "มีตัวพิมพ์เล็ก (a-z)", regex: /[a-z]/ },
    { id: 4, label: "มีตัวเลข (0-9)", regex: /[0-9]/ },
  ];

  const passedCount = criteria.reduce((acc, curr) => acc + (curr.regex.test(password) ? 1 : 0), 0);
  let strengthColor = "bg-gray-200";
  let strengthText = "";
  
  if (password) {
    if (passedCount <= 2) { strengthColor = "bg-red-400"; strengthText = "อ่อน"; }
    else if (passedCount === 3) { strengthColor = "bg-amber-400"; strengthText = "ปานกลาง"; }
    else { strengthColor = "bg-green-400"; strengthText = "แข็งแกร่ง"; }
  }

  return (
    <div className="mt-3 p-4 bg-violet-50/50 rounded-2xl border border-violet-100/50 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold text-violet-800 uppercase tracking-wider">ความปลอดภัยของรหัสผ่าน</span>
        {password && <span className={`text-[9px] font-black text-white px-2 py-0.5 rounded-full ${strengthColor}`}>{strengthText}</span>}
      </div>
      <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-violet-100">
        <div className={`h-full transition-all duration-500 ${strengthColor}`} style={{ width: `${(passedCount / 4) * 100}%` }}></div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1">
        {criteria.map((item) => {
          const isPassed = item.regex.test(password);
          return (
            <div key={item.id} className={`flex items-center gap-1.5 text-[10px] font-medium ${isPassed ? "text-violet-700" : "text-gray-400"}`}>
              <FaCheckCircle className={isPassed ? "text-green-500" : "text-gray-200"} size={12} />
              {item.label}
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default function RegisterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', agreeTerms: false });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return alert("รหัสผ่านไม่ตรงกัน");
    if (!formData.agreeTerms) return alert("กรุณายอมรับเงื่อนไขการใช้งาน");

    setStatus('loading');
    try {
      const res = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
      });
      if (!res.ok) throw new Error('สมัครสมาชิกไม่สำเร็จ');
      setStatus('success');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden font-sans bg-[#F8F9FB]">
      
      {/* 📚 ฝั่งซ้าย: รูปปกห้องสมุดแบบดั้งเดิม (คงเดิม) */}
      <div className="hidden lg:flex w-1/2 relative bg-gray-900 h-full">
        <Image 
          src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2128&auto=format&fit=crop" 
          alt="Library Cover" fill className="object-cover opacity-60" priority unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <Link href="/" className="absolute top-10 left-10 z-20 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-medium hover:bg-white/20 transition-all">
          <FaArrowLeft className="text-xs" /> กลับหน้าหลัก
        </Link>
        <div className="absolute bottom-24 left-16 right-16 z-10 text-white">
          <div className="w-16 h-1.5 bg-blue-500 mb-8 rounded-full"></div>
          <h1 className="text-6xl font-extrabold mb-6 leading-tight tracking-tighter shadow-sm">
            ปลดล็อกศักยภาพ <br /> <span className="text-blue-300">ไร้ขีดจำกัด</span>
          </h1>
          <p className="text-lg text-gray-300 font-light leading-relaxed max-w-lg">
            "การเรียนรู้ที่ดีที่สุด คือการเรียนรู้ที่เข้าใจ ไม่ใช่การท่องจำ" <br/>
            เริ่มต้นเส้นทางความสำเร็จของคุณที่นี่กับ Sigma Tutor
          </p>
        </div>
      </div>

      {/* ⚪ ฝั่งขวา: ฟอร์มสมัครสมาชิก (คงเดิม) */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto bg-[#F8F9FB] relative">
        <div className="min-h-full flex items-center justify-center p-6 py-12">
          <div className="max-w-[500px] w-full bg-white rounded-[48px] shadow-2xl p-10 md:p-12 border border-gray-100/50 relative z-10">
            
            <div className="text-center mb-8">
                <div className="relative w-14 h-14 mx-auto mb-4 bg-blue-50 p-3 rounded-2xl flex items-center justify-center">
                    <Image src="/Sigma-logo.png" alt="Logo" width={40} height={40} unoptimized />
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">สร้างบัญชีใหม่</h2>
                <p className="text-gray-400 text-sm mt-2">กรอกข้อมูลด้านล่างเพื่อสมัครสมาชิก</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* ✅ อัปโหลดรูปโปรไฟล์ (คงเดิม) */}
              <div className="flex flex-col items-center mb-6 space-y-2">
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                <div onClick={() => fileInputRef.current?.click()} className="relative w-24 h-24 rounded-full bg-gray-50 border-4 border-white shadow-lg cursor-pointer overflow-hidden group">
                  {imagePreview ? <Image src={imagePreview} alt="Preview" fill className="object-cover" /> : <div className="flex h-full w-full items-center justify-center text-gray-300 bg-gray-50"><FaCamera size={30} /></div>}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">เปลี่ยนรูป</div>
                </div>
                <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">อัปโหลดรูปโปรไฟล์ (ถ้ามี)</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">ชื่อ-นามสกุล</label>
                <input type="text" name="name" required placeholder="สมชาย ใจดี" onChange={handleChange} className="w-full px-5 py-3.5 bg-[#F8F9FB] border border-gray-200/80 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">อีเมล</label>
                <input type="email" name="email" required placeholder="name@example.com" onChange={handleChange} className="w-full px-5 py-3.5 bg-[#F8F9FB] border border-gray-200/80 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold" />
              </div>

              {/* ✅ รหัสผ่านพร้อมลูกตา (คงเดิม) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">รหัสผ่าน</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password" required placeholder="••••••••" onChange={handleChange} className="w-full px-5 py-3.5 bg-[#F8F9FB] border border-gray-200/80 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold pr-12" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-blue-500 transition-colors">{showPassword ? <FaEyeSlash /> : <FaEye />}</button>
                </div>
                <PasswordStrengthIndicator password={formData.password} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">ยืนยันรหัสผ่าน</label>
                <div className="relative">
                  <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" required placeholder="••••••••" onChange={handleChange} className="w-full px-5 py-3.5 bg-[#F8F9FB] border border-gray-200/80 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold pr-12" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-blue-500 transition-colors">{showConfirmPassword ? <FaEyeSlash /> : <FaEye />}</button>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-1 px-1">
                <input type="checkbox" name="agreeTerms" id="agree" onChange={handleChange} className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="agree" className="text-xs text-gray-500 leading-relaxed">
                    ฉันยอมรับ <span className="text-blue-600 font-bold hover:underline">เงื่อนไขการใช้งาน</span> และ <span className="text-blue-600 font-bold hover:underline">นโยบายความเป็นส่วนตัว</span>
                </label>
              </div>

              {status === 'error' && <div className="text-red-500 text-xs bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">⚠️ {message}</div>}
              {status === 'success' && <div className="text-green-600 text-xs bg-green-50 p-3 rounded-xl border border-green-100 flex items-center gap-2">✅ สมัครสมาชิกสำเร็จ! กำลังพาไปหน้า Login...</div>}

              <button disabled={status === 'loading'} className="w-full bg-[#0052CC] text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-sm">
                {status === 'loading' ? 'กำลังบันทึกข้อมูล...' : 'สมัครสมาชิก'}
              </button>

              {/* ✅ แก้ไข: เอา Facebook ออก และปรับ Google ให้เต็มความกว้าง */}
              <div className="mt-4">
                <button 
                  type="button" 
                  onClick={() => window.location.href = 'http://localhost:4000/api/auth/google'}
                  // เพิ่ม w-full เพื่อให้ปุ่มขยายเต็ม
                  className="w-full flex items-center justify-center gap-2 py-3 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all text-xs font-bold text-gray-600 active:scale-95"
                >
                    <FaGoogle className="text-red-500" /> Google
                </button>
                {/* ปุ่ม Facebook ถูกลบออกไปแล้ว */}
              </div>

              <p className="text-center mt-8 text-sm text-gray-500 font-medium">
                มีบัญชีอยู่แล้ว? <Link href="/login" className="text-blue-600 font-bold hover:underline">เข้าสู่ระบบที่นี่</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}