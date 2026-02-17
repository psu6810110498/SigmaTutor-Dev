"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function LoginSuccessPage() {
  const router = useRouter();
  const { checkAuth, user } = useAuth();

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
      // User state might not be immediately updated in this scope / render cycle
      // But checkAuth ensures the context is updated.
      // We can check the role in a separate effect or just perform a quick fetch here if needed,
      // but relying on the updated 'user' from context in the dependency array is cleaner.
    };
    verifyAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        if (user.role === 'ADMIN') {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }, 500); // Small delay for UX
      return () => clearTimeout(timer);
    }
  }, [user, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 border-opacity-70 mb-6"></div>
      <h1 className="text-2xl font-bold text-gray-800 animate-pulse">ยืนยันตัวตนสำเร็จ!</h1>
      <p className="text-gray-500 mt-2">กำลังวาร์ปไปหน้า Dashboard...</p>
    </div>
  );
}