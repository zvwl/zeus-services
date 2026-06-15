import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const STAFF_ROLES = ["support", "admin", "super_admin"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      db: { schema: "zeus" },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not add logic between createServerClient and getUser — it can cause
  // hard-to-debug session bugs.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // getUser() may have rotated the auth tokens and written the new ones onto
  // supabaseResponse. Any redirect we return instead MUST carry those cookies
  // over, otherwise the browser keeps the now-invalidated refresh token and
  // the user is logged out on their next request.
  const redirect = (url: URL) => {
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => res.cookies.set(cookie));
    return res;
  };

  const path = request.nextUrl.pathname;
  const needsAuth = path.startsWith("/account") || path.startsWith("/admin");

  if (!user && needsAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return redirect(url);
  }

  if (user && path.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || !STAFF_ROLES.includes(profile.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return redirect(url);
    }
  }

  return supabaseResponse;
}
