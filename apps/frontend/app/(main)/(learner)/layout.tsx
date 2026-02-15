"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Settings } from "lucide-react";
import { PublicNavbar } from "@/app/components/layouts/PublicNavbar";

const sidebarLinks = [
    { href: "/dashboard", label: "หน้าหลัก", icon: Home },
    { href: "/dashboard/my-courses", label: "คอร์สของฉัน", icon: BookOpen },
    { href: "/dashboard/settings", label: "ตั้งค่าโปรไฟล์", icon: Settings },
];

export default function LearnerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-gray-50">
            <PublicNavbar />
            <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <aside className="hidden lg:block w-56 flex-shrink-0">
                        <nav className="bg-white rounded-xl border border-gray-200 p-4 space-y-1 sticky top-28">
                            {sidebarLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                                ? "bg-primary text-white"
                                                : "text-gray-600 hover:bg-gray-100"
                                            }`}
                                    >
                                        <link.icon size={18} />
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Mobile nav */}
                    <div className="lg:hidden flex gap-2 mb-4 w-full overflow-x-auto pb-2">
                        {sidebarLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${isActive
                                            ? "bg-primary text-white"
                                            : "bg-white text-gray-600 border border-gray-200"
                                        }`}
                                >
                                    <link.icon size={16} />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <main className="flex-1 min-w-0">{children}</main>
                </div>
            </div>
        </div>
    );
}
