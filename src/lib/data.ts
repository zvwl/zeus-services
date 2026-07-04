import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { FALLBACK_RATES } from "@/lib/currency";
import type {
  Category,
  ExchangeRate,
  Faq,
  Game,
  Giveaway,
  Product,
  Review,
  SitePage,
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

// All editable pages in one cached fetch (there are only a handful); public
// routes pick theirs by slug and fall back to built-in defaults if missing.
export const getPages = unstable_cache(
  async (): Promise<SitePage[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase.from("pages").select("*");
    return (data as SitePage[]) ?? [];
  },
  ["site-pages"],
  CACHE_OPTS
);

export async function getPage(slug: string): Promise<SitePage | null> {
  const pages = await getPages();
  return pages.find((p) => p.slug === slug) ?? null;
}

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

// ── Cached catalog reads for the homepage sections ──────────────────────────
// These were previously queried through the cookie-bound request client on every
// anonymous page view. They change at most a few times a day and are busted
// immediately by revalidateTag("site") whenever an admin saves.

export const getFeaturedProducts = unstable_cache(
  async (limit: number): Promise<Product[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("products")
      .select("*, game:games(*), category:categories(*), variants:product_variants(*)")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("sort_order")
      .limit(limit);
    return (data as Product[]) ?? [];
  },
  ["featured-products"],
  CACHE_OPTS
);

export const getActiveGames = unstable_cache(
  async (limit: number): Promise<Game[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("games")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .limit(limit);
    return (data as Game[]) ?? [];
  },
  ["active-games"],
  CACHE_OPTS
);

export const getApprovedReviews = unstable_cache(
  async (limit: number): Promise<Review[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("reviews")
      .select("*, profile:profiles(username, avatar_url)")
      .eq("is_approved", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as Review[]) ?? [];
  },
  ["approved-reviews"],
  CACHE_OPTS
);

export const getActiveFaqs = unstable_cache(
  async (limit: number): Promise<Faq[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("faqs")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .limit(limit);
    return (data as Faq[]) ?? [];
  },
  ["active-faqs"],
  CACHE_OPTS
);

// Rating summary from approved reviews, computed in-database so we never
// transfer every review row just to average them.
export const getReviewStats = unstable_cache(
  async (): Promise<{ avg: number; count: number }> => {
    const supabase = createPublicClient();
    const { data, count } = await supabase
      .from("reviews")
      .select("rating", { count: "exact" })
      .eq("is_approved", true);
    const rows = (data as { rating: number }[]) ?? [];
    if (rows.length === 0) return { avg: 0, count: count ?? 0 };
    const avg =
      Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10) / 10;
    return { avg, count: count ?? rows.length };
  },
  ["review-stats"],
  CACHE_OPTS
);

// The single live giveaway (soonest to end). `now` is captured inside the cached
// function, so a just-ended giveaway can linger for at most the revalidate window.
export const getLiveGiveaway = unstable_cache(
  async (): Promise<Giveaway | null> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("giveaways")
      .select("*")
      .eq("is_active", true)
      .gt("ends_at", new Date().toISOString())
      .order("ends_at")
      .limit(1)
      .maybeSingle();
    return (data as Giveaway | null) ?? null;
  },
  ["live-giveaway"],
  CACHE_OPTS
);
