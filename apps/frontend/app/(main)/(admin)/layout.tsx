'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  ShoppingCart,
  Settings,
  Menu,
  X,
  LogOut,
  Megaphone,
} from 'lucide-react';
import { SigmaLogo } from '@/app/components/icons/SigmaLogo';
import { ToastProvider } from '@/app/components/ui/Toast';
import { useAuth } from '@/app/context/AuthContext';

const sidebarLinks = [
  { href: '/admin', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { href: '/admin/courses', label: 'จัดการคอร์ส', icon: BookOpen },
  { href: '/admin/teachers', label: 'คุณครู', icon: GraduationCap },
  { href: '/admin/students', label: 'นักเรียน', icon: Users },
  { href: '/admin/orders', label: 'คำสั่งซื้อ', icon: ShoppingCart },
  { href: '/admin/marketing', label: 'การตลาด', icon: Megaphone },
  { href: '/admin/settings', label: 'ตั้งค่า', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (user.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Logo */}
          <div className="h-24 flex items-center px-6">
            <SigmaLogo size="md" href="/admin" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden ml-auto text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 space-y-2">
            {sidebarLinks.map((link) => {
              // Check if the current pathname matches or starts with the link href
              // Special case for exact match on /admin
              const isActive =
                link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                  }`}
                >
                  <link.icon size={20} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile (Bottom) */}
          <div className="p-4 mt-auto">
            {/* 🌟 จุดที่ 1: เพิ่ม Link ตรงนี้ เพื่อป้องกันการเด้งผิดหน้า */}
            <Link href="/admin/settings" onClick={() => setSidebarOpen(false)} className="block">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors cursor-pointer group">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || 'Loading...'}</p>
                </div>
              </div>
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-gray-400 hover:text-red-500 text-xs font-medium mt-3 px-2 transition-colors w-full justify-center"
            >
              <LogOut size={14} />
              ออกจากระบบ
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:hidden sticky top-0 z-20">
            <SigmaLogo size="sm" href="/admin" showText={false} />
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
              <Menu size={24} />
            </button>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 lg:p-10">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
