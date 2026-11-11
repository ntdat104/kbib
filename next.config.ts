import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Data comes from Google Sheets (request-time); caching is handled in src/lib/db/cache.
  cacheComponents: false,
  serverExternalPackages: ["google-auth-library"],
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
