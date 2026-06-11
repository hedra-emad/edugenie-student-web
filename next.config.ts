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
      // Cloudinary — صور الكورسات / الأفاتار
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // الـ API نفسه لو بيرجع صور مرفوعة محليًا عليه
      {
        protocol: "https",
        hostname: "edugenie-api.vercel.app",
        pathname: "/**",
      },
      // أي صور placeholder بتيجي من unsplash (شائعة في mock data)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  // images: {
  //   remotePatterns: [
  //     //  Cloudinary — used for course images
  //     {
  //       protocol: "https",
  //       hostname: "res.cloudinary.com",
  //     },
  //     //  example.com — placeholder for development
  //     {
  //       protocol: "https",
  //       hostname: "example.com",
  //     },
  //   ],
  // },
};

export default nextConfig;