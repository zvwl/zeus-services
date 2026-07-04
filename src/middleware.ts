import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// IMPORTANT: with a `src/` directory, Next.js only picks up middleware from
// `src/middleware.ts` (co-located with `app/`). A copy at the repo root is
// silently ignored — which previously disabled session refresh AND all
// per-path admin capability gating.
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const needsAuth = path.startsWith("/account") || path.startsWith("/admin");
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));

  // Fast path: an anonymous visitor (no Supabase auth cookie) on a public route
  // has no session to refresh and nothing to gate. Skip the Supabase auth
  // round-trip so crawlers and first-time visitors get a lower TTFB. Signed-in
  // users and any /account or /admin request always run the full check.
  if (!needsAuth && !hasAuthCookie) {
    return NextResponse.next();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything except static assets and the Stripe webhook (which is
    // authenticated by signature and must not be redirected).
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
