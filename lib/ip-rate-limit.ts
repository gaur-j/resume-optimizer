import crypto from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Shared (database-backed) rate limiting for UNAUTHENTICATED routes.
 *
 * Why not an in-memory Map: serverless runs many short-lived instances, each
 * with its own memory, so a Map never sees the whole picture and resets on
 * every cold start. Counters here live in Postgres (ip_rate_limits, see
 * migrations/002_public_rate_limits.sql), so every instance shares them.
 *
 * Two layers: per-IP limits, then a GLOBAL cap per action. The global cap is
 * the cost kill-switch: even an attacker rotating through unlimited IPs
 * cannot make the app spend more than that cap per window.
 *
 * Fails CLOSED: if the limiter can't run, the request is refused.
 */

export interface PublicLimit {
  max: number;
  windowSeconds: number;
}

export interface PublicLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  /** true when the limiter itself failed (respond 503, not 429). */
  unavailable?: boolean;
}

/**
 * Best-effort client IP.
 *
 * x-forwarded-for is a comma list where each proxy APPENDS the address it
 * saw. The LEFTMOST entries are whatever the client chose to send (spoofable);
 * the RIGHTMOST entry is the one added by our own edge/proxy. On Vercel the
 * header is overwritten with a single value, so rightmost is also correct
 * there. If you ever put another proxy (e.g. Cloudflare) in front of Vercel,
 * revisit this: every visitor would otherwise share the proxy's IP.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

// Keyed hash so raw IPs (personal data) are never stored.
function hashIp(ip: string): string {
  return crypto
    .createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY ?? "")
    .update(ip)
    .digest("hex")
    .slice(0, 32);
}

async function checkOne(
  key: string,
  action: string,
  limit: PublicLimit
): Promise<PublicLimitResult> {
  const { data, error } = await createAdminClient()
    .rpc("check_ip_rate_limit", {
      p_key: key,
      p_action: `${action}:${limit.windowSeconds}`,
      p_max_requests: limit.max,
      p_window_seconds: limit.windowSeconds,
    })
    .single<{ allowed: boolean; retry_after_seconds: number }>();
  if (error || !data) {
    console.error(`Public rate limit check failed for "${action}":`, error);
    return { allowed: false, retryAfterSeconds: 30, unavailable: true };
  }

  return {
    allowed: data.allowed,
    retryAfterSeconds: data.retry_after_seconds ?? 0,
  };
}

export async function checkPublicRateLimit(
  request: NextRequest,
  action: string,
  perIp: PublicLimit[],
  globalLimit: PublicLimit
): Promise<PublicLimitResult> {
  const key = hashIp(getClientIp(request));

  for (const rule of perIp) {
    const result = await checkOne(key, action, rule);
    if (!result.allowed) return result;
  }

  // Only requests that passed the per-IP checks count toward the global cap,
  // so one noisy IP can't burn the budget for everyone else.
  return checkOne("global", action, globalLimit);
}

/** Standard 429 (limited) / 503 (limiter unavailable) response. */
export function publicLimitResponse(
  result: PublicLimitResult,
  limitedMessage: string
) {
  return NextResponse.json(
    {
      error: result.unavailable
        ? "This service is temporarily unavailable. Please try again shortly."
        : limitedMessage,
    },
    {
      status: result.unavailable ? 503 : 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    }
  );
}
