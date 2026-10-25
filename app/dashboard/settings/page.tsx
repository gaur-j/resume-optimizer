import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPlanName } from "@/lib/plan";
import { ProfileSection } from "@/components/dashboard/settings/ProfileSection";
import { PasswordSection } from "@/components/dashboard/settings/PasswordSection";
import { BillingSection } from "@/components/dashboard/settings/BillingSection";
import { safeDisplayName } from "@/lib/security";

export const metadata: Metadata = {
  title: "Account Settings",
};

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // dashboard/layout.tsx already redirects unauthenticated visitors before
  // this page renders, but this page fetches its own fresh user record
  // (rather than trusting a prop passed down) so it isn't silently wrong
  // if that upstream check is ever refactored.
  if (!user) {
    redirect("/auth/login");
  }

  const { data: row } = await supabase
    .from("users")
    .select("scan_credits, total_paid_scans")
    .eq("id", user.id)
    .single();

  const name = safeDisplayName(
    user.user_metadata?.full_name,
    safeDisplayName(user.user_metadata?.name, "")
  );
  // OAuth-only accounts (Google, etc.) have no password to change - only
  // offer the password form to accounts that actually have one.
  const providers = user.app_metadata?.providers as string[] | undefined;
  const hasPassword = providers
    ? providers.includes("email")
    : user.app_metadata?.provider === "email";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, password, and billing.
        </p>
      </div>

      <ProfileSection initialName={name} email={user.email ?? ""} />

      {hasPassword && <PasswordSection email={user.email ?? ""} />}

      <BillingSection
        planName={getPlanName(row?.total_paid_scans)}
        scanCredits={row?.scan_credits ?? 0}
      />
    </div>
  );
}
