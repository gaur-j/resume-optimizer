import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PlanTier } from "@/lib/plan";

const PLAN_LABELS: Record<PlanTier["name"], string> = {
  free: "Free",
  single: "Single Scan",
  pack: "5-Scan Pack",
};

export function BillingSection({
  planName,
  scanCredits,
}: {
  planName: PlanTier["name"];
  scanCredits: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Billing</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your current plan and scan credits.
      </p>

      <div className="mt-4 flex items-center justify-between rounded-lg bg-secondary/60 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            {PLAN_LABELS[planName]} plan
          </p>
          <p className="text-xs text-muted-foreground">
            {scanCredits} scan{scanCredits === 1 ? "" : "s"} remaining
          </p>
        </div>
        <Button render={<Link href="/dashboard" />} variant="outline" size="sm">
          {planName === "free" ? "Get more scans" : "Manage credits"}
        </Button>
      </div>

      {/* Stub for the subscription model (Epic 3/4): once that lands,
          this section should show subscription_status/subscription_plan
          instead of (or alongside, for legacy credit customers) the
          lifetime-credit plan above. */}
      <p className="mt-3 text-xs text-muted-foreground">
        Subscription plans are coming soon.
      </p>
    </div>
  );
}
