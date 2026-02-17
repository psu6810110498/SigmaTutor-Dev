"use client";

// ============================================================
// Confirm Dialog — Modal for destructive actions
// Usage: <ConfirmDialog open={open} onConfirm={handleDelete} ... />
// ============================================================

import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "info";
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const variantStyles = {
    danger: {
        icon: "bg-red-100 text-red-600",
        button: "bg-red-600 hover:bg-red-700 text-white",
    },
    warning: {
        icon: "bg-yellow-100 text-yellow-600",
        button: "bg-yellow-600 hover:bg-yellow-700 text-white",
    },
    info: {
        icon: "bg-blue-100 text-blue-600",
        button: "bg-primary hover:bg-primary-dark text-white",
    },
};

export function ConfirmDialog({
    open,
    title = "ยืนยันการดำเนินการ",
    message,
    confirmLabel = "ยืนยัน",
    cancelLabel = "ยกเลิก",
    variant = "danger",
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!open) return null;

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />

            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${styles.icon}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${styles.button}`}
                        >
                            {loading ? "กำลังดำเนินการ..." : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
