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
 * Fails CLOSED: if the rate-limit check itself errors, the request is
 * denied. This guards paid LLM calls, so an attacker who can make the
 * limiter error (or a DB outage) must not get unmetered access.
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
    return { allowed: false, retryAfterSeconds: 30 };
  }

  return {
    allowed: data?.allowed ?? false,
    retryAfterSeconds: data?.retry_after_seconds ?? 0,
  };
}

/**
 * Checks a request against several stacked rules (e.g. a tight burst
 * guard  a looser hourly guard). Returns the first rule that fails, or
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
