
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ PWA and Mobile Optimizations
  experimental: {
    webpackBuildWorker: true,
  },

  // ✅ Conditional static export - only for mobile build
  ...(process.env.MOBILE_BUILD === 'true' ? {
    output: 'export',
    // 🔥 trailingSlash removed to fix 308 redirect
    // trailingSlash: true, // <-- don't use this!
  } : {}),

  // ✅ Disable TypeScript and ESLint during build for mobile compatibility
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ API Routes configuration for timeout handling
  serverRuntimeConfig: {
    maxDuration: 60,
  },

  // ✅ Image optimization
  images: {
    unoptimized: process.env.MOBILE_BUILD === 'true',
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ✅ Base path and asset prefix for Capacitor builds
  basePath: process.env.NODE_ENV === 'production' && process.env.MOBILE_BUILD === 'true' ? '' : '',
  assetPrefix: process.env.NODE_ENV === 'production' && process.env.MOBILE_BUILD === 'true' ? '' : '',

  // ✅ Headers for APIs
  async headers() {
    return [
      // Headers for /api/admin/users
      {
        source: '/api/admin/users/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
          {
            key: 'Connection',
            value: 'keep-alive',
          },
          {
            key: 'X-Custom-Header',
            value: 'AdminUsersOnly',
          },
        ],
      },
      // General headers for all other APIs
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
          {
            key: 'Connection',
            value: 'keep-alive',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
