import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";
import { pathCapability, resolveCapabilities } from "@/lib/types";

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

  if (user && needsAuth) {
    // Server-side 2FA enforcement. A password login issues an AAL1 session even
    // when the account has a verified TOTP factor; without this check the
    // client could simply skip the challenge and use that AAL1 session. If a
    // higher assurance level is available but not yet reached, force a step-up.
    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (
      aal &&
      aal.nextLevel === "aal2" &&
      aal.currentLevel === "aal1" &&
      !path.startsWith("/verify-2fa")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/verify-2fa";
      url.search = "";
      url.searchParams.set("next", path);
      return redirect(url);
    }
  }

  if (user && path.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, capabilities, is_banned")
      .eq("id", user.id)
      .maybeSingle();
    const role = profile?.role;

    const backToAdmin = () => {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return redirect(url);
    };

    if (!role || !STAFF_ROLES.includes(role) || profile?.is_banned) {
      // Not staff (or a suspended staff account) → off to the storefront.
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return redirect(url);
    }
    // Section access is governed by capabilities (the role's defaults, or a
    // per-staff override). The dashboard (/admin) requires no capability.
    const required = pathCapability(path);
    if (
      required &&
      !resolveCapabilities(role, profile?.capabilities).includes(required)
    ) {
      return backToAdmin();
    }
  }

  return supabaseResponse;
}
