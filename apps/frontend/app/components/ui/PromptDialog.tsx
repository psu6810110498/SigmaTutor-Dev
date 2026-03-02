"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Input } from "@/app/components/ui/Input";

interface PromptDialogProps {
    open: boolean;
    title: string;
    message: string;
    expectedText: string;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function PromptDialog({
    open,
    title,
    message,
    expectedText,
    confirmLabel = "ยืนยัน",
    cancelLabel = "ยกเลิก",
    loading = false,
    onConfirm,
    onCancel,
}: PromptDialogProps) {
    const [inputValue, setInputValue] = useState("");

    // Reset input when dialog opens/closes
    useEffect(() => {
        if (open) {
            setInputValue("");
        }
    }, [open]);

    if (!open) return null;

    const isMatch = inputValue === expectedText;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isMatch) {
            onConfirm();
        }
    };

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
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-red-100 text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">{message}</p>

                    <form onSubmit={handleSubmit} className="w-full">
                        <div className="mb-6 text-left">
                            <Input
                                label={`พิมพ์ "${expectedText}" เพื่อยืนยัน`}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={expectedText}
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3 w-full">
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !isMatch}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "กำลังดำเนินการ..." : confirmLabel}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
