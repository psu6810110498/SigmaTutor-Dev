"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingCart, LogOut } from "lucide-react";
import { FaRegHeart, FaHeart, FaTimes, FaTrash } from "react-icons/fa";
import { SigmaLogo } from "@/app/components/icons/SigmaLogo";
import { Button } from "@/app/components/ui/Button";
import { useCourse } from "@/app/context/CourseContext";
// Import AuthContext to manage user session state in Navbar
import { useAuth } from "@/app/context/AuthContext";

const NAV_LINKS = [
    { label: "หน้าแรก", href: "/" },
    { label: "รวมคอร์ส", href: "/explore" },
    { label: "เกี่ยวกับเรา", href: "/about" },
    { label: "ติดต่อเรา", href: "/contact" },
];

interface PublicNavbarProps {
    onSidebarToggle?: () => void;
    isDashboard?: boolean;
}

export function PublicNavbar({ onSidebarToggle, isDashboard = false }: PublicNavbarProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Auth Integration
    const { user, logout } = useAuth();

    const { cartItems, removeFromCart } = useCourse();

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

    return (
        <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
            {/* Conditional Container: Use max-w-7xl for public pages, w-full for dashboard to align with sidebar */}
            <div className={`${isDashboard ? 'w-full px-4 md:px-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
                <div className="flex justify-between items-center h-20">
                    {/* Left Side: Toggle (Mobile/Dashboard) + Logo */}
                    <div className="flex items-center gap-4">
                        {/* Dashboard Sidebar Toggle (Only visible if onSidebarToggle is provided) */}
                        {onSidebarToggle && (
                            <button
                                onClick={onSidebarToggle}
                                className="md:hidden text-gray-500 hover:text-primary transition-colors"
                            >
                                <Menu size={24} />
                            </button>
                        )}

                        <SigmaLogo />
                    </div>

                    {/* Desktop Links */}
                    <div className="hidden md:flex space-x-8 text-gray-600 font-medium">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="hover:text-primary transition-colors relative group"
                            >
                                {link.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                            </Link>
                        ))}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-3">


                        {/* Cart */}
                        {user && <div className="hidden md:block relative">
                            <button
                                className="relative p-2.5 rounded-full hover:bg-gray-50 text-gray-500 hover:text-primary transition-colors"
                                onClick={() => setIsCartOpen(!isCartOpen)}
                            >
                                <ShoppingCart size={20} />
                                {cartItems.length > 0 && (
                                    <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                                        {cartItems.length}
                                    </span>
                                )}
                            </button>

                            {/* Cart Popover */}
                            {isCartOpen && (
                                <div className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in-up">
                                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                        <h3 className="font-bold text-gray-800">ตะกร้า ({cartItems.length})</h3>
                                        <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-600">
                                            <FaTimes />
                                        </button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {cartItems.length === 0 ? (
                                            <div className="py-10 text-center text-gray-400">
                                                <ShoppingCart size={24} className="mx-auto mb-2" />
                                                <p className="text-sm">ตะกร้าว่าง</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-50">
                                                {cartItems.map((item) => (
                                                    <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                                                        <div className="w-12 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden border border-gray-100">
                                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex-grow min-w-0">
                                                            <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                                                            <p className="text-xs text-primary font-bold">฿{item.price.toLocaleString()}</p>
                                                        </div>
                                                        <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 p-1">
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {cartItems.length > 0 && (
                                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                                            <div className="flex justify-between mb-3 font-bold">
                                                <span>ยอดรวม</span>
                                                <span className="text-primary">฿{totalPrice.toLocaleString()}</span>
                                            </div>
                                            <Link href="/checkout" onClick={() => setIsCartOpen(false)}>
                                                <Button fullWidth>ชำระเงิน</Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>}

                        {/* Divider */}
                        <div className="hidden md:block h-6 w-px bg-gray-200 mx-2" />

                        {/* Auth Buttons or Profile */}
                        {user ? (
                            // Show Profile if Logged In
                            <div className="hidden md:flex items-center gap-3 pl-2">
                                <Link href={user.role === 'ADMIN' ? '/admin' : '/dashboard'} className="flex items-center gap-2 group">
                                    <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 group-hover:border-primary transition-colors">
                                        <img
                                            src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name || 'User'}&background=0D8ABC&color=fff`}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    </div>
                                    <div className="text-left hidden lg:block">
                                        <span className="block text-xs font-bold text-gray-800 group-hover:text-primary truncate max-w-[100px]">
                                            {user.name}
                                        </span>
                                        <span className="block text-[10px] text-gray-400 uppercase tracking-wider">
                                            {user.role}
                                        </span>
                                    </div>
                                </Link>
                                <button
                                    onClick={logout}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    title="ออกจากระบบ"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            // Show Login/Register if Logged Out
                            <div className="hidden md:flex items-center space-x-2">
                                <Link href="/login">
                                    <Button variant="ghost" size="sm">เข้าสู่ระบบ</Button>
                                </Link>
                                <Link href="/register">
                                    <Button size="sm">ลงทะเบียน</Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Toggle (Hide if Dashboard Sidebar is active) */}
                        {!onSidebarToggle && (
                            <button
                                className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 animate-fade-in-up">
                    <div className="px-4 py-4 space-y-1">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary font-medium transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}

                        <div className="border-t border-gray-100 pt-3 mt-3">
                            {user ? (
                                <div className="space-y-2">
                                    <Link href={user.role === 'ADMIN' ? '/admin' : '/dashboard'} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                                            <img
                                                src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name || 'User'}&background=0D8ABC&color=fff`}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        </div>
                                        <span className="font-bold text-gray-800">ไปที่แดชบอร์ด</span>
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg font-medium"
                                    >
                                        <LogOut size={18} /> ออกจากระบบ
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Link href="/login" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button variant="outline" fullWidth size="sm">เข้าสู่ระบบ</Button>
                                    </Link>
                                    <Link href="/register" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                                        <Button fullWidth size="sm">ลงทะเบียน</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
