import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const provider = searchParams.get("provider") ?? "oauth";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const createdAt = new Date(data.user.created_at).getTime();
      const lastSignInAt = new Date(
        data.user.last_sign_in_at ?? data.user.created_at
      ).getTime();
      const isNewUser = lastSignInAt - createdAt < 10_000;

      const redirectUrl = new URL(`${origin}${next}`);
      if (isNewUser) {
        redirectUrl.searchParams.set("new_user", "1");
        redirectUrl.searchParams.set("method", provider);
      }

      return NextResponse.redirect(redirectUrl);
    }

    console.error("Auth callback error:", error?.message);
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=Authentication failed. Please try again.`
  );
}
