// lib/seo-routes.ts
//
// data/industries-keywords.json has 282 entries, but only 23 of them are real
// industry sectors. The other 259 are job roles that already have a page at
// /ats-resume/<role>. Giving them a second page at /resume-keyword/<role>
// created two near-duplicate URLs for the same search topic, so those 259
// entries are NOT published as pages: they 301-redirect to the role page.
//
// Keep this file free of imports (no JSON): it is used by client components
// and by next.config.ts.

export const INDUSTRY_PATH = "/resume-keyword";
export const ROLE_PATH = "/ats-resume";

// The only slugs that get their own /resume-keyword/<slug> page.
export const SECTOR_SLUGS = [
  "technology",
  "data-ai",
  "design",
  "product",
  "marketing",
  "sales",
  "finance",
  "accounting",
  "healthcare",
  "nursing",
  "pharma-biotech",
  "education",
  "legal",
  "human-resources",
  "operations-supply-chain",
  "manufacturing-engineering",
  "construction",
  "hospitality",
  "retail-ecommerce",
  "government-public-sector",
  "media-entertainment",
  "energy-utilities",
  "customer-support",
] as const;

const SECTOR_SET: ReadonlySet<string> = new Set(SECTOR_SLUGS);

// Industry entries whose slug differs from the matching role slug.
// "SWE" is the software-engineer entry (it was saved with the wrong slug).
const ROLE_SLUG_ALIASES: Readonly<Record<string, string>> = {
  SWE: "software-engineer",
};

export function isSectorSlug(slug: string): boolean {
  return SECTOR_SET.has(slug);
}

/** Role-page slug for an industry entry that is really a job role. */
export function roleSlugForIndustry(slug: string): string {
  return ROLE_SLUG_ALIASES[slug] ?? slug;
}

/** Where an industry entry lives: its own page, or its role page. */
export function industryHref(slug: string): string {
  return isSectorSlug(slug)
    ? `${INDUSTRY_PATH}/${slug}`
    : `${ROLE_PATH}/${roleSlugForIndustry(slug)}`;
}
