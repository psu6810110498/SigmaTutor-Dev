"use client";

import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi'; // เพิ่ม FiArrowLeft
import Image from 'next/image';
import Link from 'next/link';

// Component ย่อย
const SectionHeader = ({ title, colorClass }: { title: string, colorClass: string }) => (
  <h3 className="text-sm font-bold text-primary flex items-center gap-2 mb-4">
    <span className={`w-1 h-5 ${colorClass} rounded-full`}></span>
    {title}
  </h3>
);

interface FormInputProps {
  label: string;
  placeholder: string;
  type?: string;
  isPassword?: boolean;
}

const FormInput = ({ label, placeholder, type = "text", isPassword = false }: FormInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input 
          type={inputType}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-serif placeholder:text-gray-400 text-gray-800"
        />
        {isPassword && (
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50/50 relative overflow-hidden font-sans py-10">
      
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

      {/* Main Card */}
      <div className="bg-surface p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-2xl relative z-10 border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/login" className="inline-block mb-4 hover:opacity-80 transition-opacity">
             <div className="relative w-20 h-20 mx-auto">
               <Image src="/Sigma-logo.png" alt="Sigma Tutor Logo" fill className="object-contain" />
             </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 font-sans">สมัครสมาชิก</h1>
          <p className="text-gray-500 text-sm mt-1 font-serif">สร้างบัญชีเพื่อเริ่มเรียนรู้และจัดการคอร์สเรียนของคุณ</p>
        </div>

        {/* Form */}
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          
          {/* 1. ข้อมูลส่วนตัว */}
          <div>
            <SectionHeader title="ข้อมูลส่วนตัว" colorClass="bg-primary" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput label="ชื่อ - นามสกุล" placeholder="กรอกชื่อและนามสกุล" />
              <FormInput label="เบอร์โทรศัพท์" placeholder="081-xxx-xxxx" type="tel" />
              <div className="md:col-span-2">
                <FormInput label="อีเมล" placeholder="name@example.com" type="email" />
              </div>
            </div>
          </div>

          {/* 2. ความปลอดภัย */}
          <div>
            <SectionHeader title="ความปลอดภัย" colorClass="bg-purple-500" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput label="รหัสผ่าน" placeholder="........" isPassword={true} />
              <FormInput label="ยืนยันรหัสผ่าน" placeholder="........" isPassword={true} />
            </div>
          </div>

          {/* 3. ข้อมูลการจัดส่ง */}
          <div>
            <SectionHeader title="ข้อมูลการจัดส่ง" colorClass="bg-secondary" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ที่อยู่สำหรับจัดส่งหนังสือ</label>
              <textarea 
                rows={3}
                placeholder="บ้านเลขที่, ถนน, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์..." 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-serif placeholder:text-gray-400 resize-none"
              ></textarea>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start space-x-3 pt-2">
            <input type="checkbox" id="terms" className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer" />
            <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer select-none">
              ฉันยอมรับ <a href="#" className="text-primary font-medium hover:underline">เงื่อนไขการใช้งาน</a> และ <a href="#" className="text-primary font-medium hover:underline">นโยบายความเป็นส่วนตัว</a>
            </label>
          </div>

          {/* Buttons */}
          <div className="space-y-4 pt-2">
            <button type="submit" className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-[0.98]">
              สมัครสมาชิก
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-surface text-gray-400 font-medium">หรือ</span></div>
            </div>

            {/* Google Login */}
            <Link href="/google-login" className="block w-full">
              <button type="button" className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors flex items-center justify-center space-x-3 group">
                <FcGoogle className="text-2xl group-hover:scale-110 transition-transform" />
                <span>สมัครด้วย Google</span>
              </button>
            </Link>
          </div>

        </form>

        <div className="text-center mt-8 text-sm text-gray-600">
          มีบัญชีแล้ว? <Link href="/login" className="text-primary hover:text-blue-700 font-bold ml-1 hover:underline">เข้าสู่ระบบ</Link>
        </div>
      </div>

      <div className="absolute bottom-4 text-center text-xs text-gray-400 w-full font-serif opacity-60">
        © 2024 Sigma Tutor Academy. All rights reserved.
      </div>
    </div>
  );
}