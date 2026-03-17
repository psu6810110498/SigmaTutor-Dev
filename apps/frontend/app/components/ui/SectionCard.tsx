
import { LucideIcon } from 'lucide-react';

interface SectionCardProps {
    title: string;
    icon?: LucideIcon;
    children: React.ReactNode;
    className?: string;
    headerAction?: React.ReactNode;
}

export function SectionCard({
    title,
    icon: Icon,
    children,
    className = '',
    headerAction,
}: SectionCardProps) {
    return (
        <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="p-2 bg-blue-50 text-sigma-blue rounded-lg">
                            <Icon size={20} />
                        </div>
                    )}
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                </div>
                {headerAction}
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}
