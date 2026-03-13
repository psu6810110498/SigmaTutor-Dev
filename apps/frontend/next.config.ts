// apps/frontend/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: '../..',
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'pub-d0f41a703ea14e2092f9c58b4d489324.r2.dev' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
