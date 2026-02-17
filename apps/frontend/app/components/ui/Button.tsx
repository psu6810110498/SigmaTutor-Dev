import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
    isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary:
        "bg-primary hover:bg-primary-dark text-white",
    secondary:
        "bg-secondary hover:bg-orange-600 text-white",
    outline:
        "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700",
    ghost:
        "bg-transparent hover:bg-gray-100 text-gray-600",
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: "px-4 py-2 text-sm rounded-lg",
    md: "px-6 py-3 rounded-xl",
    lg: "px-8 py-4 text-lg rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "primary",
            size = "md",
            fullWidth = false,
            isLoading = false,
            className = "",
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        return (
            <button
                ref={ref}
                className={`
          font-bold transition-all active:scale-[0.98]
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${disabled || isLoading ? "opacity-70 cursor-not-allowed" : ""}
          ${className}
        `}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        กำลังโหลด...
                    </span>
                ) : (
                    children
                )}
            </button>
        );
    }
);

Button.displayName = "Button";
