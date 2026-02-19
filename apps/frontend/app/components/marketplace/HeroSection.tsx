import Image from 'next/image';

import { Search } from 'lucide-react';

interface HeroSectionProps {
    title: string;
    subtitle: string;
    ctaText: string;
    onCtaClick?: () => void;
}

export default function HeroSection({
    title = "สอบติดคณะในฝัน ไม่ใช่แค่เรื่องบังเอิญ",
    subtitle = "เปลี่ยนความกดดัน เป็นความมั่นใจ ในทุกสนามสอบ กับติวเตอร์ระดับประเทศ",
    ctaText = "เริ่มต้นเส้นทางสอบติด",
    onCtaClick
}: HeroSectionProps) {
    return (
        <section className="relative w-full h-[500px] overflow-hidden group">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/student-hero-bg.jpg"
                    alt="Student with Tablet"
                    fill
                    className="object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
                    priority
                />
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/100 via-blue-800/40 to-transparent z-10" />

            {/* Content Container - Centered */}
            <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center text-white">
                <div className="max-w-2xl text-center md:text-left mx-auto md:mx-0">
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight drop-shadow-md font-sans">
                        {title}
                    </h1>
                    <p className="text-base md:text-xl text-blue-50 mb-6 md:mb-8 max-w-xl drop-shadow font-serif mx-auto md:mx-0">
                        {subtitle}
                    </p>
                    <button
                        onClick={onCtaClick}
                        className="group bg-secondary hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg shadow-orange-500/30 transform transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto md:mx-0 font-sans"
                    >
                        <Search className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        {ctaText}
                    </button>
                </div>
            </div>
        </section>
    );
}
