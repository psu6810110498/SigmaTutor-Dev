import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com', // อนุญาตให้ดึงรูปจากเว็บนี้
      },
    ],
  },
};

export default nextConfig;