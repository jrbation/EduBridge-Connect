import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_ROUTES, canAccessPath, homeForRole, isUserRole } from "@/lib/auth/roles";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
  return to;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isProtected =
    pathname.startsWith("/student") ||
    pathname.startsWith("/parent") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/admin");

  if (!url || !key) {
    if (isProtected) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("error", "config");
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2]),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role;
    if (profile?.status === "inactive" && isProtected) {
      await supabase.auth.signOut();
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("error", "inactive");
      return copyCookies(supabaseResponse, NextResponse.redirect(redirectUrl));
    }

    if (isAuthRoute && isUserRole(role) && pathname !== "/reset-password") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = homeForRole(role);
      redirectUrl.search = "";
      return copyCookies(supabaseResponse, NextResponse.redirect(redirectUrl));
    }

    if (isProtected && isUserRole(role) && !canAccessPath(role, pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = homeForRole(role);
      return copyCookies(supabaseResponse, NextResponse.redirect(redirectUrl));
    }
  }

  return supabaseResponse;
}
