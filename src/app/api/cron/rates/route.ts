import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";

// Daily exchange-rate sync (Vercel Cron, see vercel.json). Pulls ECB reference
// rates from frankfurter.dev (free, keyless) and updates zeus.exchange_rates,
// so displayed prices track the real market instead of the seeded values.
// USD stays the base currency; product prices are stored in USD.

const CODES = ["GBP", "EUR", "CAD", "AUD"] as const;

export async function GET(req: Request) {
  // Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` when the env var
  // is set. Require it whenever configured so outsiders can't trigger syncs.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasAdminClient()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured" },
      { status: 500 }
    );
  }

  const res = await fetch(
    `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${CODES.join(",")}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    return NextResponse.json(
      { error: `Rate provider returned ${res.status}` },
      { status: 502 }
    );
  }
  const { rates } = (await res.json()) as { rates: Record<string, number> };

  const db = createAdminClient();
  const updated: Record<string, number> = {};
  for (const code of CODES) {
    const rate = Number(rates?.[code]);
    // Sanity guard: ignore zero/absurd values rather than poisoning checkout.
    if (!Number.isFinite(rate) || rate <= 0 || rate > 100) continue;
    const { error } = await db
      .from("exchange_rates")
      .update({ rate, updated_at: new Date().toISOString() })
      .eq("code", code);
    if (!error) updated[code] = rate;
  }

  // Bust the cached getRates() so new prices show without waiting 5 minutes.
  revalidateTag("site");

  return NextResponse.json({ ok: true, base: "USD", updated });
}
