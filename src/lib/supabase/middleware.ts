import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const STAFF_ROLES = ["support", "admin", "super_admin"];
const ADMIN_ROLES = ["admin", "super_admin"];

// Sections only admins+ may open. Everything else under /admin (dashboard,
// orders, customers, support) is available to all staff incl. support.
const ADMIN_ONLY_PATHS = [
  "/admin/products",
  "/admin/games",
  "/admin/categories",
  "/admin/reviews",
  "/admin/blog",
  "/admin/giveaways",
  "/admin/faqs",
  "/admin/donations",
  "/admin/sections",
  "/admin/settings",
];

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
    const role = profile?.role;

    const backToAdmin = () => {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return redirect(url);
    };

    if (!role || !STAFF_ROLES.includes(role)) {
      // Not staff at all → off to the storefront.
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return redirect(url);
    }
    // Team & roles: super admins only.
    if (path.startsWith("/admin/team") && role !== "super_admin") {
      return backToAdmin();
    }
    // Catalog / content / settings: admins and super admins only.
    if (
      ADMIN_ONLY_PATHS.some((p) => path.startsWith(p)) &&
      !ADMIN_ROLES.includes(role)
    ) {
      return backToAdmin();
    }
  }

  return supabaseResponse;
}
