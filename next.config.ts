// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source:      "/api/proxy/:path*",
        destination: "https://edugenie-api.vercel.app/:path*",
      },
    ];
  },

  images: {
    remotePatterns: [
      //  Cloudinary — للصور الحقيقية
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      //  example.com — placeholder مؤقت في الـ dev
      {
        protocol: "https",
        hostname: "example.com",
      },
    ],
  },
};

export default nextConfig;