import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { syncCustomerDiscordRole } from "@/lib/discord";
import { attachGuestOrders } from "@/lib/orders";
import { safeNextPath } from "@/lib/utils";

// Runs once a session is established: grant the Discord role if applicable
// (makes "buy first, connect Discord later" work) and claim any guest orders
// placed with this email before the account existed. Best effort — never blocks
// the auth redirect.
async function afterLogin(supabase: Awaited<ReturnType<typeof createClient>>) {
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

// Handles both OAuth/PKCE code exchanges and email link verifications.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await afterLogin(supabase);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      await afterLogin(supabase);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
