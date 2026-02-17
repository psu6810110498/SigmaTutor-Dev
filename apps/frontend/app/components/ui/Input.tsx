"use client";

import { type InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    isPassword?: boolean;
    icon?: React.ReactNode;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, isPassword = false, icon, error, className = "", ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const inputType = isPassword ? (showPassword ? "text" : "password") : props.type || "text";

        return (
            <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                </label>
                <div className="relative">
                    {icon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        type={inputType}
                        className={`
              w-full px-4 py-2.5 rounded-xl border border-gray-300
              focus:border-primary focus:ring-4 focus:ring-primary/10
              outline-none transition-all
              placeholder:text-gray-400 text-gray-800
              ${icon ? "pl-10" : ""}
              ${isPassword ? "pr-10" : ""}
              ${error ? "border-error focus:border-error focus:ring-error/10" : ""}
              ${className}
            `}
                        {...props}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}
                </div>
                {error && (
                    <p className="mt-1 text-sm text-error">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
