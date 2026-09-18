import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Product photos are hotlinked from the retailer whose URL was pasted in.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.costco.com" },
      { protocol: "https", hostname: "**.target.com" },
      { protocol: "https", hostname: "**.scene7.com" },
    ],
  },
};

export default nextConfig;
