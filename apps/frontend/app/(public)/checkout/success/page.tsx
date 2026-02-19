'use client';

import { Button } from '@/app/components/ui/Button';
import { CheckCircle, BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

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
        <Link href="/courses">
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
