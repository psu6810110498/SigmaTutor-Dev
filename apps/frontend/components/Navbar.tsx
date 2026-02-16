'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiShoppingCart, FiLogOut, FiHeart } from 'react-icons/fi';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
// ✅ 1. แก้ไขพาร์ทการ Import ให้ถูกต้องตามตำแหน่งที่คุณย้าย context เข้าไปใน app
import { useAuth } from '../app/context/AuthContext';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  
  // ✅ 2. ดึงข้อมูล user และฟังก์ชัน logout จากสมองส่วนกลาง
  const { user, logout } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = () => {
    // ✅ 3. เรียกใช้ logout จาก Context เพื่อล้างข้อมูลและกลับหน้า Login
    logout();
  };

  // ซ่อน Navbar ในหน้า Dashboard / Admin / Learner เพื่อไม่ให้ซ้อนกับ Layout ภายใน
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/learner')) {
    return null;
  }

  if (!isMounted) return null; 

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo (คงเดิม) */}
          <Link href="/" className="flex items-center gap-2">
             <div className="relative w-10 h-10">
               <Image 
                 src="/Sigma-logo.png" 
                 alt="Sigma Tutor Logo" 
                 fill
                 className="object-contain"
                 priority
                 onError={(e) => { e.currentTarget.style.display = 'none' }} 
               />
             </div>
             <span className="text-2xl font-bold text-[#1E40AF] tracking-tight">Sigma Tutor</span>
          </Link>

          {/* Menu Links (คงเดิม) */}
          <div className="hidden md:flex space-x-10 text-[15px] font-medium text-gray-700">
            <Link href="/" className={`hover:text-blue-600 transition-colors ${pathname === '/' ? 'text-blue-600' : ''}`}>หน้าแรก</Link>
            <Link href="/courses" className={`hover:text-blue-600 transition-colors ${pathname === '/courses' ? 'text-blue-600' : ''}`}>รวมคอร์ส</Link>
            <Link href="/about" className="hover:text-blue-600 transition-colors">เกี่ยวกับเรา</Link>
            <Link href="/contact" className="hover:text-blue-600 transition-colors">ติดต่อเรา</Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-5">
            
            <button className="text-gray-600 hover:text-red-500 transition-colors relative">
               <FiHeart size={22} className="fill-current text-red-500" />
               <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">1</span>
            </button>
            
            <button className="text-gray-600 hover:text-blue-600 transition-colors relative mr-2">
               <FiShoppingCart size={22} className="text-blue-700" />
               <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">1</span>
            </button>

            {/* ✅ ส่วนแสดงผลเมื่อล็อกอินสำเร็จ (แก้ปัญหาจาก "USER" เป็นชื่อจริง) */}
            {user ? (
              <div className="flex items-center gap-4 pl-5 border-l border-gray-200">
                 <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-100 bg-gray-50">
                      <img 
                        // ✅ ดึงรูปโปรไฟล์จริงจาก Google
                        src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name || 'User'}&background=0D8ABC&color=fff`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-left hidden lg:block">
                        {/* ✅ แสดงชื่อจริงจากบัญชี Google */}
                        <span className="block text-sm font-bold text-gray-800">
                          {user.name || 'พรหมธาดา'}
                        </span>
                        <span className="block text-[11px] text-gray-400 uppercase">
                          {user.role || 'Student'}
                        </span>
                    </div>
                 </Link>
                 
                 <button 
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 transition-all"
                    title="ออกจากระบบ"
                 >
                    <FiLogOut size={20} />
                 </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                <Link 
                  href="/login" 
                  className="px-4 py-2 text-blue-700 font-bold text-[15px] hover:text-blue-800"
                >
                  เข้าสู่ระบบ
                </Link>
                <Link 
                  href="/register" 
                  className="px-6 py-2.5 bg-[#1E40AF] text-white font-bold text-[15px] rounded-lg hover:bg-blue-800 shadow-md transition-all active:scale-95"
                >
                  ลงทะเบียน
                </Link>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </nav>
  );
}