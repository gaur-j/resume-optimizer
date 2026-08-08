import type { SupabaseClient } from "@supabase/supabase-js";

export interface RateLimitRule {
  action: string;
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitCheck {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Checks and records one request against a rate-limit rule, atomically,
 * via the check_rate_limit() Postgres function in lib/supabase/schema.sql.
 *
 * Deliberately fails OPEN: if the rate-limit check itself errors (e.g. a
 * transient DB hiccup), the request is allowed through rather than
 * blocking real users because of an infra blip. This is a different
 * choice than credits (which fail closed) — losing a rate-limit check
 * occasionally is a minor cost risk; blocking legitimate users because
 * of a rate-limiter outage is a worse trade-off for a product this size.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  rule: RateLimitRule
): Promise<RateLimitCheck> {
  const { data, error } = await supabase
    .rpc("check_rate_limit", {
      p_user_id: userId,
      p_action: rule.action,
      p_max_requests: rule.maxRequests,
      p_window_seconds: rule.windowSeconds,
    })
    .single<{ allowed: boolean; retry_after_seconds: number }>();

  if (error) {
    console.error(`Rate limit check failed for "${rule.action}":`, error);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: data?.allowed ?? true,
    retryAfterSeconds: data?.retry_after_seconds ?? 0,
  };
}

/**
 * Checks a request against several stacked rules (e.g. a tight burst
 * guard + a looser hourly guard). Returns the first rule that fails, or
 * null if every rule passes.
 */
export async function checkRateLimits(
  supabase: SupabaseClient,
  userId: string,
  rules: RateLimitRule[]
): Promise<RateLimitCheck | null> {
  for (const rule of rules) {
    const result = await checkRateLimit(supabase, userId, rule);
    if (!result.allowed) return result;
  }
  return null;
}

/** Rate limit rules for /api/analyze specifically. */
export const ANALYZE_RATE_LIMITS: RateLimitRule[] = [
  { action: "analyze_burst", maxRequests: 3, windowSeconds: 60 },
  { action: "analyze_hourly", maxRequests: 15, windowSeconds: 3600 },
];
