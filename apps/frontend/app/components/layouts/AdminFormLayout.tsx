
'use client';

import Link from 'next/link';
import { Breadcrumb } from '@/app/components/ui/Breadcrumb';
import { Button } from '@/app/components/ui/Button';

interface AdminFormLayoutProps {
    title: string;
    description?: string;
    breadcrumbs: { label: string; href: string }[];
    children: React.ReactNode;
    actions?: React.ReactNode;
    loading?: boolean;
}

export function AdminFormLayout({
    title,
    description,
    breadcrumbs,
    children,
    actions,
    loading = false,
}: AdminFormLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-12 -mt-6 -mx-6 lg:-mt-10 lg:-mx-10">
            {/* Header — Enhanced UX/UI with better visual hierarchy */}
            <div className="sticky top-16 lg:top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
                <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                            <Breadcrumb items={breadcrumbs} className="mb-3" />
                            <div className="flex items-start gap-3">
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                                    {description && (
                                        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                            {actions}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* Mobile Sticky Bottom Bar */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 flex gap-3">
                {actions}
            </div>
        </div>
    );
}
