"use client";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { Banner } from '@/app/lib/types';
import Link from 'next/link';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface BannerSliderProps {
    banners: Banner[];
}

export default function BannerSlider({ banners }: BannerSliderProps) {
    if (!banners || banners.length === 0) return null;

    return (
        <div className="w-full bg-white">
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
                className="w-full aspect-[4/5] md:aspect-[3/1] lg:aspect-[3.5/1] max-h-[600px]"
            >
                {banners.map((banner) => (
                    <SwiperSlide key={banner.id}>
                        <Link href={banner.ctaLink || '#'} className="block w-full h-full relative group">
                            <picture className="w-full h-full block">
                                {/* Mobile Image */}
                                {banner.imageUrlMobile && (
                                    <source media="(max-width: 768px)" srcSet={banner.imageUrlMobile} />
                                )}
                                {/* Desktop Image (Fallback) */}
                                <img
                                    src={banner.imageUrl}
                                    alt={banner.title}
                                    className="w-full h-full object-cover"
                                />
                            </picture>
                        </Link>
                    </SwiperSlide>
                ))}
            </Swiper>

            <style jsx global>{`
                .swiper-button-next, .swiper-button-prev {
                    color: white;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.3);
                }
                .swiper-pagination-bullet-active {
                    background: white;
                }
            `}</style>
        </div>
    );
}
