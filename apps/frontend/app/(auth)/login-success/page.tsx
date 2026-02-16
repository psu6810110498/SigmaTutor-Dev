"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext'; 

function LoginSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const accessToken = searchParams.get('accessToken');
  const refreshToken = searchParams.get('refreshToken');

  useEffect(() => {
    const handleLoginSuccess = async () => {
      console.log("เริ่มกระบวนการ Login Success..."); // เช็คจุดเริ่มต้น
      
      if (accessToken && refreshToken) {
        try {
          console.log("กำลังดึง Profile จาก Backend...");
          const res = await fetch('http://localhost:4000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          const responseData = await res.json();
          console.log("ข้อมูลที่ได้จาก /me:", responseData);

          if (res.ok) {
            const userData = responseData.data || responseData; // รองรับทั้งมี .data และไม่มี
            login(accessToken, userData);
            console.log("บันทึกลง Context สำเร็จ! กำลังวาร์ป...");
            router.push('/dashboard');
          } else {
            throw new Error("ดึงข้อมูลไม่สำเร็จ");
          }
        } catch (error) {
          console.error("เกิดข้อผิดพลาด:", error);
          router.push('/login');
        }
      }
    };

    handleLoginSuccess();
  }, [accessToken, refreshToken, login, router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FB]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">ยืนยันตัวตนสำเร็จ!</h2>
        <p className="text-gray-500 mt-2 font-medium">กำลังวาร์ปไปหน้า Dashboard...</p>
      </div>
    </div>
  );
}

export default function LoginSuccessPage() {
  return (
    <Suspense fallback={<div>กำลังโหลด...</div>}>
      <LoginSuccessContent />
    </Suspense>
  );
}