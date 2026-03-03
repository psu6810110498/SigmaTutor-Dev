import { Button } from '@/app/components/ui/Button';
import { CreditCard, QrCode, Shield, Info } from 'lucide-react';
import { CouponInput } from './CouponInput';

interface OrderSummaryProps {
    itemCount: number;
    totalOriginalPrice: number;
    totalDiscount: number;
    totalPrice: number;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
    onCheckout: () => void;
    // Coupon Props
    couponCode: string;
    setCouponCode: (code: string) => void;
    appliedCoupon: { code: string; discountAmount: number } | null;
    isApplyingCoupon: boolean;
    couponError: string | null;
    applyCoupon: () => void;
    removeCoupon: () => void;
}

export function OrderSummary({
    itemCount,
    totalOriginalPrice,
    totalDiscount,
    totalPrice,
    isLoading,
    isAuthenticated,
    error,
    onCheckout,
    couponCode,
    setCouponCode,
    appliedCoupon,
    isApplyingCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
}: OrderSummaryProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24 flex flex-col gap-6">
            <h2 className="text-xl font-bold text-gray-900">สรุปคำสั่งซื้อ</h2>

            {/* Breakdown */}
            <div className="space-y-4 mb-6">
                <div className="flex justify-between text-[15px] text-gray-600">
                    <span>ราคาคอร์ส ({itemCount} รายการ)</span>
                    <span className="font-medium text-gray-900">฿{totalOriginalPrice.toLocaleString()}</span>
                </div>

                {totalDiscount > 0 && (
                    <div className="flex justify-between text-[15px]">
                        <span>ส่วนลดโปรโมชันคอร์ส</span>
                        <span className="font-medium text-red-500">-฿{totalDiscount.toLocaleString()}</span>
                    </div>
                )}

                {appliedCoupon && (
                    <div className="flex justify-between text-[15px]">
                        <span className="flex items-center gap-1.5">
                            คูปองส่วนลด <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">{appliedCoupon.code}</span>
                        </span>
                        <span className="font-bold text-green-600">-฿{appliedCoupon.discountAmount.toLocaleString()}</span>
                    </div>
                )}
            </div>

            {/* Coupon Input */}
            <CouponInput
                couponCode={couponCode}
                setCouponCode={setCouponCode}
                appliedCoupon={appliedCoupon}
                isApplyingCoupon={isApplyingCoupon}
                couponError={couponError}
                applyCoupon={applyCoupon}
                removeCoupon={removeCoupon}
                disabled={isLoading || itemCount === 0}
            />

            <div className="border-t border-dashed border-gray-200 pt-5">
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-gray-900 font-bold block">ยอดรวมสุทธิ</span>
                        <span className="text-xs text-gray-500 block mt-1">รวมภาษีมูลค่าเพิ่มแล้ว</span>
                    </div>
                    <span className="text-2xl font-black text-primary">฿{totalPrice.toLocaleString()}</span>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex gap-3 items-start">
                    <Info size={18} className="text-red-600 shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm leading-relaxed">{error}</p>
                </div>
            )}

            {/* Checkout Button */}
            <Button
                fullWidth
                size="xl"
                className="h-14 font-bold text-lg"
                onClick={onCheckout}
                isLoading={isLoading}
                disabled={isLoading || (!isAuthenticated && !error)} // Allow click to show auth error if not authenticated
            >
                {isLoading ? 'กำลังประมวลผล...' : !isAuthenticated ? 'เข้าสู่ระบบเพื่อชำระเงิน' : 'ชำระเงินอย่างปลอดภัย'}
            </Button>

            {/* Payment Methods Info */}
            <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                        ชำระเงินผ่าน
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="bg-[#f0f5ff] text-[#0055ff] text-[10px] font-bold px-2 py-0.5 rounded uppercase">Stripe</span>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <CreditCard size={20} className="text-gray-500" />
                        <span className="text-[11px] text-gray-600 font-semibold">บัตรเครดิต/เดบิต</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <QrCode size={20} className="text-gray-500" />
                        <span className="text-[11px] text-gray-600 font-semibold">PromptPay</span>
                    </div>
                </div>
            </div>

            {/* Security Badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 bg-gray-50/50 py-3 rounded-xl border border-gray-100">
                <Shield size={16} className="text-green-500" />
                <span className="text-xs font-medium text-gray-500">ข้อมูลของคุณถูกเข้ารหัสอย่างปลอดภัย 256-bit</span>
            </div>
        </div>
    );
}
