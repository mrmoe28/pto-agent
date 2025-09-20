import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Next.js 15 experimental features for performance
  experimental: {
    dynamicIO: true,  // Enable dynamic IO for better caching control
  },

  // External packages for server components
  serverExternalPackages: ['@neondatabase/serverless'],

  // Fix lockfile warning
  outputFileTracingRoot: __dirname,

  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Enable compression
  compress: true,

  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
