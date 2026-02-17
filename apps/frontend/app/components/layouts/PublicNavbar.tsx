"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingCart } from "lucide-react";
import { FaRegHeart, FaHeart, FaTimes, FaTrash } from "react-icons/fa";
import { SigmaLogo } from "@/app/components/icons/SigmaLogo";
import { Button } from "@/app/components/ui/Button";
import { useCourse } from "@/app/context/CourseContext";

const NAV_LINKS = [
    { label: "หน้าแรก", href: "/" },
    { label: "รวมคอร์ส", href: "/explore" },
    { label: "เกี่ยวกับเรา", href: "/about" },
    { label: "ติดต่อเรา", href: "/contact" },
];

export function PublicNavbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isWishlistOpen, setIsWishlistOpen] = useState(false);
    const { cartItems, wishlistItems, removeFromCart, removeFromWishlist } = useCourse();

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

    return (
        <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <SigmaLogo />

                    {/* Desktop Links */}
                    <div className="hidden md:flex space-x-8 text-gray-600 font-medium">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="hover:text-primary transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-2">
                        {/* Wishlist */}
                        <div className="hidden md:block relative">
                            <button
                                className="relative p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
                                onClick={() => setIsWishlistOpen(!isWishlistOpen)}
                            >
                                {wishlistItems.length > 0 ? (
                                    <FaHeart size={20} className="text-red-500" />
                                ) : (
                                    <FaRegHeart size={20} />
                                )}
                                {wishlistItems.length > 0 && (
                                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                                        {wishlistItems.length}
                                    </span>
                                )}
                            </button>

                            {/* Wishlist Popover */}
                            {isWishlistOpen && (
                                <div className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in-up">
                                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                        <h3 className="font-bold text-gray-800">คอร์สที่ถูกใจ ({wishlistItems.length})</h3>
                                        <button onClick={() => setIsWishlistOpen(false)} className="text-gray-400 hover:text-gray-600">
                                            <FaTimes />
                                        </button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {wishlistItems.length === 0 ? (
                                            <div className="py-10 text-center text-gray-400">
                                                <FaRegHeart size={24} className="mx-auto mb-2 text-red-300" />
                                                <p className="text-sm">ยังไม่มีคอร์สที่ถูกใจ</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-50">
                                                {wishlistItems.map((item) => (
                                                    <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50">
                                                        <div className="w-12 h-10 bg-gray-100 rounded flex-shrink-0" />
                                                        <div className="flex-grow min-w-0">
                                                            <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                                                            <p className="text-xs text-primary font-bold">฿{item.price.toLocaleString()}</p>
                                                        </div>
                                                        <button onClick={() => removeFromWishlist(item.id)} className="text-gray-300 hover:text-red-500 p-1">
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cart */}
                        <div className="hidden md:block relative">
                            <button
                                className="relative p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors"
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
                                                        <div className="w-12 h-10 bg-gray-100 rounded flex-shrink-0" />
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
                        </div>

                        {/* Divider */}
                        <div className="hidden md:block h-6 w-px bg-gray-200 mx-2" />

                        {/* Auth Buttons */}
                        <div className="hidden md:flex items-center space-x-2">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">เข้าสู่ระบบ</Button>
                            </Link>
                            <Link href="/register">
                                <Button size="sm">ลงทะเบียน</Button>
                            </Link>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
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
                        <div className="border-t border-gray-100 pt-3 mt-3 flex gap-2">
                            <Link href="/login" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button variant="outline" fullWidth size="sm">เข้าสู่ระบบ</Button>
                            </Link>
                            <Link href="/register" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button fullWidth size="sm">ลงทะเบียน</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
