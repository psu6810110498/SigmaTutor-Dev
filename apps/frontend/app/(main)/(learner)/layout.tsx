'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiUser, FiGrid, FiBook, FiLogOut, FiShoppingCart, FiBell, FiMenu } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PublicNavbar } from '@/app/components/layouts/PublicNavbar'; // Import PublicNavbar





export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout, loading } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    { name: 'แดชบอร์ด', icon: FiGrid, href: '/dashboard' },
    { name: 'คอร์สของฉัน', icon: FiBook, href: '/my-courses' },
    { name: 'แผนการเรียน', icon: FiBell, href: '/my-planner' },
    { name: 'ข้อมูลส่วนตัว', icon: FiUser, href: '/profile' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* --- 1. Top Navbar (Replaced with PublicNavbar for consistency) --- */}
      {/* Pass isDashboard={true} to align logo with sidebar */}
      <PublicNavbar onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)} isDashboard={true} />

      {/* Adjusted padding-top to account for PublicNavbar height (h-20 = 80px) */}
      <div className="flex pt-20 flex-1">
        {/* --- 2. Sidebar (Left) --- */}
        <aside
          className={`
          fixed md:static inset-y-0 left-0 w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out z-40
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          pt-20 md:pt-0 
        `}
        >
          <div className="p-8 h-full flex flex-col font-sans">
            {/* --- Profile Section --- */}
            <div className="flex flex-col items-center mb-10 pt-4 text-center">
              {/* Avatar with Glowing Gradient Ring */}
              <div className="relative group mb-4">
                <div className="absolute -inset-1 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-purple-500 to-blue-400">
                  <div className="w-full h-full rounded-full bg-white p-1 overflow-hidden flex items-center justify-center">
                    {imgError ? (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                        {(user?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <img
                        src={
                          user?.profileImage ||
                          `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`
                        }
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full bg-gray-50"
                        referrerPolicy="no-referrer"
                        onError={() => setImgError(true)}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1 w-full px-2">
                <h3 className="font-bold text-gray-900 text-lg line-clamp-1 leading-tight">
                  {user?.name || 'Promtada Pippo'}
                </h3>
                <p className="text-gray-400 text-xs truncate font-medium">
                  {user?.email || 'pippo662006@gmail.com'}
                </p>
              </div>
            </div>

            {/* --- Navigation Menu --- */}
            <nav className="space-y-2 flex-1 py-4">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                      flex items-center px-5 py-3.5 transition-all duration-200 font-semibold text-sm group
                      ${isActive
                        ? 'bg-[#3b82f6] text-white rounded-[12px] shadow-lg shadow-blue-500/30'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600 rounded-[12px]'
                      }
                    `}
                  >
                    <item.icon
                      className={`w-5 h-5 mr-4 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'
                        }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* --- Bottom Section (Logout) --- */}
            <div className="pt-6 mt-6 border-t border-gray-50">
              <button
                onClick={handleLogout}
                className="flex items-center px-5 py-3.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-[12px] w-full transition-all duration-200 text-sm font-semibold group"
              >
                <FiLogOut className="w-5 h-5 mr-4 group-hover:scale-110 transition-transform" />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </aside>

        {/* --- 3. Main Content Area --- */}
        <main className="flex-1 p-4 md:p-8 bg-gray-50 overflow-x-hidden">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}