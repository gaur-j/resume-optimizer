import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTemplatesForUser } from "@/lib/resume-templates/registry";
import { isSubscriber } from "@/lib/plan";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Subscription state lives on the users row, not the auth user. A
  // missing column (billing migration not run yet) yields a null row ->
  // everyone is shown paid templates as locked, never wrongly unlocked.
  const { data: row } = await supabase
    .from("users")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    templates: getTemplatesForUser(isSubscriber(row)),
  });
}
