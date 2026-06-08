import type { NextConfig } from "next";

// Replit dev domain for cross-origin iframe support
const replitDomain = process.env.REPLIT_DOMAINS ?? "";
const allowedOrigins = replitDomain
  ? [replitDomain, `*.${replitDomain.split(".").slice(1).join(".")}`]
  : [];

const nextConfig: NextConfig = {
  allowedDevOrigins: [...allowedOrigins, "192.168.1.18", "*.loca.lt", "*.ngrok-free.app"],
  output: 'standalone',

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24 hours
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'inline',
  },

  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  reactStrictMode: true,

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'react-icons/fi',
      'react-icons/lu',
      'date-fns',
      '@react-google-maps/api',
    ],
    optimizeCss: false,
    scrollRestoration: true,
  },
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; media-src 'self' data: blob:; connect-src 'self' https: wss:; frame-ancestors 'none';",
          },
        ],
      },
      // API responses
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
