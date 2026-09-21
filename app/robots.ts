import type { MetadataRoute } from "next";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://getresume-ai.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Kept in sync with the noindex metadata on these route groups
      // (app/dashboard/layout.tsx, app/auth/layout.tsx) - disallowing the
      // crawl here saves crawl budget; the metadata is what actually
      // keeps already-linked URLs out of the index.
      disallow: ["/dashboard", "/auth", "/api"],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
