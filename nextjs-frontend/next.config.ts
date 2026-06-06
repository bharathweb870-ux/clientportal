import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for easier deployment
  output: "standalone",

  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Reduce build resource usage on limited hosting
  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  // Optional: Disable powered-by header
  poweredByHeader: false,

  // Optional: Compress responses
  compress: true,
};

export default nextConfig;