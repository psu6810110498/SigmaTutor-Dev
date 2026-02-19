'use client';

import { Button } from '@/app/components/ui/Button';
import { XCircle, ArrowLeft, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-8">
        <XCircle size={48} />
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-3">การชำระเงินถูกยกเลิก</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        ไม่มีการเรียกเก็บเงินจากบัญชีของคุณ คุณสามารถกลับไปตะกร้าเพื่อลองใหม่ได้ตลอดเวลา
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/checkout">
          <Button size="lg">
            <ShoppingCart size={18} className="mr-2" />
            กลับหน้าตะกร้า
          </Button>
        </Link>
        <Link href="/courses">
          <Button variant="outline" size="lg">
            <ArrowLeft size={18} className="mr-2" />
            เลือกคอร์สเรียน
          </Button>
        </Link>
      </div>
    </div>
  );
}
