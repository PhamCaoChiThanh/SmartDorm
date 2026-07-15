import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: __dirname,
  output: "export",
  images: {
    unoptimized: true, // required for static export if images are used
  },
};

export default nextConfig;
