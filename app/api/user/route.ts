import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_FREE_CREDITS = 3;

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("users")
    .select("scan_credits")
    .eq("id", user.id)
    .single();

  if (!error && data) {
    return NextResponse.json({ scan_credits: data.scan_credits });
  }

  // PGRST116 = "The result contains 0 rows" — no row exists yet for
  // this user. Self-heal by creating one with default free credits.
  if (error?.code === "PGRST116") {
    const admin = createAdminClient();

    const { data: created, error: insertError } = await admin
      .from("users")
      .upsert(
        {
          id: user.id,
          email: user.email,
          scan_credits: DEFAULT_FREE_CREDITS,
        },
        { onConflict: "id", ignoreDuplicates: true }
      )
      .select("scan_credits")
      .single();

    if (insertError) {
      console.error("Failed to self-heal missing user row:", insertError);
      return NextResponse.json(
        { error: "Failed to load account. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      scan_credits: created?.scan_credits ?? DEFAULT_FREE_CREDITS,
    });
  }

  console.error("Unexpected error fetching credits:", error);
  return NextResponse.json(
    { error: "Failed to load credits" },
    { status: 500 }
  );
}
