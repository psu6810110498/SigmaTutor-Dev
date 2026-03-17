'use client';

import { Button } from '@/app/components/ui/Button';
import { CheckCircle, BookOpen, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useCourse } from '@/app/context/CourseContext';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCourse();
  const [verifyStatus, setVerifyStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  // เรียก verify-session เพื่อยืนยันการชำระเงินและสร้าง enrollment
  useEffect(() => {
    if (!sessionId) {
      setVerifyStatus('error');
      setErrorMessage('ไม่พบหมายเลขอ้างอิงการชำระเงิน');
      return;
    }

    const verifyPayment = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');
        const res = await fetch(`${apiUrl}/payments/verify-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json();
        if (data.success && data.data.enrolled) {
          setVerifyStatus('success');
          clearCart();
        } else if (data.success && !data.data.enrolled) {
          // Payment not yet completed (e.g. PromptPay pending)
          setVerifyStatus('error');
          setErrorMessage('การชำระเงินยังไม่เสร็จสมบูรณ์ กรุณารอสักครู่แล้วรีเฟรชหน้านี้');
        } else {
          setVerifyStatus('error');
          setErrorMessage(data.error || 'ไม่สามารถยืนยันการชำระเงินได้');
        }
      } catch {
        setVerifyStatus('error');
        setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      }
    };

    verifyPayment();
  }, [sessionId]);

  if (verifyStatus === 'loading') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <Loader2 size={48} className="animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">กำลังยืนยันการชำระเงิน...</h2>
        <p className="text-gray-500 text-sm mt-2">กรุณารอสักครู่</p>
      </div>
    );
  }

  if (verifyStatus === 'error') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-8">
          <AlertCircle size={48} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">รอการยืนยัน</h1>
        <p className="text-gray-600 mb-6 max-w-md">{errorMessage}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button size="lg" onClick={() => window.location.reload()}>
            รีเฟรชหน้านี้
          </Button>
          <Link href="/dashboard/my-courses">
            <Button variant="outline" size="lg">
              ไปที่คอร์สของฉัน
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      {/* Success animation */}
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-[bounce_1s_ease-in-out]">
          <CheckCircle size={48} />
        </div>
        <div className="absolute -inset-2 bg-green-100/50 rounded-full animate-ping" />
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-3">ชำระเงินสำเร็จ! 🎉</h1>
      <p className="text-gray-600 mb-2 max-w-md">ขอบคุณที่สมัครเรียนกับ SigmaTutor</p>
      <p className="text-gray-500 text-sm mb-8 max-w-md">
        อีเมลยืนยันการสมัครถูกส่งไปที่อีเมลของคุณแล้ว คุณสามารถเริ่มเรียนได้ทันที
      </p>

      {sessionId && (
        <p className="text-xs text-gray-400 mb-6">หมายเลขอ้างอิง: {sessionId.slice(0, 20)}...</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard/my-courses">
          <Button size="lg">
            <BookOpen size={18} className="mr-2" />
            ไปที่คอร์สเรียนของฉัน
          </Button>
        </Link>
        <Link href="/my-courses">
          <Button variant="outline" size="lg">
            เลือกคอร์สเพิ่มเติม
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
