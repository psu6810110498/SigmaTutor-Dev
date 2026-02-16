"use client";

import { useState } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { SigmaLogo } from "@/app/components/icons/SigmaLogo";

const SectionHeader = ({
  title,
  colorClass,
}: {
  title: string;
  colorClass: string;
}) => (
  <h3 className="text-sm font-bold text-primary flex items-center gap-2 mb-4">
    <span className={`w-1 h-5 ${colorClass} rounded-full`} />
    {title}
  </h3>
);

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="lg:hidden flex justify-center mb-4">
          <SigmaLogo size="lg" href="/" showText={false} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">สมัครสมาชิก</h1>
        <p className="text-gray-500 text-sm mt-1">
          สร้างบัญชีเพื่อเริ่มเรียนรู้และจัดการคอร์สเรียนของคุณ
        </p>
      </div>

      {/* Form */}
      <form className="space-y-8" onSubmit={handleSubmit}>
        {/* 1. Personal Info */}
        <div>
          <SectionHeader title="ข้อมูลส่วนตัว" colorClass="bg-primary" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="ชื่อ - นามสกุล" placeholder="กรอกชื่อและนามสกุล" />
            <Input label="เบอร์โทรศัพท์" placeholder="081-xxx-xxxx" type="tel" />
            <div className="md:col-span-2">
              <Input label="อีเมล" placeholder="name@example.com" type="email" />
            </div>
          </div>
        </div>

        {/* 2. Security */}
        <div>
          <SectionHeader title="ความปลอดภัย" colorClass="bg-purple-500" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="รหัสผ่าน" placeholder="........" isPassword />
            <Input label="ยืนยันรหัสผ่าน" placeholder="........" isPassword />
          </div>
        </div>

        {/* 3. Shipping */}
        <div>
          <SectionHeader title="ข้อมูลการจัดส่ง" colorClass="bg-secondary" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ที่อยู่สำหรับจัดส่งหนังสือ
            </label>
            <textarea
              rows={3}
              placeholder="กรอกที่อยู่สำหรับจัดส่ง..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-gray-400 text-gray-800 resize-none"
            />
          </div>
        </div>

        {/* Terms */}
        <label className="flex items-start space-x-3 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary mt-0.5"
          />
          <span className="text-sm text-gray-600">
            ฉันยอมรับ{" "}
            <Link href="#" className="text-primary hover:underline font-medium">
              เงื่อนไขการใช้งาน
            </Link>{" "}
            และ{" "}
            <Link href="#" className="text-primary hover:underline font-medium">
              นโยบายความเป็นส่วนตัว
            </Link>
          </span>
        </label>

        <Button type="submit" fullWidth isLoading={isLoading}>
          สร้างบัญชี
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
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
          <span>สมัครสมาชิกด้วย Google</span>
        </span>
      </Button>

      {/* Login Link */}
      <div className="text-center mt-6 text-sm text-gray-600">
        มีบัญชีอยู่แล้ว?{" "}
        <Link
          href="/login"
          className="text-primary hover:text-primary-dark font-bold hover:underline"
        >
          เข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}