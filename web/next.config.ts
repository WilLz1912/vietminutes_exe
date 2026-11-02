import type { NextConfig } from "next";

// Bản demo chạy hoàn toàn phía client (dữ liệu trong localStorage) nên không bật Cache Components / PPR.
const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
