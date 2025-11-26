import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "fjsydianafcqfufuaoht.supabase.co",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000", "localhost:3001", "localhost:3002", "localhost:3003", "localhost:3004", "localhost:3005", "localhost:3006", "localhost:3007", "localhost:3008", "localhost:3009", "localhost:3010",
        "127.0.0.1:3000", "127.0.0.1:3001", "127.0.0.1:3002", "127.0.0.1:3003", "127.0.0.1:3004", "127.0.0.1:3005", "127.0.0.1:3006", "127.0.0.1:3007", "127.0.0.1:3008", "127.0.0.1:3009", "127.0.0.1:3010"
      ],
    },
  },
};

export default nextConfig;
