'use client';

import { useCourse } from '@/app/context/CourseContext';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { ShoppingCart, CreditCard, QrCode, Shield, Trash2, ArrowLeft, LogIn } from 'lucide-react';
import Link from 'next/link';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function CheckoutPage() {
  const { cartItems, removeFromCart, addToCart } = useCourse();
  const { user, loading: authLoading } = useAuth();
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    // Check auth before proceeding
    if (!user) {
      setError('กรุณาเข้าสู่ระบบก่อนชำระเงิน');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

      const response = await fetch(`${apiUrl}/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            courseId: item.id,
            title: item.title,
            price: item.price,
          })),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Redirect to Stripe hosted checkout page
      window.location.href = data.data.checkoutUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      setIsLoading(false);
    }
  };

  // Dev: load real courses from API into cart for testing
  const loadTestCourses = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${apiUrl}/courses?limit=3&status=PUBLISHED`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.data?.courses) {
        for (const c of data.data.courses) {
          addToCart({
            id: c.id,
            title: c.title,
            price: c.price,
            image: c.thumbnail || c.thumbnailSm || '/course-placeholder.jpg',
            category: c.category?.name,
            level: c.level?.name,
            instructor: c.instructor?.name,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load test courses:', err);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6">
          <ShoppingCart size={40} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">ตะกร้าว่างเปล่า</h1>
        <p className="text-gray-500 mb-8 max-w-md">
          คุณยังไม่ได้เพิ่มคอร์สเรียนลงตะกร้า เลือกคอร์สที่สนใจแล้วกลับมาที่นี่
        </p>
        <div className="flex gap-4">
          <Link href="/explore">
            <Button size="lg">
              <ArrowLeft size={18} className="mr-2" />
              เลือกคอร์สเรียน
            </Button>
          </Link>
          <Button size="lg" variant="outline" onClick={loadTestCourses}>
            🧪 เพิ่มคอร์สทดสอบ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/explore"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          กลับไปเลือกคอร์ส
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">ชำระเงิน</h1>
      </div>

      {/* Login prompt */}
      {!authLoading && !user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogIn size={20} className="text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">กรุณาเข้าสู่ระบบก่อนชำระเงิน</p>
              <p className="text-xs text-yellow-600 mt-0.5">
                คุณต้องเข้าสู่ระบบเพื่อดำเนินการชำระเงิน
              </p>
            </div>
          </div>
          <Link href="/login">
            <Button size="sm" variant="outline">
              เข้าสู่ระบบ
            </Button>
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Cart Items — Left Side */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">รายการคอร์ส ({cartItems.length})</h2>

          <div className="space-y-3">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Course thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl">📚</span>
                    </div>
                  )}
                </div>

                {/* Course info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                  {item.instructor && (
                    <p className="text-sm text-gray-500 mt-0.5">{item.instructor}</p>
                  )}
                </div>

                {/* Price + Remove */}
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-bold text-primary text-lg">
                    ฿{item.price.toLocaleString()}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="ลบออกจากตะกร้า"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary — Right Side */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">สรุปคำสั่งซื้อ</h2>

            {/* Breakdown */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>ราคาคอร์ส ({cartItems.length} รายการ)</span>
                <span>฿{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>ส่วนลด</span>
                <span className="text-green-600">฿0</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-6">
              <div className="flex justify-between text-xl font-bold">
                <span>ยอดรวมสุทธิ</span>
                <span className="text-primary">฿{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Checkout Button */}
            <Button
              fullWidth
              size="lg"
              onClick={handleCheckout}
              isLoading={isLoading}
              disabled={isLoading || (!authLoading && !user)}
            >
              {isLoading ? 'กำลังเชื่อมต่อ Stripe...' : !user ? 'กรุณาเข้าสู่ระบบ' : 'ชำระเงิน'}
            </Button>

            {/* Payment Methods Info */}
            <div className="mt-5 space-y-3">
              <p className="text-xs text-gray-500 text-center font-medium uppercase tracking-wider">
                ช่องทางการชำระเงิน
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <CreditCard size={16} className="text-gray-500" />
                  <span className="text-xs text-gray-600 font-medium">บัตรเครดิต/เดบิต</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <QrCode size={16} className="text-gray-500" />
                  <span className="text-xs text-gray-600 font-medium">PromptPay</span>
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-gray-400">
              <Shield size={14} />
              <span className="text-xs">ชำระเงินอย่างปลอดภัยผ่าน Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
