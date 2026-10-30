import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  images: { remotePatterns: [{ hostname: "lh3.googleusercontent.com" }] },
};

export default createNextIntlPlugin()(nextConfig);
