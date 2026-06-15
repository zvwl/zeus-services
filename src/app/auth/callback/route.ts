import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { syncCustomerDiscordRole } from "@/lib/discord";

// If the user just (re)connected Discord, retry granting the customer role —
// this is what makes "buy first, connect Discord later" work. Best effort.
async function syncDiscordOnConnect(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.identities?.some((i) => i.provider === "discord")) {
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
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") ? rawNext : "/";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await syncDiscordOnConnect(supabase);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
