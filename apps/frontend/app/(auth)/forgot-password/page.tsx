"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";

export default function ForgotPasswordPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
        }, 1500);
    };

    return (
        <div className="w-full">
            {!isSubmitted ? (
                <>
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                            <Mail size={28} />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">ลืมรหัสผ่าน?</h1>
                        <p className="text-gray-500 text-sm mt-2">
                            กรอกอีเมลที่ใช้ลงทะเบียน เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้คุณ
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="อีเมล"
                            type="email"
                            placeholder="กรอกอีเมลของคุณ"
                            icon={<Mail size={18} />}
                        />
                        <Button type="submit" fullWidth isLoading={isLoading}>
                            ส่งลิงก์เปลี่ยนรหัสผ่าน
                        </Button>
                    </form>

                    {/* Back to login */}
                    <div className="text-center mt-6">
                        <Link
                            href="/login"
                            className="text-gray-500 hover:text-primary text-sm font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                            <ArrowLeft size={14} /> กลับไปหน้าเข้าสู่ระบบ
                        </Link>
                    </div>
                </>
            ) : (
                /* Success State */
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-success">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">ส่งอีเมลสำเร็จ!</h3>
                    <p className="text-gray-500 text-sm mb-6">
                        กรุณาตรวจสอบอีเมลของคุณและคลิกที่ลิงก์เพื่อตั้งรหัสผ่านใหม่
                    </p>
                    <Link href="/login">
                        <Button fullWidth>กลับไปหน้าเข้าสู่ระบบ</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}