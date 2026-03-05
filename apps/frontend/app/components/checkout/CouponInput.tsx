import { Tag, X, CheckCircle2, Ticket } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';

interface CouponInputProps {
    couponCode: string;
    setCouponCode: (code: string) => void;
    appliedCoupon: { code: string; discountAmount: number } | null;
    isApplyingCoupon: boolean;
    couponError: string | null;
    applyCoupon: () => void;
    removeCoupon: () => void;
    disabled?: boolean;
}

export function CouponInput({
    couponCode,
    setCouponCode,
    appliedCoupon,
    isApplyingCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
    disabled
}: CouponInputProps) {
    return (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all">
            <div className="flex items-center gap-2 mb-1">
                <div className="bg-primary/10 p-1.5 rounded-lg">
                    <Ticket size={16} className="text-primary" />
                </div>
                <h3 className="font-bold text-gray-900">โค้ดส่วนลด</h3>
            </div>

            {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 overflow-hidden border border-green-200 rounded-xl p-3 relative group">
                    {/* Add a subtle highlight animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                    <div className="flex items-center gap-2.5 relative z-10">
                        <CheckCircle2 size={18} className="text-green-600" />
                        <div>
                            <span className="font-bold text-green-800 tracking-wide block leading-tight">{appliedCoupon.code}</span>
                            <span className="text-xs text-green-600 font-medium">ส่วนลดถูกใช้งานแล้ว</span>
                        </div>
                    </div>
                    <button
                        onClick={removeCoupon}
                        disabled={disabled}
                        className="text-green-600 hover:text-red-500 bg-white hover:bg-red-50 p-2 rounded-lg transition-all disabled:opacity-50 border border-green-200 hover:border-red-200 relative z-10 shadow-sm"
                        title="ลบคูปอง"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <div className="flex gap-2 relative">
                    <div className="relative flex-1 group">
                        <Tag size={18} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${couponError ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'}`} />
                        <input
                            type="text"
                            placeholder="กรอกโค้ดส่วนลด"
                            className={`w-full pl-10 pr-4 py-3 rounded-xl border ${couponError ? 'border-red-300 focus:border-red-500 focus:ring-red-100 bg-red-50/30' : 'border-gray-200 focus:border-primary focus:ring-primary/10 bg-gray-50/50 hover:bg-gray-50 focus:bg-white'} outline-none focus:ring-4 transition-all uppercase placeholder:normal-case font-medium text-gray-800`}
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            disabled={disabled || isApplyingCoupon}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') applyCoupon();
                            }}
                        />
                    </div>
                    <Button
                        variant="primary"
                        size="md"
                        onClick={applyCoupon}
                        disabled={disabled || isApplyingCoupon || !couponCode.trim()}
                        isLoading={isApplyingCoupon}
                        className={`rounded-xl px-5 shrink-0 ${couponCode.trim() ? 'shadow-md shadow-primary/20' : ''} transition-all duration-300`}
                    >
                        ใช้งาน
                    </Button>
                </div>
            )}

            <div className="min-h-[20px]">
                {couponError && (
                    <p className="text-sm font-medium text-red-500 animate-[slideIn_0.2s_ease-out]">
                        {couponError}
                    </p>
                )}

                {appliedCoupon && (
                    <p className="text-sm font-bold text-green-600 animate-[slideIn_0.2s_ease-out]">
                        ลดไป ฿{appliedCoupon.discountAmount.toLocaleString()}
                    </p>
                )}
            </div>
        </div>
    );
}
