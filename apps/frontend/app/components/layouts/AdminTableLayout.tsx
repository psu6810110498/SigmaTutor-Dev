import React from "react";
import { LucideIcon } from "lucide-react";

interface StatItem {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color?: string;
}

interface AdminTableLayoutProps {
    title: string;
    description?: string;
    icon: LucideIcon;
    stats?: StatItem[];
    actions?: React.ReactNode;
    children: React.ReactNode;
}

export function AdminTableLayout({
    title,
    description,
    icon: Icon,
    stats,
    actions,
    children,
}: AdminTableLayoutProps) {

    // ฟังก์ชันจัดการสีของไอคอนสถิติ
    const getColorStyles = (color?: string) => {
        switch (color) {
            case "blue": return "bg-blue-50 text-blue-600";
            case "green": return "bg-green-50 text-green-600";
            case "red": return "bg-red-50 text-red-600";
            case "yellow": return "bg-yellow-50 text-yellow-600";
            case "purple": return "bg-purple-50 text-purple-600";
            default: return "bg-slate-50 text-slate-600";
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 animate-fade-in-up">
            {/* ── Header Section ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Icon size={24} className="text-primary" /> {title}
                    </h1>
                    {description && (
                        <p className="text-slate-500 text-sm mt-1">{description}</p>
                    )}
                </div>
                {actions && <div>{actions}</div>}
            </div>

            {/* ── Stats Cards Section ── */}
            {stats && stats.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, idx) => {
                        const StatIcon = stat.icon;
                        return (
                            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                                <div className={`p-3 rounded-lg ${getColorStyles(stat.color)}`}>
                                    <StatIcon size={24} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                                        {stat.label}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Main Content (ตารางข้อมูลต่างๆ จะมาโผล่ตรงนี้) ── */}
            <div>
                {children}
            </div>
        </div>
    );
}