'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiUser, FiGrid, FiBook, FiLogOut, FiShoppingCart, FiBell, FiMenu } from 'react-icons/fi';
import { useEffect, useState } from 'react';
// ✅ 1. นำเข้า useAuth จากสมองส่วนกลาง (เช็คพาร์ทให้ถูกตามโครงสร้างโฟลเดอร์)
import { useAuth } from '../../context/AuthContext';

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // ✅ 2. เปลี่ยนมาใช้ข้อมูลจาก useAuth แทนการใช้ useState/useEffect แยกเอง
  const { user, logout, loading } = useAuth();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ✅ 3. ฟังก์ชัน Logout ให้เรียกใช้จาก Context เพื่อความปลอดภัย
  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    { name: 'แดชบอร์ด', icon: FiGrid, href: '/dashboard' },
    { name: 'คอร์สของฉัน', icon: FiBook, href: '/my-courses' },
    { name: 'ข้อมูลส่วนตัว', icon: FiUser, href: '/profile' },
  ];

  // ✅ 4. ระหว่างที่ระบบกำลังเช็ค Token ให้แสดงหน้า Loading กัน "Guest User" เด้ง
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      
      {/* --- 1. Top Navbar (Fixed) --- */}
      <nav className="fixed top-0 left-0 right-0 bg-white h-16 border-b border-gray-200 px-4 md:px-8 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-4">
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-gray-600">
             <FiMenu size={24} />
           </button>
           <Link href="/dashboard" className="flex items-center gap-2 group">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg group-hover:bg-blue-700 transition-colors">Σ</div>
             <span className="text-xl font-bold text-blue-600 tracking-tight">Sigma Tutor</span>
           </Link>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-600">
           <Link href="/dashboard" className={`hover:text-blue-600 transition-colors ${pathname === '/dashboard' ? 'text-blue-600 font-bold' : ''}`}>หน้าแรก</Link>
           <Link href="/courses" className="hover:text-blue-600 transition-colors">รวมคอร์ส</Link>
           <Link href="/about" className="hover:text-blue-600 transition-colors">เกี่ยวกับเรา</Link>
           <Link href="/contact" className="hover:text-blue-600 transition-colors">ติดต่อเรา</Link>
        </div>

        <div className="flex items-center space-x-3 md:space-x-4">
           <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors relative">
             <FiBell size={20} />
             <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
           </button>
           
           {/* Profile ใน Navbar - ✅ แสดงรูปจาก Google */}
           <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-gray-200 cursor-pointer">
             <img 
                src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=0D8ABC&color=fff`} 
                alt="Profile" 
                className="w-full h-full object-cover"
             />
           </div>
        </div>
      </nav>

      <div className="flex pt-16 flex-1">
        {/* --- 2. Sidebar (Left) --- */}
        <aside className={`
          fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out z-40
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          pt-16 md:pt-0
        `}>
          <div className="p-6 h-full flex flex-col">
            {/* User Info Card - ✅ แก้ไขให้แสดงชื่อจริง */}
            <div className="flex flex-col items-center mb-8 pt-4">
               <div className="w-20 h-20 rounded-full mb-3 relative p-1 bg-gradient-to-tr from-blue-400 to-purple-400">
                 <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden">
                    <img 
                        src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-full"
                    />
                 </div>
               </div>
               {/* ✅ แสดงชื่อจาก Google และ Email ป้องกัน undefined */}
               <h3 className="font-bold text-gray-800 text-center truncate w-full">
                {user?.name || 'พรหมธาดา'}
               </h3>
               <p className="text-gray-400 text-[10px] text-center truncate w-full">{user?.email}</p>
            </div>

            {/* Navigation Links (คงเดิม) */}
            <nav className="space-y-1 flex-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-xl transition-all font-medium text-sm group ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className="pt-6 border-t border-gray-100">
               <button 
                onClick={handleLogout}
                className="flex items-center px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl w-full transition-colors text-sm font-medium"
               >
                 <FiLogOut className="w-5 h-5 mr-3" />
                 ออกจากระบบ
               </button>
            </div>
          </div>
        </aside>

        {/* --- 3. Main Content Area --- */}
        <main className="flex-1 p-4 md:p-8 bg-gray-50 overflow-x-hidden">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}