import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",          // Pages için static export
  images: { unoptimized: true } // Pages static'te şart gibi düşün
};

export default nextConfig;
