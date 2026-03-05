'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { ImageIcon } from 'lucide-react';

export interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt'> {
    src?: string | null;
    alt: string;
    /** Defines the compression/optimization tier for this image */
    imageClass?: 'A' | 'B' | 'C';
    /** Optional custom fallback component (e.g., custom avatar svg) */
    fallback?: React.ReactNode;
}

export function OptimizedImage({
    src,
    alt,
    imageClass = 'B',
    fallback,
    className = '',
    fill = true,
    sizes,
    priority,
    ...props
}: OptimizedImageProps) {
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Default sizing strategies based on the Image Strategy Plan
    let defaultSizes = sizes;
    if (!sizes) {
        if (imageClass === 'A') {
            // Hero / Top Banners: Needs to load sharp on full screens
            defaultSizes = '(max-width: 768px) 100vw, 1920px';
        } else if (imageClass === 'B') {
            // Course Thumbnails: Mostly shown in grids (~300-400px per card)
            defaultSizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
        } else if (imageClass === 'C') {
            // Avatars/Profiles: Tiny icons
            defaultSizes = '100px';
        }
    }

    // Default Fallback UI if not provided
    const FallbackComponent = fallback || (
        <div className={`flex items-center justify-center bg-gray-100 text-gray-300 w-full h-full ${className}`}>
            <ImageIcon className="w-8 h-8 opacity-50" />
        </div>
    );

    if (!src || error) {
        return <>{FallbackComponent}</>;
    }

    return (
        <div className={`relative overflow-hidden w-full h-full ${className}`}>
            {/* Skeleton Loading State */}
            {isLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse z-0 rounded-[inherit]" />
            )}

            <Image
                src={src}
                alt={alt}
                fill={fill}
                sizes={defaultSizes}
                quality={imageClass === 'A' ? 100 : 75} // Maximum fidelity for Hero Banners
                priority={priority || imageClass === 'A'} // Force priority if Hero
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setIsLoading(false)}
                onError={() => setError(true)}
                unoptimized={imageClass === 'A' ? false : undefined} // Ensure NextJS still serves optimized WebP but at 100% quality
                {...props}
            />
        </div>
    );
}
