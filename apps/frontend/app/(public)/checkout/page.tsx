"use client";

import { useCourse } from "@/app/context/CourseContext";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { QRCodeSVG } from "qrcode.react"; // Placeholder for QR payment
import { useState } from "react";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
    const { cartItems } = useCourse();
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
    const [step, setStep] = useState<"summary" | "payment" | "success">("summary");

    if (step === "success") {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                    <CheckCircle size={40} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">ชำระเงินสำเร็จ!</h1>
                <p className="text-gray-600 mb-8 max-w-md">
                    ขอบคุณที่สมัครเรียนกับเรา อีเมลยืนยันการสมัครถูกส่งไปที่อีเมลของคุณแล้ว
                </p>
                <Link href="/dashboard/my-courses">
                    <Button size="lg">ไปที่คอร์สเรียนของฉัน</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">ชำระเงิน</h1>

            <div className="grid md:grid-cols-2 gap-12">
                {/* Payment Method / QR */}
                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
                        <h3 className="font-bold text-gray-900 mb-6">สแกน QR Code เพื่อชำระเงิน</h3>
                        <div className="bg-white p-4 inline-block rounded-xl border-2 border-primary/20 mb-4">
                            {/* Placeholder QR - In real app, generate PromptPay payload */}
                            <QRCodeSVG value="https://sigmatutor.com/pay" size={200} />
                        </div>
                        <p className="text-primary font-bold text-2xl mb-2">฿{totalPrice.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">Scan via Mobile Banking App</p>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-xl text-sm text-blue-800">
                        <p className="font-bold mb-2">ขั้นตอนการชำระเงิน:</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>เปิดแอปธนาคารของคุณ</li>
                            <li>เลือกเมนู "สแกนจ่าย"</li>
                            <li>สแกน QR Code ด้านบน</li>
                            <li>กดยืนยันการชำระเงิน และแนบสลิป (ถ้ามีระบบแนบ)</li>
                        </ol>
                    </div>
                </div>

                {/* Order Details & Confirm */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">รายการคอร์ส</h3>
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-gray-600 truncate flex-1 pr-4">{item.title}</span>
                                    <span className="font-medium">฿{item.price.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-gray-100 my-4" />
                        <div className="flex justify-between text-xl font-bold">
                            <span>ยอดรวมสุทธิ</span>
                            <span className="text-primary">฿{totalPrice.toLocaleString()}</span>
                        </div>
                    </div>

                    <Button
                        fullWidth
                        size="lg"
                        onClick={() => setStep("success")}
                    >
                        แจ้งโอนเงิน / ยืนยันการชำระ
                    </Button>
                </div>
            </div>
        </div>
    );
}
