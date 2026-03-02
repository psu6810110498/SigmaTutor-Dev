"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket, MonitorPlay } from "lucide-react";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const tabs = [
        {
            name: "คูปองส่วนลด",
            href: "/admin/marketing/coupons",
            icon: Ticket,
        },
        {
            name: "แบนเนอร์ประกาศ",
            href: "/admin/marketing/banners",
            icon: MonitorPlay,
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">การตลาด (Marketing)</h1>
                <p className="text-gray-500 mt-2">จัดการโปรโมชัน คูปองส่วนลด และป้ายประกาศบนเว็บไซต์</p>
            </div>

            <div className="flex gap-2 border-b border-gray-200">
                {tabs.map((tab) => {
                    const isActive = pathname.startsWith(tab.href);
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold border-b-2 transition-colors ${isActive
                                    ? "border-primary text-primary"
                                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.name}
                        </Link>
                    );
                })}
            </div>

            <div className="pt-2">
                {children}
            </div>
        </div>
    );
}
