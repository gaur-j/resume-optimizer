/**
 * Free vs. paid gating lives here, in ONE place, so the API route and the
 * dashboard UI can never drift out of sync on what "free" actually means.
 *
 * Definition of "paid": has ever purchased a credit pack (total_paid_scans > 0).
 * This is a lifetime flag, not per-scan — once someone converts, every future
 * scan (including ones run on leftover free credits) shows full suggestions.
 * That's deliberate: it rewards conversion rather than re-gating a customer
 * who already paid you once.
 */

export const FREE_SUGGESTION_LIMIT = 3;

export function isPaidUser(totalPaidScans: number | null | undefined): boolean {
  return (totalPaidScans ?? 0) > 0;
}

export function visibleSuggestionCount(
  totalSuggestions: number,
  totalPaidScans: number | null | undefined
): number {
  if (isPaidUser(totalPaidScans)) return totalSuggestions;
  return Math.min(FREE_SUGGESTION_LIMIT, totalSuggestions);
}
