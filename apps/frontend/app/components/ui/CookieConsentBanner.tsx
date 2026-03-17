'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';

export function CookieConsentBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('sigma_cookie_consent');
        if (!consent) {
            // Small delay for smooth entrance
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('sigma_cookie_consent', 'accepted');
        setVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('sigma_cookie_consent', 'declined');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div
            className={`fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 transition-all duration-500 ease-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
        >
            <div className="max-w-4xl mx-auto">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-black/10 p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                        <Cookie size={22} className="text-amber-500" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm mb-1">เราใช้คุกกี้ (Cookies) 🍪</p>
                        <p className="text-gray-500 text-xs leading-relaxed">
                            เว็บไซต์นี้ใช้คุกกี้เพื่อพัฒนาประสบการณ์การใช้งานของคุณ ให้เนื้อหาที่เกี่ยวข้อง และวิเคราะห์การใช้งานเว็บไซต์
                            อ่านเพิ่มเติมได้ที่{' '}
                            <Link href="/cookie" className="text-primary underline font-semibold hover:text-primary/80">
                                นโยบายคุกกี้
                            </Link>
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                        <button
                            onClick={handleDecline}
                            className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            ปฏิเสธ
                        </button>
                        <button
                            onClick={handleAccept}
                            className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-sm shadow-primary/20"
                        >
                            ยอมรับทั้งหมด
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
