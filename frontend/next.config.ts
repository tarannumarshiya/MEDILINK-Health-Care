import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_PAYMENTS_MODE: process.env.PAYMENTS_MODE ?? "mock",
  },
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 604800,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.supabase.co', port: '', pathname: '/storage/v1/object/public/**' },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.EXPRESS_BACKEND_URL ?? "http://localhost:4000";
    return [
      { source: "/api/:path*", destination: `${backendUrl}/api/:path*` },
      { source: "/health", destination: `${backendUrl}/health` },
    ];
  },
};

export default nextConfig;
