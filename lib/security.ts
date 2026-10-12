import crypto from "crypto";

/**
 * Constant-time string comparison for secrets/signatures. A plain `===` / `!==`
 * stops at the first differing byte, which leaks how much of a guess was
 * right through response timing. Lengths are compared first (timingSafeEqual
 * requires equal length); the length of an HMAC-SHA256 hex digest is public.
 */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

/**
 * Validates a post-login redirect target so it can only ever stay on our own
 * origin. Returns a same-origin "path?query#hash" string, or `fallback`.
 *
 * Why the naive `new URL(`${origin}${next}`)` is unsafe: with next="@evil.com"
 * it builds "https://app.example@evil.com", whose HOST is evil.com (everything
 * before "@" is just userinfo). "//evil.com", "/\evil.com" and tab/newline
 * tricks are other classic bypasses, and WHATWG URL parsing treats "\" as "/".
 */
export function safeRedirectPath(
  next: string | null | undefined,
  origin: string,
  fallback = "/dashboard"
): string {
  if (typeof next !== "string" || !next) return fallback;

  // Must be a single-slash, root-relative path.
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;

  // No backslashes or control characters (URL parsers rewrite/strip these).
  if (/[\\\u0000-\u001f\u007f]/.test(next)) return fallback;

  try {
    const url = new URL(next, origin);
    // Final belt-and-braces: whatever the parser made of it must be ours.
    if (url.origin !== origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

const ATTRIBUTION_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;
const ATTRIBUTION_MAX_LEN = 100;

/**
 * Client-supplied marketing attribution is untrusted: keep ONLY the three
 * known keys, as short plain strings, so nothing else (or nothing huge) can
 * be stored in the payments row or forwarded to analytics.
 */
export function sanitizeAttribution(value: unknown): Attribution | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  const source = value as Record<string, unknown>;
  const clean: Attribution = {};

  for (const key of ATTRIBUTION_KEYS) {
    const raw = source[key];
    if (typeof raw !== "string") continue;
    const trimmed = raw
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim()
      .slice(0, ATTRIBUTION_MAX_LEN);
    if (trimmed) clean[key] = trimmed;
  }

  return Object.keys(clean).length > 0 ? clean : null;
}
