import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse pulls in pdfjs-dist, which dynamically imports its own
  // worker file (pdf.worker.mjs) using a relative path at runtime.
  // Turbopack's bundler moves server code into .next/dev/server/chunks/,
  // which breaks that relative path and causes "Setting up fake worker
  // failed: Cannot find module '.../chunks/pdf.worker.mjs'". Marking
  // these packages external stops Turbopack from rewriting them, so
  // Node resolves the worker file from its real node_modules location.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
  images: {
    unoptimized: false,
    formats: ["image/avif", "image/webp"],
  },
  allowedDevOrigins: ["192.168.209.163", "10.231.124.163"],
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  reactStrictMode: true,
};

export default nextConfig;
