import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { FALLBACK_RATES } from "@/lib/currency";
import type {
  Category,
  ExchangeRate,
  SiteSection,
  SiteSettings,
} from "@/lib/types";

// Global, public, rarely-changing data. Cached across requests so it isn't
// re-queried on every page load. Refreshes every 5 min as a safety net, and is
// invalidated immediately whenever an admin saves (revalidateTag("site")).
const CACHE_OPTS = { revalidate: 300, tags: ["site"] };

export const getSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const supabase = createPublicClient();
    const { data } = await supabase.from("site_settings").select("key, value");
    return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  },
  ["site-settings"],
  CACHE_OPTS
);

export function setting(settings: SiteSettings, key: string, fallback = "") {
  const value = settings[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    return (data as Category[]) ?? [];
  },
  ["categories"],
  CACHE_OPTS
);

export const getRates = unstable_cache(
  async (): Promise<ExchangeRate[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("exchange_rates")
      .select("*")
      .order("code");
    const rates = (data as ExchangeRate[]) ?? [];
    return rates.length > 0 ? rates : FALLBACK_RATES;
  },
  ["exchange-rates"],
  CACHE_OPTS
);

export const getSections = unstable_cache(
  async (): Promise<SiteSection[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("site_sections")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    return (data as SiteSection[]) ?? [];
  },
  ["site-sections"],
  CACHE_OPTS
);
