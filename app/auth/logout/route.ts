import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/", req.url), {
    status: 303,
    headers: { "Cache-Control": "no-store" },
  });
}
