'use client';

import { ArrowLeft, LogIn, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import { useCheckout } from '@/app/hooks/useCheckout';
import { useCourse } from '@/app/context/CourseContext';
import { CartItemCard } from '@/app/components/checkout/CartItemCard';
import { OrderSummary } from '@/app/components/checkout/OrderSummary';
import { RecommendedCourses } from '@/app/components/checkout/RecommendedCourses';

export default function CheckoutPage() {
  const { removeFromCart } = useCourse(); // Needed for remove action
  const {
    cartItems,
    user,
    authLoading,
    totalPrice,
    totalOriginalPrice,
    totalDiscount,
    isLoading,
    error,
    handleCheckout,
    couponCode,
    setCouponCode,
    appliedCoupon,
    isApplyingCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
  } = useCheckout();

  // Empty State
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl transform scale-150"></div>
          <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center text-primary shadow-xl border border-primary/5 relative z-10">
            <ShoppingCart size={56} strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 tracking-tight">ตะกร้าของคุณยังว่างเปล่า</h1>
        <p className="text-gray-500 mb-10 max-w-md leading-relaxed text-lg">
          เริ่มค้นหาคอร์สเรียนที่ใช่ แล้วอัปเกรดทักษะของคุณไปอีกขั้น  มีคอร์สคุณภาพรอคุณอยู่มากมาย
        </p>

        <Link href="/explore">
          <Button size="xl" className="font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
            <ArrowLeft size={18} className="mr-2" />
            เลือกดูคอร์สเรียนทั้งหมด
          </Button>
        </Link>
      </div>
    );
  }

  // Active Cart State
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      {/* Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">ตะกร้าสินค้า <span className="text-primary text-2xl ml-2 font-bold opacity-80">(Shopping Cart)</span></h1>
        <p className="text-lg text-gray-500 mt-2">ตรวจสอบรายการคอร์สเรียนของคุณก่อนชำระเงิน</p>
      </div>

      {/* Login prompt */}
      {!authLoading && !user && (
        <div className="bg-orange-50/50 border border-orange-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-orange-100 p-2.5 rounded-full shrink-0">
              <LogIn size={22} className="text-orange-600" />
            </div>
            <div>
              <p className="text-base font-bold text-orange-900">เข้าสู่ระบบเพื่อดำเนินการต่อ</p>
              <p className="text-sm text-orange-700/80 mt-1 leading-relaxed">
                เนื่องจากคอร์สเรียนจะถูกผูกเข้ากับบัญชีของคุณ กรุณาเข้าสู่ระบบก่อนชำระเงิน
              </p>
            </div>
          </div>
          <Link href="/login" className="w-full sm:w-auto shrink-0">
            <Button size="lg" variant="outline" fullWidth className="border-orange-200 hover:bg-orange-50 hover:text-orange-700">
              เข้าสู่ระบบตอนนี้
            </Button>
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Cart Items — Left Side (7 columns) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-8">

          {/* Main Item List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-xl font-bold text-gray-900">รายการคอร์สเรียน ({cartItems.length})</h2>
            </div>
            {cartItems.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          {/* Continue Shopping Button */}
          <div className="pt-4 pb-10">
            <Link href="/explore">
              <Button variant="ghost" className="text-primary hover:bg-primary/5 font-semibold -ml-4">
                <ArrowLeft size={16} className="mr-2" />
                ต้องการดูคอร์สอื่นอีกไหม? ดูคอร์สแนะนำที่นี่
              </Button>
            </Link>
          </div>
        </div>

        {/* Order Summary — Right Side (5 columns) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <OrderSummary
            itemCount={cartItems.length}
            totalOriginalPrice={totalOriginalPrice}
            totalDiscount={totalDiscount}
            totalPrice={totalPrice}
            isLoading={isLoading}
            isAuthenticated={!!user}
            error={error}
            onCheckout={handleCheckout}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            appliedCoupon={appliedCoupon}
            isApplyingCoupon={isApplyingCoupon}
            couponError={couponError}
            applyCoupon={applyCoupon}
            removeCoupon={removeCoupon}
          />
        </div>
      </div>

      {/* Recommended Courses (Upsell) */}
      <div className="mt-16">
        <RecommendedCourses />
      </div>
    </div>
  );
}
