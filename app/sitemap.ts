// app/sitemap.ts
import type { MetadataRoute } from "next";
import rolesData from "@/data/ats-roles.json";
import industriesData from "@/data/industries-keywords.json";
import { INDUSTRY_PATH, ROLE_PATH, isSectorSlug } from "@/lib/seo-routes";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://getresume-ai.vercel.app";

// Search engines compare this date with the last crawl. Stamping every URL
// with "now" (the build time) makes the date change on every deploy even when
// no page changed, and Google learns to ignore it. Bump this ONLY when the
// content of the pages actually changes.
const CONTENT_LAST_MODIFIED = new Date("2026-11-15");

interface Slug {
  slug: string;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = CONTENT_LAST_MODIFIED;

  // 1. Core static pages
  const staticPaths = [
    "",
    ROLE_PATH,
    INDUSTRY_PATH,
    "/ats-friendly-resume-format",
    "/legal/privacy",
    "/legal/terms",
    "/legal/refund",
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${APP_URL}${path}`,
    lastModified,
  }));

  // 2. Programmatic ATS role pages (one page per job role)
  const roleRoutes: MetadataRoute.Sitemap = (rolesData as Slug[]).map(
    (role) => ({
      url: `${APP_URL}${ROLE_PATH}/${role.slug}`,
      lastModified,
    })
  );

  // 3. Industry pages: only the real industry sectors. The other entries in
  //    the data file are job roles and redirect to their role page, so they
  //    must NOT be listed here (see lib/seo-routes.ts).
  const industryRoutes: MetadataRoute.Sitemap = (industriesData as Slug[])
    .filter((industry) => isSectorSlug(industry.slug))
    .map((industry) => ({
      url: `${APP_URL}${INDUSTRY_PATH}/${industry.slug}`,
      lastModified,
    }));

  return [...staticRoutes, ...roleRoutes, ...industryRoutes];
}
