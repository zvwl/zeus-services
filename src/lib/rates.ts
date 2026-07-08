import { createAdminClient } from "@/lib/supabase/admin";

// Live exchange-rate sync — ECB reference rates via frankfurter.dev (free,
// keyless). Shared by the daily cron (/api/cron/rates) and the admin's
// "Sync now" button. USD is the base; product prices are stored in USD.

const CODES = ["GBP", "EUR", "CAD", "AUD"] as const;

/** Fetches current rates and writes them to zeus.exchange_rates. Returns what changed. */
export async function syncExchangeRates(): Promise<Record<string, number>> {
  const res = await fetch(
    `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${CODES.join(",")}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Rate provider returned ${res.status}`);
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
  return updated;
}
