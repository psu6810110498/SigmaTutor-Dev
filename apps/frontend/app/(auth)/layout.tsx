import Image from "next/image";
import { SigmaLogo } from "@/app/components/icons/SigmaLogo";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Left — Image + Quote (hidden on mobile) */}
            <div className="hidden lg:flex flex-col justify-center items-center bg-primary text-white p-12 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-md text-center">
                    <div className="relative w-64 h-48 mx-auto mb-8 opacity-90">
                        <Image
                            src="/Sigma-logo.png"
                            alt="Sigma Tutor"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">
                        อัปเกรดคะแนนให้พุ่ง
                    </h2>
                    <p className="text-blue-100 text-lg leading-relaxed">
                        ด้วยเทคนิคระดับท็อป จากผู้สอนมืออาชีพระดับประเทศ
                    </p>
                </div>
            </div>

            {/* Right — Auth Form */}
            <div className="flex items-center justify-center p-6 md:p-12 bg-white relative">
                {/* Mobile logo (only shown when left panel is hidden) */}
                <div className="absolute top-6 left-6 lg:hidden">
                    <SigmaLogo size="sm" href="/" />
                </div>

                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </div>
    );
}
