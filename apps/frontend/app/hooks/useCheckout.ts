import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useCourse } from '@/app/context/CourseContext';
import { useAuth } from '@/app/context/AuthContext';
import { couponApi } from '@/app/lib/api';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export function useCheckout() {
    const { cartItems } = useCourse();
    const { user, loading: authLoading } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{
        id: string;
        code: string;
        discountAmount: number;
    } | null>(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);

    const [finalTotalPrice, setFinalTotalPrice] = useState<number>(0);
    const [finalTotalDiscount, setFinalTotalDiscount] = useState<number>(0);

    // Effect to recalculate totals when cart or coupon changes
    useState(() => {
        // Initial setup
    });

    // We can't use useEffect purely because we want to update the returned values synchronously, 
    // so we just calculate on render
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
    const totalOriginalPrice = cartItems.reduce((sum, item) => sum + (item.originalPrice || item.price), 0);
    const baseDiscount = totalOriginalPrice - totalPrice;

    const netDiscount = baseDiscount + (appliedCoupon?.discountAmount || 0);
    const finalTotal = Math.max(0, totalPrice - (appliedCoupon?.discountAmount || 0));

    const applyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('กรุณากรอกรหัสคูปอง');
            return;
        }

        if (cartItems.length === 0) {
            setCouponError('ตระกร้าสินค้าว่างเปล่า');
            return;
        }

        setIsApplyingCoupon(true);
        setCouponError(null);

        try {
            const data = await couponApi.validate(couponCode, cartItems.map(item => item.id));

            if (!data.success) {
                throw new Error(data.error || 'คูปองไม่ถูกต้อง');
            }

            setAppliedCoupon({
                id: data.data.couponId,
                code: data.data.code,
                discountAmount: data.data.discountAmount,
            });
            setCouponCode('');
        } catch (err) {
            setCouponError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการตรวจสอบคูปอง');
            setAppliedCoupon(null);
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError(null);
    };

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
                    couponCode: appliedCoupon?.code,
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

    return {
        cartItems,
        user,
        authLoading,
        totalPrice: finalTotal,
        totalOriginalPrice,
        totalDiscount: netDiscount,
        couponDiscount: appliedCoupon?.discountAmount || 0,
        isLoading,
        error,
        handleCheckout,
        // Coupon exports
        couponCode,
        setCouponCode,
        appliedCoupon,
        isApplyingCoupon,
        couponError,
        applyCoupon,
        removeCoupon,
    };
}
