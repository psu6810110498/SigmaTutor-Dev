"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { Banner, BannerPosition } from '@/app/lib/types';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { BANNER_RATIO } from '@/app/lib/constants';

interface BannerStripProps {
    banners: Banner[];
    position?: BannerPosition; // Optional: purely for debugging or class adjustments
    className?: string;
}

export default function BannerStrip({ banners, className = "" }: BannerStripProps) {
    if (!banners || banners.length === 0) return null;

    return (
        <div className={`w-full bg-white ${className}`}>
            <Swiper
                modules={[Autoplay, Pagination, Navigation]}
                spaceBetween={0}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                }}
                loop={banners.length > 1}
                // Enforce the Strip Aspect Ratio from Constants
                className={`w-full ${BANNER_RATIO.STRIP}`}
            >
                {banners.map((banner) => (
                    <SwiperSlide key={banner.id}>
                        <Link href={banner.ctaLink || '#'} className="block w-full h-full relative group">
                            <picture className="w-full h-full block">
                                {/* Mobile Image (Optional: You might want a different ratio for mobile strip) */}
                                {banner.imageUrlMobile && (
                                    <source media="(max-width: 768px)" srcSet={banner.imageUrlMobile} />
                                )}
                                {/* Desktop Image */}
                                <img
                                    src={banner.imageUrl}
                                    alt={banner.title}
                                    className="w-full h-full object-cover"
                                />
                            </picture>

                            {/* Optional Overlay Text (If needed, can be toggleable) */}
                            {/* 
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" /> 
                            */}
                        </Link>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Custom Swiper Styles */}
            <style jsx global>{`
                .swiper-button-next, .swiper-button-prev {
                    color: white;
                    width: 40px;
                    height: 40px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 50%;
                    backdrop-filter: blur(4px);
                }
                .swiper-button-next:after, .swiper-button-prev:after {
                    font-size: 18px;
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
