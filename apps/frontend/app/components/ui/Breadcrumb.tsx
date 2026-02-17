// ============================================================
// Breadcrumb Component
// Usage: <Breadcrumb items={[{ label: 'หน้าหลัก', href: '/' }, ...]} />
// ============================================================

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav className="flex items-center gap-1.5 text-sm mb-6 overflow-x-auto" aria-label="Breadcrumb">
            <Link href="/" className="text-gray-400 hover:text-primary transition-colors flex-shrink-0">
                <Home size={14} />
            </Link>
            {items.map((item, i) => (
                <span key={i} className="flex items-center gap-1.5 flex-shrink-0">
                    <ChevronRight size={12} className="text-gray-300" />
                    {item.href && i < items.length - 1 ? (
                        <Link href={item.href} className="text-gray-500 hover:text-primary transition-colors">
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-gray-900 font-medium truncate max-w-[200px]">{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
