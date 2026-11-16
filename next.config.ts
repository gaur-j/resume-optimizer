import type { NextConfig } from "next";
import industriesData from "./data/industries-keywords.json";
import {
  INDUSTRY_PATH,
  ROLE_PATH,
  isSectorSlug,
  roleSlugForIndustry,
} from "./lib/seo-routes";

const isDev = process.env.NODE_ENV !== "production";

// The browser talks to Supabase directly (auth), so connect-src must allow it.
function supabaseOrigins(): string[] {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return [url.origin, `wss://${url.host}`];
  } catch {
    return ["https://*.supabase.co", "wss://*.supabase.co"];
  }
}

// Directives that restrict what an attacker could do WITH an injection
// (plugins, <base> hijack, framing, form exfiltration). None of them can
// change how the app itself loads, so they are always enforced.
const CSP_ALWAYS_ENFORCED = [
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
];

// The directives that restrict where scripts / requests / frames may come
// from. These ARE capable of breaking the app (analytics, Razorpay checkout,
// Supabase auth) if an origin is missing, so they ship in Report-Only mode
// first: the browser logs "[Report Only] Refused to ..." in the console but
// blocks nothing. When a full test pass (landing, login, dashboard, a
// Razorpay test payment) is silent, set CSP_ENFORCE=true to enforce them.
//
// 'unsafe-inline' is required today: Next.js emits inline bootstrap scripts
// and the GA init is inline. Removing it needs per-request nonces (a bigger
// change that makes pages dynamic), so it is a known limitation, not an
// oversight. Origin allow-listing still stops loading attacker-hosted code.

const CSP_RESOURCE_RULES = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${
    isDev ? " 'unsafe-eval'" : ""
  } https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com`,
  "style-src 'self' 'unsafe-inline'",
  // https: because OAuth avatars come from the provider's CDN (Google, GitHub...).
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigins().join(
    " "
  )} https://*.razorpay.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com`,
  // Razorpay opens its payment UI (and bank 3-D Secure pages) in frames.
  "frame-src https:",
  "worker-src 'self' blob:",
];

const enforceFullCsp = process.env.CSP_ENFORCE === "true";

// 259 entries in industries-keywords.json are job roles, not industries. They
// have no page of their own: /resume-keyword/<role> (and the older -checker /
// -s URLs) go straight to /ats-resume/<role> in ONE hop. One grouped rule per
// prefix keeps this to a handful of routes instead of hundreds. See
// lib/seo-routes.ts.
const roleEntrySlugs = (industriesData as { slug: string }[])
  .map((entry) => entry.slug)
  .filter((slug) => !isSectorSlug(slug));
const sameSlugRoles = roleEntrySlugs.filter(
  (slug) => roleSlugForIndustry(slug) === slug
);
const renamedRoles = roleEntrySlugs.filter(
  (slug) => roleSlugForIndustry(slug) !== slug
);

// Next.js rejects a redirect `source` longer than 4096 characters, so the
// slug list is split into several grouped rules, each safely below that.
const MAX_SOURCE_CHARS = 3000;

function chunkByLength(items: string[], maxChars: number): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  let length = 0;
  for (const item of items) {
    if (current.length > 0 && length + item.length + 1 > maxChars) {
      chunks.push(current);
      current = [];
      length = 0;
    }
    current.push(item);
    length += item.length + 1;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

const sameSlugRoleGroups = chunkByLength(sameSlugRoles, MAX_SOURCE_CHARS);

function roleEntryRedirects() {
  return [
    INDUSTRY_PATH,
    `${INDUSTRY_PATH}-checker`,
    `${INDUSTRY_PATH}s`,
  ].flatMap((prefix) => [
    ...sameSlugRoleGroups.map((group) => ({
      source: `${prefix}/:slug(${group.join("|")})`,
      destination: `${ROLE_PATH}/:slug`,
      permanent: true,
    })),
    ...renamedRoles.map((slug) => ({
      source: `${prefix}/${slug}`,
      destination: `${ROLE_PATH}/${roleSlugForIndustry(slug)}`,
      permanent: true,
    })),
  ]);
}

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 1. Hub page redirects
      {
        source: "/ats-resume-checker",
        destination: "/ats-resume",
        permanent: true, // HTTP 301
      },
      {
        source: "/resume-keyword-checker",
        destination: "/resume-keyword",
        permanent: true,
      },
      {
        source: "/resume-keywords",
        destination: "/resume-keyword",
        permanent: true,
      },

      // 2. Job-role entries -> role pages (must come BEFORE the wildcards
      //    below so old URLs reach the role page in a single redirect)
      ...roleEntryRedirects(),

      // 3. Wildcard redirects for the renamed URL prefixes
      {
        source: "/ats-resume-checker/:slug*",
        destination: "/ats-resume/:slug*",
        permanent: true,
      },
      {
        source: "/resume-keyword-checker/:slug*",
        destination: "/resume-keyword/:slug*",
        permanent: true,
      },
      {
        source: "/resume-keywords/:slug*",
        destination: "/resume-keyword/:slug*",
        permanent: true,
      },
    ];
  },

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
  // LAN addresses for testing the dev server from a phone/tablet. These used
  // to be hard-coded (and committed); they are machine-specific, so they now
  // come from the environment: DEV_ALLOWED_ORIGINS="192.168.1.20,10.0.0.5"
  allowedDevOrigins: (process.env.DEV_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
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
          // X-XSS-Protection was removed on purpose: the browser feature it
          // controlled is gone, and in old browsers it could itself be abused.
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // Browsers must use HTTPS for this host for a year. Deliberately
            // no includeSubDomains / preload (hard to undo if a subdomain
            // is ever served over plain HTTP).
            key: "Strict-Transport-Security",
            value: "max-age=31536000",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: (enforceFullCsp
              ? [...CSP_ALWAYS_ENFORCED, ...CSP_RESOURCE_RULES]
              : CSP_ALWAYS_ENFORCED
            ).join("; "),
          },
          ...(enforceFullCsp
            ? []
            : [
                {
                  key: "Content-Security-Policy-Report-Only",
                  value: [...CSP_ALWAYS_ENFORCED, ...CSP_RESOURCE_RULES].join(
                    "; "
                  ),
                },
              ]),
        ],
      },
    ];
  },
  reactStrictMode: true,
};

export default nextConfig;
