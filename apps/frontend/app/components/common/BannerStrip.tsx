"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { Banner } from '@/app/lib/types';
import Link from 'next/link';
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

const ASPECT_RATIO: Record<BannerVariant, string> = {
    top: 'aspect-[5/1]',
    middle: 'aspect-[6/1]',
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

    const aspectRatio = ASPECT_RATIO[variant];

    return (
        <div className={`w-full overflow-hidden ${className}`}>
            <Swiper
                modules={[Autoplay, Pagination, Navigation]}
                spaceBetween={0}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                loop={banners.length > 1}
                className={`w-full ${aspectRatio}`}
            >
                {banners.map((banner) => (
                    <SwiperSlide key={banner.id}>
                        <Link
                            href={banner.ctaLink || '#'}
                            className="block w-full h-full relative group"
                        >
                            <picture className="w-full h-full block">
                                {/* Mobile image — optional, falls back to desktop */}
                                {banner.imageUrlMobile && (
                                    <source
                                        media="(max-width: 768px)"
                                        srcSet={banner.imageUrlMobile}
                                    />
                                )}
                                <img
                                    src={banner.imageUrl}
                                    alt={banner.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                                />
                            </picture>
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
