import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root so the stray ~/package-lock.json is not picked up.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
