"use client";

import Link from 'next/link';
import { Search, ShoppingCart } from 'lucide-react';
import Image from 'next/image';

export default function MarketplaceNavbar() {
    return (
        <nav className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Left: Logo */}
                <div className="flex items-center gap-2">
                    <Link href="/" className="text-2xl font-bold text-primary flex items-center gap-2">
                        <span className="text-3xl">Σ</span> Sigma Tutor
                    </Link>
                </div>

                {/* Center: Menu */}
                <div className="hidden md:flex items-center space-x-8">
                    <Link href="/" className="text-gray-600 hover:text-primary font-medium transition-colors">
                        หน้าแรก
                    </Link>
                    <Link href="/explore" className="text-primary font-bold bg-blue-50 px-4 py-1.5 rounded-full transition-colors">
                        รวมคอร์สเรียน
                    </Link>
                    <Link href="/about" className="text-gray-600 hover:text-primary font-medium transition-colors">
                        เกี่ยวกับเรา
                    </Link>
                    <Link href="/contact" className="text-gray-600 hover:text-primary font-medium transition-colors">
                        ติดต่อเรา
                    </Link>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-4">
                    <div className="relative hidden sm:block">
                        <input
                            type="text"
                            placeholder="ค้นหาคอร์ส..."
                            className="pl-9 pr-4 py-2 rounded-full border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm w-40 md:w-64 transition-all"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    </div>

                    <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group">
                        <ShoppingCart className="text-gray-600 group-hover:text-primary" size={20} />
                        <span className="absolute top-0 right-0 bg-secondary text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full animate-bounce-short">
                            2
                        </span>
                    </button>

                    <button className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm hover:ring-2 hover:ring-primary transition-all">
                        {/* Placeholder for user profile */}
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 text-white flex items-center justify-center font-bold text-xs">
                            P
                        </div>
                    </button>
                </div>
            </div>
        </nav>
    );
}
