import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone 产物供 Docker/Linux 使用（BUILD_STANDALONE=1 时启用）；
  // Windows 本地构建因符号链接权限限制无法产出 standalone，走普通产物 + next start
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "restapi.amap.com" },
      { protocol: "https", hostname: "webapi.amap.com" },
    ],
  },
};

export default nextConfig;
