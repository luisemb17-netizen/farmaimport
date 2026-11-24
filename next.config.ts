import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tailwind v4 se compila con el loader de Turbopack (sin tailwind.config.ts).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Permite next/image con las imágenes públicas de Supabase Storage.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
