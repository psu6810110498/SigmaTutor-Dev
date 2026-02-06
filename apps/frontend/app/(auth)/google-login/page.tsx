"use client";

import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { FiArrowLeft } from 'react-icons/fi'; // ไอคอนสำหรับปุ่มย้อนกลับ
import { useRouter } from 'next/navigation';

export default function MockGoogleLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    
    // เริ่มโหลด (จำลองการ Login)
    setIsLoading(true);
    
    setTimeout(() => {
      // เมื่อโหลดเสร็จ ให้กลับไปหน้าแรก
      router.push('/'); 
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 font-sans text-gray-800">
      
      {/* Container สไตล์ Google Card */}
      <div className="w-full max-w-[448px] p-8 md:p-12 bg-white border border-gray-200 rounded-[28px] shadow-sm md:shadow-none relative">
        
        {/* ปุ่มย้อนกลับ (Back Button) */}
        {!isLoading && (
            <button 
                onClick={() => router.back()} // สั่งให้ Browser ย้อนกลับไปหน้าก่อนหน้า
                className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                title="ย้อนกลับ"
            >
                <FiArrowLeft size={24} />
            </button>
        )}

        {/* Loading State */}
        {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20 space-y-6">
                {/* Google Loading Spinner Simulation */}
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-center">
                    <h2 className="text-xl font-medium text-gray-900">Welcome</h2>
                    <p className="text-gray-600 mt-2 text-sm border border-gray-200 rounded-full px-3 py-1 inline-flex items-center">
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] mr-2 font-bold">S</span>
                        {email || "user@example.com"}
                    </p>
                </div>
             </div>
        ) : (
            <>
                {/* Header */}
                <div className="text-center mb-10 mt-2">
                    <FcGoogle className="text-5xl mx-auto mb-4" />
                    <h1 className="text-2xl font-normal text-gray-900">Sign in</h1>
                    <p className="text-base text-gray-600 mt-2">
                        to continue to <span className="font-semibold text-blue-600">Sigma Tutor</span>
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleNext} className="space-y-8">
                    
                    {/* Email Input with floating label style imitation */}
                    <div className="text-left">
                        <input 
                            type="text" 
                            required
                            className="w-full px-3 py-3.5 rounded border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors text-gray-900 text-base"
                            placeholder="Email or phone"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <div className="mt-2">
                            <a href="#" className="text-blue-600 font-bold text-sm hover:bg-blue-50 px-1 py-0.5 rounded">Forgot email?</a>
                        </div>
                    </div>

                    <div className="text-sm text-gray-600 leading-relaxed">
                        Not your computer? Use Guest mode to sign in privately. <br/>
                        <a href="#" className="text-blue-600 font-bold hover:bg-blue-50 px-1 py-0.5 rounded -ml-1">Learn more</a>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center pt-6">
                        <a href="#" className="text-blue-600 font-bold text-sm hover:bg-blue-50 px-2 py-1 rounded">Create account</a>
                        
                        <button 
                            type="submit" 
                            className="bg-[#0b57d0] hover:bg-[#094bb5] text-white font-medium px-6 py-2.5 rounded-full transition-colors shadow-sm"
                        >
                            Next
                        </button>
                    </div>
                </form>
            </>
        )}

      </div>

      {/* Language Footer (เหมือน Google) */}
      {!isLoading && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4 text-xs text-gray-500">
            <span>English (United States)</span>
            <span>Help</span>
            <span>Privacy</span>
            <span>Terms</span>
        </div>
      )}

    </div>
  );
}