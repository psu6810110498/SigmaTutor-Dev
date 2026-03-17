import Link from 'next/link';
import { SigmaLogo } from '@/app/components/icons/SigmaLogo';

const FOOTER_LINKS = {
  แพลตฟอร์ม: [
    { label: 'รวมคอร์สเรียน', href: '/explore' },
    { label: 'เกี่ยวกับเรา', href: '/about' },
    { label: 'ติดต่อเรา', href: '/contact' },
  ],
  ข้อมูลเพิ่มเติม: [
    { label: 'เงื่อนไขการใช้งาน', href: '/terms' },
    { label: 'นโยบายความเป็นส่วนตัว', href: '/privacy' },
    { label: 'นโยบายคุกกี้', href: '/cookie' },
  ],
};

export function PublicFooter() {
  return (
    <footer className="bg-[#0f1744] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <SigmaLogo showText={false} href="" />
              <span className="font-bold text-xl text-white">Sigma Tutor</span>
            </div>
            <p className="text-blue-200/70 text-sm leading-relaxed max-w-xs">
              แพลตฟอร์มเรียนออนไลน์คุณภาพสูง เพื่อพัฒนาศักยภาพของคุณ
              ด้วยคอร์สเรียนจากอาจารย์ผู้เชี่ยวชาญระดับประเทศ
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-bold text-sm uppercase tracking-wider text-blue-200/50 mb-4">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-blue-200/80 hover:text-white transition-colors text-sm"
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
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-blue-200/50 text-sm">
            © {new Date().getFullYear()} Sigma Tutor Academy. All rights reserved.
          </p>
          <p className="text-blue-200/40 text-xs">Built with ❤️ for Thai students</p>
        </div>
      </div>
    </footer>
  );
}
