import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep it simple for Vercel deployment
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
