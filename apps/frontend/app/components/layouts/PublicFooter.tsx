import Link from "next/link";
import { SigmaLogo } from "@/app/components/icons/SigmaLogo";

const FOOTER_LINKS = {
    Platform: [
        { label: "Explore courses", href: "/explore" },
        { label: "Become Instructor", href: "#" },
        { label: "Success story", href: "#" },
    ],
    Company: [
        { label: "About us", href: "/about" },
        { label: "Our Instructors", href: "#" },
        { label: "Contact", href: "/contact" },
    ],
    Legal: [
        { label: "Term of Use", href: "#" },
        { label: "Privacy Policy", href: "#" },
        { label: "Cookie Policy", href: "#" },
    ],
};

export function PublicFooter() {
    return (
        <footer className="bg-primary text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <SigmaLogo showText={false} href="" />
                            <span className="font-bold text-xl text-white">Sigma Tutor</span>
                        </div>
                        <p className="text-blue-100 text-sm leading-relaxed">
                            แพลตฟอร์มเรียนออนไลน์คุณภาพสูง เพื่อพัฒนาศักยภาพของคุณ
                            ด้วยคอร์สเรียนจากอาจารย์ผู้เชี่ยวชาญระดับประเทศ
                        </p>
                    </div>

                    {/* Links */}
                    {Object.entries(FOOTER_LINKS).map(([category, links]) => (
                        <div key={category}>
                            <h3 className="font-bold text-lg mb-4">{category}</h3>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-blue-100 hover:text-white transition-colors text-sm"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="border-t border-blue-400/30 mt-10 pt-6 text-center text-blue-200 text-sm">
                    © {new Date().getFullYear()} Sigma Tutor Academy. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
