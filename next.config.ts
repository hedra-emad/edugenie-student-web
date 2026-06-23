// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary —
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      // edugenie-api.vercel.app — used for course images
      {
        protocol: "https",
        hostname: "edugenie-api.vercel.app",
        pathname: "/**",
      },
      { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/**" },
      // images.unsplash.com — used for course images
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
