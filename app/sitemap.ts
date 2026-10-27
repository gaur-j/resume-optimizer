// app/sitemap.ts
import type { MetadataRoute } from "next";
import rolesData from "@/data/ats-roles.json";
import industriesData from "@/data/industries-keywords.json";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://getresume-ai.vercel.app";

interface RoleSlug {
  slug: string;
}

interface IndustrySlug {
  slug: string;
}

export default function sitemap(): MetadataRoute.Sitemap {
  // 1. Core static hub pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${APP_URL}/ats-resume`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/resume-keyword`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/ats-friendly-resume-format`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${APP_URL}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${APP_URL}/legal/refund`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // 2. Programmatic ATS Role Checker pages (259 pages)
  const roleRoutes: MetadataRoute.Sitemap = (rolesData as RoleSlug[]).map(
    (role) => ({
      url: `${APP_URL}/ats-resume/${role.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    })
  );

  // 3. Programmatic Industry Keyword pages (282 pages)
  const industryRoutes: MetadataRoute.Sitemap = (
    industriesData as IndustrySlug[]
  ).map((ind) => ({
    url: `${APP_URL}/resume-keyword/${ind.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...roleRoutes, ...industryRoutes];
}
