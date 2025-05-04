import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost', 'files.clerk.dev', 'images.clerk.dev'],
  },
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TS errors for development
  },
  transpilePackages: ['@clerk/nextjs'],
};

export default nextConfig;
