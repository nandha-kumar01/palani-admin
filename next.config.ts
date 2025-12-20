import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Enable Turbopack (IMPORTANT FIX)
  turbopack: {},

  // ✅ Experimental features
  experimental: {
    webpackBuildWorker: true,
    optimizeCss: true,
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      '@mantine/core',
    ],
  },

  // ✅ Server external packages
  serverExternalPackages: ['sharp'],

  // ✅ Performance
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // ✅ Webpack config (ONLY when NOT using Turbopack)
  webpack: (config, { dev, isServer, nextRuntime }) => {
    // 🚫 Turbopack running → skip webpack
    if (nextRuntime === 'edge') return config;

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

  // ✅ Conditional static export
  ...(process.env.MOBILE_BUILD === 'true'
    ? {
        output: 'export',
      }
    : {}),

  // ✅ TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Images
  images: {
    unoptimized: process.env.MOBILE_BUILD === 'true',
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  basePath:
    process.env.NODE_ENV === 'production' &&
    process.env.MOBILE_BUILD === 'true'
      ? ''
      : '',

  assetPrefix:
    process.env.NODE_ENV === 'production' &&
    process.env.MOBILE_BUILD === 'true'
      ? ''
      : '',

  // ✅ Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
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
      {
        source: '/api/admin/users/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
          { key: 'Connection', value: 'keep-alive' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
          { key: 'Connection', value: 'keep-alive' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

export default nextConfig;
