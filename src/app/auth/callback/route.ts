import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";
import { syncCustomerDiscordRole } from "@/lib/discord";
import { attachGuestOrders } from "@/lib/orders";
import { safeNextPath } from "@/lib/utils";

// Runs once a session is established: grant the Discord role if applicable
// (makes "buy first, connect Discord later" work) and claim any guest orders
// placed with this email before the account existed. Best effort — never blocks
// the auth redirect.
async function afterLogin(supabase: ReturnType<typeof createServerClient>) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await attachGuestOrders(user.id, user.email);
    if (user.identities?.some((i) => i.provider === "discord")) {
      await syncCustomerDiscordRole(user.id);
    }
  } catch {
    // never block the auth redirect on this
  }
}

// Handles both OAuth/PKCE code exchanges and email-link verifications.
//
// The session cookies from exchangeCodeForSession/verifyOtp are written DIRECTLY
// onto the redirect response (`success.cookies.set`). Writing them via the
// request-scoped cookies() store and then returning a *redirect* can silently
// drop them — which leaves the session created on Supabase but no cookie in the
// browser, i.e. "logged in on the server, logged out in the UI".
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  const cookieStore = await cookies();
  const success = NextResponse.redirect(`${origin}${next}`);
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: "zeus" },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
      ) {
        cookiesToSet.forEach(({ name, value, options }) =>
          success.cookies.set(name, value, options)
        );
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await afterLogin(supabase);
      return success;
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      await afterLogin(supabase);
      return success;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
