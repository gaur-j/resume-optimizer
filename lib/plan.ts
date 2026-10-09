/**
 * Free vs. paid gating lives here, in ONE place, so the API route and the
 * dashboard UI can never drift out of sync on what each tier unlocks.
 *
 * Tiers are driven by users.total_paid_scans — a lifetime counter of how
 * many scan credits a user has ever purchased (NOT their current balance).
 * That's deliberate: it rewards conversion rather than re-gating a customer
 * who already paid once and is now spending down free credits again.
 *
 *   total_paid_scans === 0   → Free tier      → 3 visible suggestions
 *   total_paid_scans 1-4     → Single plan    → 5 visible suggestions
 *   total_paid_scans >= 5    → Pack plan      → 8 visible suggestions
 *
 * These thresholds intentionally mirror the credit sizes sold in
 * BuyCreditsModal.tsx (1-credit "single" and 5-credit "pack" purchases).
 * If you ever change pricing tiers, update PLAN_TIERS below — nowhere else.
 */

export interface PlanTier {
  name: "free" | "single" | "pack";
  minTotalPaidScans: number;
  suggestionLimit: number;
}

// Ordered highest threshold first so `find()` below matches the best tier.
const PLAN_TIERS: PlanTier[] = [
  { name: "pack", minTotalPaidScans: 5, suggestionLimit: 8 },
  { name: "single", minTotalPaidScans: 1, suggestionLimit: 5 },
  { name: "free", minTotalPaidScans: 0, suggestionLimit: 3 },
];

export function isPaidUser(totalPaidScans: number | null | undefined): boolean {
  return (totalPaidScans ?? 0) > 0;
}

/**
 * How many AI-rewritten bullet suggestions this user is allowed to see,
 * based on their lifetime purchase history. Used server-side to truncate
 * the array before it ever reaches the client.
 *
 * isActiveSubscriber short-circuits to the top tier regardless of
 * totalPaidScans - an active Base/Pro subscriber (see isSubscriber()
 * below) is guaranteed at least what the best one-time-purchase tier
 * gets. This is additive: totalPaidScans keeps its exact original
 * meaning (lifetime one-time purchases only) and nothing about the
 * one-time-purchase tiers changes for someone who never subscribes.
 */
export function getSuggestionLimit(
  totalPaidScans: number | null | undefined,
  isActiveSubscriber = false
): number {
  if (isActiveSubscriber) {
    return PLAN_TIERS[0].suggestionLimit; // same ceiling as "pack" - see file header
  }

  const total = totalPaidScans ?? 0;
  // PLAN_TIERS always has a `free` fallback at minTotalPaidScans: 0, so
  // this will always match — the `?? 3` below is just a type-safety net.
  const tier = PLAN_TIERS.find((t) => total >= t.minTotalPaidScans);
  return tier?.suggestionLimit ?? 3;
}

export function getPlanName(
  totalPaidScans: number | null | undefined,
  isActiveSubscriber = false
): PlanTier["name"] {
  if (isActiveSubscriber) {
    return PLAN_TIERS[0].name;
  }

  const total = totalPaidScans ?? 0;
  const tier = PLAN_TIERS.find((t) => total >= t.minTotalPaidScans);
  return tier?.name ?? "free";
}

/** Convenience helper for any UI that needs to clamp a suggestion array. */
export function visibleSuggestionCount(
  totalSuggestions: number,
  totalPaidScans: number | null | undefined,
  isActiveSubscriber = false
): number {
  return Math.min(
    getSuggestionLimit(totalPaidScans, isActiveSubscriber),
    totalSuggestions
  );
}

/**
 * Gates paid resume templates (Epic 2) and the top suggestion tier above.
 * Only "active" grants access — see CanonicalSubscriptionStatus in
 * lib/billing/grant.ts, which is the only place this status string is
 * ever written. Accepts a plain row/partial-row shape rather than a
 * specific ORM type so any caller (a full users-table row, or just the
 * one column selected) can use it without an extra query or a cast.
 */
export function isSubscriber(
  user: { subscription_status?: string | null } | null | undefined
): boolean {
  return user?.subscription_status === "active";
}
