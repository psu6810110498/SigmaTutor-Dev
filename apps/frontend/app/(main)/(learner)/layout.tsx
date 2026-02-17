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

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    { name: 'แดชบอร์ด', icon: FiGrid, href: '/dashboard' },
    { name: 'ตารางเรียนของฉัน', icon: FiBook, href: '/my-courses' }, // Rename to match context if needed
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
          fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out z-40
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          pt-20 md:pt-0 
        `}
        >
          {/* Added top padding for mobile sidebar to clear navbar */}

          <div className="p-6 h-full flex flex-col">
            {/* User Info Card */}
            <div className="flex flex-col items-center mb-8 pt-4">
              <div className="w-20 h-20 rounded-full mb-3 relative p-1 bg-gradient-to-tr from-blue-400 to-purple-400">
                <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden">
                  <img
                    src={
                      user?.profileImage ||
                      `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              <h3 className="font-bold text-gray-800 text-center truncate w-full">
                {user?.name || 'User'}
              </h3>
              <p className="text-gray-400 text-[10px] text-center truncate w-full">{user?.email}</p>
            </div>

            {/* Navigation Links */}
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
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-primary'
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary'}`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className="pt-6 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-3 text-destructive hover:bg-destructive-light rounded-xl w-full transition-colors text-sm font-medium"
              >
                <FiLogOut className="w-5 h-5 mr-3" />
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
