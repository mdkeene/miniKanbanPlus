import type { NextConfig } from "next";

const isGithubActions = process.env.GH_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubActions ? "/miniKanbanPlus" : "",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    unoptimized: true
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
  },
  trailingSlash: true,
};

export default nextConfig;
