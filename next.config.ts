import type { NextConfig } from "next";

const extraImageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      // PRD: Aliyun OSS / CDN — set NEXT_PUBLIC_IMAGE_HOSTS=assets.example.com,*.oss-cn-hangzhou.aliyuncs.com (exact hostnames only)
      {
        protocol: "https",
        hostname: "assets.heywaii.com",
        pathname: "/**",
      },
      ...extraImageHosts.map((hostname) => ({
        protocol: "https" as const,
        hostname,
        pathname: "/**",
      })),
    ],
  },
};

export default nextConfig;
