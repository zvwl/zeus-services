import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { hasAdminClient } from "@/lib/supabase/admin";
import { syncExchangeRates } from "@/lib/rates";

// Daily exchange-rate sync (Vercel Cron, see vercel.json). Displayed prices
// track the real market instead of the seeded values.

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

  try {
    const updated = await syncExchangeRates();
    // Bust the cached getRates() so new prices show without waiting 5 minutes.
    revalidateTag("site");
    return NextResponse.json({ ok: true, base: "USD", updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "sync failed" },
      { status: 502 }
    );
  }
}
