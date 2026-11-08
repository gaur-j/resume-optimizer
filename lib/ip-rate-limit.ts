import crypto from "crypto";
import { resolveClientIp } from "./trusted-proxy-ip";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Database-backed unauthenticated limits: per-IP rules followed by a global
 * cost cap. Raw addresses are HMAC hashed. Limiter failures refuse requests. */
export interface PublicLimit { max: number; windowSeconds: number; }
export interface PublicLimitResult { allowed: boolean; retryAfterSeconds: number; unavailable?: boolean; }

export function getClientIp(request: NextRequest): string {
  return resolveClientIp(request, process.env.RESUME_PROXY_SECRET);
}

function hashIp(ip: string): string {
  return crypto.createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").update(ip).digest("hex").slice(0, 32);
}

async function checkOne(key: string, action: string, limit: PublicLimit): Promise<PublicLimitResult> {
  const { data, error } = await createAdminClient().rpc("check_ip_rate_limit", {
    p_key: key, p_action: `${action}:${limit.windowSeconds}`,
    p_max_requests: limit.max, p_window_seconds: limit.windowSeconds,
  }).single<{ allowed: boolean; retry_after_seconds: number }>();
  if (error || !data) {
    console.error(`Public rate limit check failed for "${action}":`, error);
    return { allowed: false, retryAfterSeconds: 30, unavailable: true };
  }
  return { allowed: data.allowed, retryAfterSeconds: data.retry_after_seconds ?? 0 };
}

export async function checkPublicRateLimit(request: NextRequest, action: string, perIp: PublicLimit[], globalLimit: PublicLimit): Promise<PublicLimitResult> {
  let ip: string;
  try { ip = getClientIp(request); } catch {
    // Refuse forged/expired handoffs before touching counters or scoring.
    return { allowed: false, retryAfterSeconds: 30, unavailable: true };
  }
  const key = hashIp(ip);
  for (const rule of perIp) {
    const result = await checkOne(key, action, rule);
    if (!result.allowed) return result;
  }
  // Only requests passing per-IP rules count toward the global cost cap.
  return checkOne("global", action, globalLimit);
}

export function publicLimitResponse(result: PublicLimitResult, limitedMessage: string) {
  return NextResponse.json({ error: result.unavailable ? "This service is temporarily unavailable. Please try again shortly." : limitedMessage }, {
    status: result.unavailable ? 503 : 429,
    headers: { "Retry-After": String(result.retryAfterSeconds) },
  });
}
