import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  outputFileTracingExcludes: {
    "/*": ["./data/**", "./.private/**", "./.env", "./.env.local", "./.env.*.local"],
  },
};

export default nextConfig;
