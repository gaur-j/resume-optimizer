import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Handles the redirect back from Google/LinkedIn/Facebook OAuth, as well
 * as email confirmation and password-reset links. Supabase's OAuth and
 * email-link flows use the PKCE "code" query param, which must be
 * exchanged for a session on the server — this can't be done in a
 * client component, which is why this replaces the old callback page.tsx.
 *
 * IMPORTANT: delete app/auth/callback/page.tsx if it still exists —
 * a route.ts and page.tsx cannot coexist in the same folder segment.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("Auth callback error:", error.message);
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=Authentication failed. Please try again.`
  );
}
