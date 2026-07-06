import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app. Stray package-lock.json files in parent
  // dirs (C:\Users\emadh, Desktop) otherwise make Turbopack infer the wrong root.
  turbopack: { root: __dirname },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
        pathname: "/**",
      },
      {
        // Google account avatars (OAuth sign-in profile photos)
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "edugenie-api.vercel.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;