"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import { MdLockReset } from 'react-icons/md';

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // จำลองว่าเปลี่ยนรหัสสำเร็จ
    setIsComplete(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50/50 relative overflow-hidden font-sans py-10">
      
      {/* Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      {/* Main Card */}
      <div className="bg-surface p-8 rounded-2xl shadow-xl w-full max-w-md relative z-10 border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                <MdLockReset size={32} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">ตั้งรหัสผ่านใหม่</h1>
            <p className="text-gray-500 text-sm mt-2">
                กรุณากำหนดรหัสผ่านใหม่ของคุณ เพื่อความปลอดภัยในการใช้งาน
            </p>
        </div>

        {!isComplete ? (
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสผ่านใหม่</label>
                    <div className="relative">
                        <input 
                            type={showPassword ? "text" : "password"}
                            placeholder="........" 
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-serif placeholder:text-gray-400"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
                    <div className="relative">
                        <input 
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="........" 
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-serif placeholder:text-gray-400"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                            {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                    </div>
                </div>

                <button type="submit" className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-[0.98] mt-2">
                    ยืนยันการเปลี่ยนรหัสผ่าน
                </button>
            </form>
        ) : (
            // Success State
            <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 animate-bounce">
                    <FiCheckCircle size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">เปลี่ยนรหัสผ่านสำเร็จ!</h3>
                <p className="text-gray-500 text-sm mb-6">
                    คุณสามารถใช้รหัสผ่านใหม่เพื่อเข้าสู่ระบบได้ทันที
                </p>
                <Link href="/login" className="block w-full bg-primary hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md">
                    ไปที่หน้าเข้าสู่ระบบ
                </Link>
            </div>
        )}
      </div>

       {/* Footer Text */}
       <div className="absolute bottom-6 text-center text-xs text-gray-400 w-full font-serif opacity-60">
        © 2024 Sigma Tutor Academy. All rights reserved.
      </div>
    </div>
  );
}