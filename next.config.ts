import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: '/video-converter.html',
        destination: '/video-converter.html',
      },
    ];
  },
};

export default nextConfig;