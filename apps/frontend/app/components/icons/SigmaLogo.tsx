import Image from "next/image";
import Link from "next/link";

interface SigmaLogoProps {
    size?: "sm" | "md" | "lg";
    showText?: boolean;
    href?: string;
    variant?: "default" | "light";
}

const sizeMap = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-20 h-20",
};

export function SigmaLogo({ size = "md", showText = true, href = "/", variant = "default" }: SigmaLogoProps) {
    const textColor = variant === "light" ? "text-white" : "text-primary";

    const content = (
        <div className="flex items-center gap-2">
            <div className={`relative ${sizeMap[size]}`}>
                <Image
                    src="/Sigma-logo.png"
                    alt="Sigma Tutor Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </div>
            {showText && (
                <span className={`font-bold text-xl ${textColor} tracking-wide`}>
                    Sigma Tutor
                </span>
            )}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="flex-shrink-0 hover:opacity-90 transition-opacity">
                {content}
            </Link>
        );
    }

    return content;
}
