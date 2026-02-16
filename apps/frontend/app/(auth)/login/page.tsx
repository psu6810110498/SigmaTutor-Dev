"use client";

import { useState } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { SigmaLogo } from "@/app/components/icons/SigmaLogo";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="lg:hidden flex justify-center mb-4">
          <SigmaLogo size="lg" href="/" showText={false} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">เข้าสู่ระบบ</h1>
        <p className="text-gray-500 text-sm mt-1">
          ยินดีต้อนรับกลับ! เข้าสู่ระบบเพื่อเริ่มเรียน
        </p>
      </div>

      {/* Form */}
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input label="อีเมล" type="email" placeholder="กรอกอีเมลของคุณ" />
        <Input label="รหัสผ่าน" placeholder="กรอกรหัสผ่าน" isPassword />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
            />
            <span className="text-gray-600">จดจำฉัน</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-primary hover:text-primary-dark font-medium transition-colors"
          >
            ลืมรหัสผ่าน?
          </Link>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading}>
          เข้าสู่ระบบ
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-400 font-medium">หรือ</span>
        </div>
      </div>

      {/* Google OAuth */}
      <Button variant="outline" fullWidth>
        <span className="flex items-center justify-center gap-3">
          <FcGoogle className="text-2xl" />
          <span>เข้าสู่ระบบด้วย Google</span>
        </span>
      </Button>

      {/* Register Link */}
      <div className="text-center mt-8 text-sm text-gray-600">
        ยังไม่มีบัญชี?{" "}
        <Link
          href="/register"
          className="text-primary hover:text-primary-dark font-bold hover:underline"
        >
          สมัครสมาชิก
        </Link>
      </div>
    </div>
  );
}