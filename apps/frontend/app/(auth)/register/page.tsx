'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { FaArrowLeft, FaCheckCircle, FaExclamationCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc'; // Use FcGoogle for standard colored logo

// --- Password Strength Component (Cleaned up) ---
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  if (!password) return null;

  const criteria = [
    { id: 1, label: '8+ ตัวอักษร', regex: /.{8,}/ },
    { id: 2, label: 'ตัวใหญ่ (A-Z)', regex: /[A-Z]/ },
    { id: 3, label: 'ตัวเล็ก (a-z)', regex: /[a-z]/ },
    { id: 4, label: 'ตัวเลข (0-9)', regex: /[0-9]/ },
  ];

  const passedCount = criteria.reduce((acc, curr) => acc + (curr.regex.test(password) ? 1 : 0), 0);

  let strengthColor = 'bg-destructive';
  let strengthText = 'อ่อนมาก';
  if (passedCount >= 3) {
    strengthColor = 'bg-warning';
    strengthText = 'ปานกลาง';
  }
  if (passedCount === 4) {
    strengthColor = 'bg-success';
    strengthText = 'แข็งแกร่ง';
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${strengthColor}`}
          style={{ width: `${(passedCount / 4) * 100}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {criteria.map((item) => (
          <span
            key={item.id}
            className={`text-[10px] flex items-center gap-1 ${item.regex.test(password) ? 'text-success font-medium' : 'text-gray-400'}`}
          >
            {item.regex.test(password) ? (
              <FaCheckCircle size={10} />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full border border-gray-300" />
            )}
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm({
    mode: 'onChange', // Real-time validation
  });

  const password = watch('password', '');

  const onSubmit = async (data: any) => {
    setServerError('');

    // Manual confirm password check
    if (data.password !== data.confirmPassword) {
      setServerError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api') + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || 'สมัครสมาชิกไม่สำเร็จ');
      }

      // Success
      router.push('/login?registered=true');
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden font-sans bg-[#F8F9FB]">
      {/* 📚 Left Side: Library Cover (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-gray-900 h-full">
        <Image
          src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2128&auto=format&fit=crop"
          alt="Library Cover"
          fill
          className="object-cover opacity-60"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <Link
          href="/"
          className="absolute top-10 left-10 z-20 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-medium hover:bg-white/20 transition-all"
        >
          <FaArrowLeft className="text-xs" /> กลับหน้าหลัก
        </Link>
        <div className="absolute bottom-24 left-16 right-16 z-10 text-white">
          <div className="w-16 h-1.5 bg-primary mb-8 rounded-full"></div>
          <h1 className="text-6xl font-extrabold mb-6 leading-tight tracking-tighter shadow-sm">
            ปลดล็อกศักยภาพ <br /> <span className="text-primary-light">ไร้ขีดจำกัด</span>
          </h1>
          <p className="text-lg text-gray-300 font-light leading-relaxed max-w-lg">
            "การเรียนรู้ที่ดีที่สุด คือการเรียนรู้ที่เข้าใจ ไม่ใช่การท่องจำ" <br />
            เริ่มต้นเส้นทางความสำเร็จของคุณที่นี่กับ Sigma Tutor
          </p>
        </div>
      </div>

      {/* ⚪ Right Side: Registration Form */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto bg-[#F8F9FB] relative">
        <div className="min-h-full flex items-center justify-center p-6 py-12">
          {/* Mobile Back Button */}
          <div className="lg:hidden absolute top-6 left-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors text-sm font-medium"
            >
              <FaArrowLeft /> กลับหน้าหลัก
            </Link>
          </div>

          <div className="max-w-[480px] w-full bg-white rounded-[40px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] p-10 md:p-14 border border-gray-100/50 relative z-10">
            <div className="text-center mb-8">
              <div className="relative w-14 h-14 mx-auto mb-4 bg-primary-light p-3 rounded-2xl flex items-center justify-center border border-primary-light">
                <Image
                  src="/Sigma-logo.png"
                  alt="Logo"
                  width={40}
                  height={40}
                  unoptimized
                  className="object-contain"
                />
              </div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">สร้างบัญชีใหม่</h2>
              <p className="text-gray-400 text-sm mt-2">กรอกข้อมูลเพื่อเริ่มต้นการเรียนรู้</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                  ชื่อ-นามสกุล <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="สมชาย ใจดี"
                  {...register('name', {
                    required: 'กรุณากรอกชื่อ-นามสกุล',
                    minLength: { value: 2, message: 'ชื่อต้องยาวกว่า 2 ตัวอักษร' },
                  })}
                  className={`w-full px-5 py-3.5 bg-[#F8F9FB] border rounded-2xl outline-none transition-all text-sm font-medium
                    ${errors.name ? 'border-destructive/30 focus:border-destructive focus:ring-4 focus:ring-destructive/10' : 'border-gray-200/80 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10'}`}
                />
                {errors.name && (
                  <p className="text-destructive text-xs ml-1 flex items-center gap-1">
                    <FaExclamationCircle /> {errors.name.message as string}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                  อีเมล <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  {...register('email', {
                    required: 'กรุณากรอกอีเมล',
                    pattern: { value: /^\S+@\S+$/i, message: 'รูปแบบอีเมลไม่ถูกต้อง' },
                  })}
                  className={`w-full px-5 py-3.5 bg-[#F8F9FB] border rounded-2xl outline-none transition-all text-sm font-medium
                    ${errors.email ? 'border-destructive/30 focus:border-destructive focus:ring-4 focus:ring-destructive/10' : 'border-gray-200/80 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10'}`}
                />
                {errors.email && (
                  <p className="text-destructive text-xs ml-1 flex items-center gap-1">
                    <FaExclamationCircle /> {errors.email.message as string}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                  รหัสผ่าน <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password', {
                      required: 'กรุณากรอกรหัสผ่าน',
                      minLength: { value: 8, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' },
                    })}
                    className={`w-full px-5 py-3.5 bg-[#F8F9FB] border rounded-2xl outline-none transition-all text-sm font-medium pr-12
                      ${errors.password ? 'border-destructive/30 focus:border-destructive focus:ring-4 focus:ring-destructive/10' : 'border-gray-200/80 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-xs ml-1 flex items-center gap-1">
                    <FaExclamationCircle /> {errors.password.message as string}
                  </p>
                )}

                {/* Password Strength */}
                <PasswordStrengthIndicator password={password} />
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                  ยืนยันรหัสผ่าน <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('confirmPassword', {
                      required: 'กรุณายืนยันรหัสผ่าน',
                      validate: (val: string) => {
                        if (watch('password') != val) {
                          return 'รหัสผ่านไม่ตรงกัน';
                        }
                      },
                    })}
                    className={`w-full px-5 py-3.5 bg-[#F8F9FB] border rounded-2xl outline-none transition-all text-sm font-medium pr-12
                      ${errors.confirmPassword ? 'border-destructive/30 focus:border-destructive focus:ring-4 focus:ring-destructive/10' : 'border-gray-200/80 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-destructive text-xs ml-1 flex items-center gap-1">
                    <FaExclamationCircle /> {errors.confirmPassword.message as string}
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 pt-1 px-1">
                <input
                  type="checkbox"
                  id="agree"
                  {...register('agreeTerms', { required: true })}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label
                  htmlFor="agree"
                  className="text-xs text-gray-500 leading-relaxed cursor-pointer select-none"
                >
                  ฉันยอมรับ{' '}
                  <span className="text-primary font-bold hover:underline">เงื่อนไขการใช้งาน</span>{' '}
                  และ{' '}
                  <span className="text-primary font-bold hover:underline">
                    นโยบายความเป็นส่วนตัว
                  </span>
                </label>
              </div>

              {/* Server Error Message */}
              {serverError && (
                <div className="text-destructive text-xs bg-destructive-light p-3 rounded-xl border border-destructive-light flex items-center gap-2 animate-pulse">
                  <FaExclamationCircle /> {serverError}
                </div>
              )}

              {/* Submit Button */}
              <button
                disabled={!isValid || isSubmitting}
                className={`w-full font-bold py-4 rounded-2xl shadow-xl transition-all text-sm
                  ${
                    !isValid || isSubmitting
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-primary text-white shadow-primary/20 active:scale-[0.98] hover:bg-primary-hover'
                  }`}
              >
                {isSubmitting ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก'}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink mx-4 text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                  หรือสมัครด้วย
                </span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>

              {/* Google Button (Standard Style) */}
              <button
                type="button"
                onClick={() => (window.location.href = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api') + '/auth/google')}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium text-gray-700 active:scale-[0.98] shadow-sm"
              >
                <FcGoogle className="text-xl" /> สมัครสมาชิกด้วย Google
              </button>

              <p className="text-center mt-6 text-sm text-gray-500 font-medium">
                มีบัญชีอยู่แล้ว?{' '}
                <Link
                  href="/login"
                  className="text-primary font-bold hover:text-primary-dark hover:underline transition-all"
                >
                  เข้าสู่ระบบที่นี่
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
