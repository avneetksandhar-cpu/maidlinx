import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Isolated build output while parallel agents may write to `.next`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/become-a-cleaner",
        destination: "/earn",
        permanent: true,
      },
      {
        source: "/pro/signup",
        destination: "/earn",
        permanent: true,
      },
      {
        source: "/cleaner/signup",
        destination: "/earn",
        permanent: true,
      },
      {
        source: "/pro",
        destination: "/cleaner",
        permanent: true,
      },
      {
        source: "/pro/:path*",
        destination: "/cleaner/:path*",
        permanent: true,
      },
      {
        source: "/api/pro/:path*",
        destination: "/api/cleaner/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
