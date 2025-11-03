
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ File upload configurations for large files (songs)
  experimental: {
    webpackBuildWorker: true,
    optimizeCss: true,
    optimizePackageImports: ['@mui/material', '@mui/icons-material', '@mantine/core'],
  },

  // ✅ Server external packages (moved from experimental)
  serverExternalPackages: ['sharp'],

  // ✅ Performance optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // ✅ Bundle analyzer for build optimization
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },

  // ✅ Conditional static export - only for mobile build
  ...(process.env.MOBILE_BUILD === 'true' ? {
    output: 'export',
    // 🔥 trailingSlash removed to fix 308 redirect
    // trailingSlash: true, // <-- don't use this!
  } : {}),

  // ✅ Disable TypeScript during build for mobile compatibility
  typescript: {
    ignoreBuildErrors: true,
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

  // ✅ Security and performance headers
  async headers() {
    return [
      // Security headers for all pages
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
      // Headers for /api/admin/users
      {
        source: '/api/admin/users/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
          {
            key: 'Connection',
            value: 'keep-alive',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      // General headers for all other APIs
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
          {
            key: 'Connection',
            value: 'keep-alive',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
