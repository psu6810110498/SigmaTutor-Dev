"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { Banner } from '@/app/lib/types';
import Link from 'next/link';
import { OptimizedImage } from '@/app/components/ui/OptimizedImage';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * 'top'    → Full-bleed hero strip (Explore Top)  — wider & taller  ~5:1
 * 'middle' → Inline promo strip (Explore Middle)  — standard banner ~6:1
 */
type BannerVariant = 'top' | 'middle';

interface BannerStripProps {
    banners: Banner[];
    variant?: BannerVariant;
    className?: string;
}

// ─── Aspect Ratio per Variant ─────────────────────────────────────────────────

const CONTAINER_CLASSES: Record<BannerVariant, string> = {
    top: 'w-full aspect-[16/9] md:aspect-[16/5]', // Mobile 800x450 (16:9), Desktop 1920x600 (16:5)
    middle: 'hidden md:flex w-full aspect-[6/1] rounded-2xl overflow-hidden', // Hide on mobile, show on tablet+
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * BannerStrip — Swiper-based horizontal banner.
 * Supports EXPLORE_TOP (full bleed) and EXPLORE_MIDDLE (inline).
 *
 * @example
 * // Top banner
 * <BannerStrip banners={topBanners} variant="top" />
 *
 * // Middle promo strip
 * <BannerStrip banners={middleBanners} variant="middle" />
 */
export default function BannerStrip({
    banners,
    variant = 'top',
    className = '',
}: BannerStripProps) {
    // Don't render anything if there are no banners
    if (!banners || banners.length === 0) return null;

    const containerClass = CONTAINER_CLASSES[variant];

    return (
        <div className={`${containerClass} ${className} bg-gray-50 flex items-center justify-center`}>
            <Swiper
                modules={[Autoplay, Pagination, Navigation]}
                spaceBetween={0}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                loop={banners.length > 1}
                className="w-full h-full"
            >
                {banners.map((banner, index) => (
                    <SwiperSlide key={banner.id}>
                        <Link
                            href={banner.ctaLink || '#'}
                            className="block w-full h-full relative group"
                        >
                            {/* Mobile Image */}
                            {banner.imageUrlMobile && (
                                <OptimizedImage
                                    src={banner.imageUrlMobile}
                                    alt={banner.title}
                                    imageClass="A"
                                    priority={index === 0}
                                    className="md:hidden transition-transform duration-500 group-hover:scale-[1.01]"
                                />
                            )}
                            {/* Desktop Image */}
                            <OptimizedImage
                                src={banner.imageUrl}
                                alt={banner.title}
                                imageClass="A"
                                priority={index === 0}
                                className={`transition-transform duration-500 group-hover:scale-[1.01] ${banner.imageUrlMobile ? 'hidden md:block' : 'block'}`}
                            />
                        </Link>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* ── Global Swiper overrides ───────────────────────────────── */}
            <style jsx global>{`
                .swiper-button-next,
                .swiper-button-prev {
                    color: white;
                    width: 36px;
                    height: 36px;
                    background: rgba(0, 0, 0, 0.28);
                    border-radius: 50%;
                    backdrop-filter: blur(4px);
                }
                .swiper-button-next:after,
                .swiper-button-prev:after {
                    font-size: 16px;
                    font-weight: bold;
                }
                .swiper-pagination-bullet {
                    background: white;
                    opacity: 0.7;
                }
                .swiper-pagination-bullet-active {
                    background: var(--color-primary);
                    opacity: 1;
                }
            `}</style>
        </div>
    );
}
