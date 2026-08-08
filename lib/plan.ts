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
 */
export function getSuggestionLimit(
  totalPaidScans: number | null | undefined
): number {
  const total = totalPaidScans ?? 0;
  // PLAN_TIERS always has a `free` fallback at minTotalPaidScans: 0, so
  // this will always match — the `?? 3` below is just a type-safety net.
  const tier = PLAN_TIERS.find((t) => total >= t.minTotalPaidScans);
  return tier?.suggestionLimit ?? 3;
}

export function getPlanName(
  totalPaidScans: number | null | undefined
): PlanTier["name"] {
  const total = totalPaidScans ?? 0;
  const tier = PLAN_TIERS.find((t) => total >= t.minTotalPaidScans);
  return tier?.name ?? "free";
}

/** Convenience helper for any UI that needs to clamp a suggestion array. */
export function visibleSuggestionCount(
  totalSuggestions: number,
  totalPaidScans: number | null | undefined
): number {
  return Math.min(getSuggestionLimit(totalPaidScans), totalSuggestions);
}
