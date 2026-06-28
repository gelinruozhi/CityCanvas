import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "restapi.amap.com" },
      { protocol: "https", hostname: "webapi.amap.com" },
    ],
  },
};

export default nextConfig;
