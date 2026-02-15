"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, CheckCircle } from "lucide-react";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";

export default function ResetPasswordPage() {
    const [isComplete, setIsComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsComplete(true);
        }, 1500);
    };

    return (
        <div className="w-full">
            {!isComplete ? (
                <>
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                            <KeyRound size={28} />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">ตั้งรหัสผ่านใหม่</h1>
                        <p className="text-gray-500 text-sm mt-2">
                            กรุณากำหนดรหัสผ่านใหม่ของคุณ เพื่อความปลอดภัยในการใช้งาน
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input label="รหัสผ่านใหม่" placeholder="........" isPassword />
                        <Input label="ยืนยันรหัสผ่านใหม่" placeholder="........" isPassword />
                        <Button type="submit" fullWidth isLoading={isLoading}>
                            ยืนยันการเปลี่ยนรหัสผ่าน
                        </Button>
                    </form>
                </>
            ) : (
                /* Success State */
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-success">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        เปลี่ยนรหัสผ่านสำเร็จ!
                    </h3>
                    <p className="text-gray-500 text-sm mb-6">
                        คุณสามารถใช้รหัสผ่านใหม่เพื่อเข้าสู่ระบบได้ทันที
                    </p>
                    <Link href="/login">
                        <Button fullWidth>ไปที่หน้าเข้าสู่ระบบ</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}