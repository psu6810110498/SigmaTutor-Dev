"use client";

import { useCourse } from "@/app/context/CourseContext";
import { Button } from "@/app/components/ui/Button";
import { FaTrash } from "react-icons/fa";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function CartPage() {
    const { cartItems, removeFromCart } = useCourse();
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

    if (cartItems.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6">
                    <ShoppingCart size={40} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">ตะกร้าสินค้าว่างเปล่า</h1>
                <p className="text-gray-500 mb-8">คุณยังไม่ได้เลือกคอร์สเรียนใดๆ ลงในตะกร้า</p>
                <Link href="/explore">
                    <Button size="lg">เลือกคอร์สเรียน</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">ตะกร้าสินค้า ({cartItems.length})</h1>

            <div className="grid lg:grid-cols-3 gap-12">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-6">
                    {cartItems.map((item) => (
                        <div key={item.id} className="flex gap-6 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            {/* Thumbnail */}
                            <div className="w-32 h-24 bg-gray-200 rounded-xl flex-shrink-0" />

                            {/* Details */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{item.title}</h3>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{item.instructor}</p>
                                </div>
                                <div className="text-primary font-bold text-lg">฿{item.price.toLocaleString()}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-28">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">สรุปคำสั่งซื้อ</h3>
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-gray-600">
                                <span>ยอดรวม ({cartItems.length} รายการ)</span>
                                <span>฿{totalPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>ส่วนลด</span>
                                <span>-</span>
                            </div>
                            <div className="h-px bg-gray-100 my-4" />
                            <div className="flex justify-between text-xl font-bold text-gray-900">
                                <span>ยอดสุทธิ</span>
                                <span className="text-primary">฿{totalPrice.toLocaleString()}</span>
                            </div>
                        </div>
                        <Link href="/checkout">
                            <Button fullWidth size="lg">ดำเนินการชำระเงิน</Button>
                        </Link>
                        <Link href="/explore">
                            <button className="w-full mt-4 text-sm text-gray-500 hover:text-gray-900 font-medium">
                                เลือกซื้อคอร์สเพิ่มเติม
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
