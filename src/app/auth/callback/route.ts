import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safePath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/login";
  return value;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safePath(searchParams.get("next"));
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
