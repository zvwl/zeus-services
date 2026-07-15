import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { FALLBACK_RATES } from "@/lib/currency";
import type {
  BlogPost,
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
    // Only the ExchangeRate fields — this list crosses into the client-side
    // CurrencyProvider on every page, so extra columns ship with every view.
    const { data } = await supabase
      .from("exchange_rates")
      .select("code, rate, symbol, label")
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

// Embeds for queries that feed product-card grids: only what the cards, chips
// and price helpers actually read. Full-row embeds (`games(*)` etc.) dragged
// every game/category intro and timestamp along per product. Pages that render
// the full row (product page's own product, a game's hero) keep their own
// full fetches.
// The game embed carries is_active so pages can drop chips/links to games
// deactivated in admin (their landing pages 404) without hiding the products.
export const CARD_EMBEDS =
  "game:games(id, name, slug, sort_order, is_active), category:categories(id, name, slug, sort_order), variants:product_variants(id, price, stock, is_active, sort_order)";

export const getFeaturedProducts = unstable_cache(
  async (limit: number): Promise<Product[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("products")
      .select(`*, ${CARD_EMBEDS}`)
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

// No limit → all active rows (the FAQ page). The limit is part of the cache
// key, so the homepage's limited entry and the full list are cached separately;
// admin FAQ saves bust each through its page's implicit path tag.
export const getActiveFaqs = unstable_cache(
  async (limit?: number): Promise<Faq[]> => {
    const supabase = createPublicClient();
    let query = supabase
      .from("faqs")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (limit !== undefined) query = query.limit(limit);
    const { data } = await query;
    return (data as Faq[]) ?? [];
  },
  ["active-faqs"],
  CACHE_OPTS
);

// ── Cached catalog reads for the grid pages ─────────────────────────────────
// /games and /category/[slug] previously queried Supabase on every anonymous
// view; these move them onto the same tag-invalidated cache as the homepage.

export const getActiveGamesWithCounts = unstable_cache(
  async (): Promise<{ games: Game[]; counts: Record<string, number> }> => {
    const supabase = createPublicClient();
    const [{ data: games }, { data: products }] = await Promise.all([
      supabase
        .from("games")
        .select("*")
        .eq("is_active", true)
        .order("sort_order"),
      supabase.from("products").select("game_id").eq("is_active", true),
    ]);
    const counts: Record<string, number> = {};
    for (const p of products ?? []) {
      counts[p.game_id] = (counts[p.game_id] ?? 0) + 1;
    }
    return { games: (games as Game[]) ?? [], counts };
  },
  ["games-with-counts"],
  CACHE_OPTS
);

// One cached unit per category slug (the argument is part of the cache key).
// Also serves generateMetadata, replacing its previously separate query.
export const getCategoryWithProducts = unstable_cache(
  async (
    slug: string
  ): Promise<{ category: Category | null; products: Product[] }> => {
    const supabase = createPublicClient();
    const { data: category } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!category) return { category: null, products: [] };
    const { data: products } = await supabase
      .from("products")
      .select(`*, ${CARD_EMBEDS}`)
      .eq("category_id", category.id)
      .eq("is_active", true)
      .order("sort_order");
    return {
      category: category as Category,
      products: (products as Product[]) ?? [],
    };
  },
  ["category-with-products"],
  CACHE_OPTS
);

// One cached unit per game×category combination — the SEO landing pages
// (/games/[slug]/[category]). Returns nulls when either half is missing or
// inactive so the route can 404.
export const getGameCategoryLanding = unstable_cache(
  async (
    gameSlug: string,
    categorySlug: string
  ): Promise<{
    game: Game | null;
    category: Category | null;
    products: Product[];
  }> => {
    const supabase = createPublicClient();
    const [{ data: game }, { data: category }] = await Promise.all([
      supabase
        .from("games")
        .select("*")
        .eq("slug", gameSlug)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("categories")
        .select("*")
        .eq("slug", categorySlug)
        .eq("is_active", true)
        .maybeSingle(),
    ]);
    if (!game || !category) return { game: null, category: null, products: [] };
    const { data: products } = await supabase
      .from("products")
      .select(`*, ${CARD_EMBEDS}`)
      .eq("game_id", game.id)
      .eq("category_id", category.id)
      .eq("is_active", true)
      .order("sort_order");
    return {
      game: game as Game,
      category: category as Category,
      products: (products as Product[]) ?? [],
    };
  },
  ["game-category-landing"],
  CACHE_OPTS
);

// Everything the product page needs in one cached unit (also serves its
// generateMetadata). `ratings` is every approved rating for the product so the
// displayed average and the JSON-LD aggregateRating agree with the all-time
// review count instead of just the latest page of reviews.
export const getProductPageData = unstable_cache(
  async (
    slug: string
  ): Promise<{
    product: Product;
    reviews: Review[];
    ratings: number[];
    related: Product[];
  } | null> => {
    const supabase = createPublicClient();
    const { data: product } = await supabase
      .from("products")
      .select(
        "*, game:games(*), category:categories(*), variants:product_variants(*), fields:product_fields(*), addons:product_addons(*)"
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (!product) return null;
    const [{ data: reviews }, { data: ratings }, { data: related }] =
      await Promise.all([
        supabase
          .from("reviews")
          .select("*, profile:profiles(username, avatar_url)")
          .eq("product_id", product.id)
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("reviews")
          .select("rating")
          .eq("product_id", product.id)
          .eq("is_approved", true),
        supabase
          .from("products")
          .select(`*, ${CARD_EMBEDS}`)
          .eq("game_id", product.game_id)
          .eq("is_active", true)
          .neq("id", product.id)
          .order("sort_order")
          .limit(4),
      ]);
    return {
      product: product as Product,
      reviews: (reviews as Review[]) ?? [],
      ratings: ((ratings as { rating: number }[]) ?? []).map((r) => r.rating),
      related: (related as Product[]) ?? [],
    };
  },
  ["product-page"],
  CACHE_OPTS
);

// Rating summary from approved reviews — five head-only exact counts, zero
// rows transferred. Fetching rating rows hit PostgREST's 1000-row cap, so the
// distribution/avg silently diverged from the exact count past 1000 reviews.
// `byStar` gives the all-time 1–5 distribution, so /reviews' bars stay correct
// however few reviews it loads.
export const getReviewStats = unstable_cache(
  async (): Promise<{
    avg: number;
    count: number;
    byStar: Record<1 | 2 | 3 | 4 | 5, number>;
  }> => {
    const supabase = createPublicClient();
    const stars = [1, 2, 3, 4, 5] as const;
    const counts = await Promise.all(
      stars.map(async (star) => {
        const { count } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true })
          .eq("is_approved", true)
          .eq("rating", star);
        return count ?? 0;
      })
    );
    const byStar: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: counts[0],
      2: counts[1],
      3: counts[2],
      4: counts[3],
      5: counts[4],
    };
    const count = counts.reduce((total, n) => total + n, 0);
    if (count === 0) return { avg: 0, count, byStar };
    const sum = stars.reduce((total, star, i) => total + star * counts[i], 0);
    const avg = Math.round((sum / count) * 10) / 10;
    return { avg, count, byStar };
  },
  ["review-stats"],
  CACHE_OPTS
);

// Only the fields ReviewCard renders. Full review rows carry UUIDs and
// moderation flags that would double-ship in HTML + RSC flight for every card.
export type SlimReview = Pick<
  Review,
  | "id"
  | "rating"
  | "title"
  | "content"
  | "created_at"
  | "admin_reply"
  | "author_name"
  | "author_avatar"
  | "profile"
>;

export const REVIEW_CARD_COLUMNS =
  "id, rating, title, content, created_at, admin_reply, author_name, author_avatar, profile:profiles(username, avatar_url)";

// First page of /reviews. Review approval busts this immediately through
// revalidatePath("/reviews") (unstable_cache's implicit path tag); the shared
// 5-minute revalidate is the safety net everywhere else.
export const getLatestReviews = unstable_cache(
  async (limit: number): Promise<SlimReview[]> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("reviews")
      .select(REVIEW_CARD_COLUMNS)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      // id tiebreaker keeps the order deterministic across equal timestamps —
      // /api/reviews pages with range() and must sort identically, or rows
      // duplicate/vanish at the page-1/page-2 boundary.
      .order("id")
      .limit(limit);
    // Double cast: without generated DB types the query parser can't know the
    // profiles embed is to-one and infers an array.
    return (data as unknown as SlimReview[]) ?? [];
  },
  ["latest-reviews"],
  CACHE_OPTS
);

// Everything the blog post page needs in one cached unit (also serves its
// generateMetadata, which previously ran a duplicate select). select("*") so
// the optional meta_title/meta_description columns are picked up when present
// without breaking on pre-0021 schemas. The pool feeds the related-posts
// picker: cards render only title/image/date, plus tags for the matching.
export type BlogPoolPost = Pick<
  BlogPost,
  "slug" | "title" | "image_url" | "tags" | "published_at" | "created_at"
>;

export const getBlogPostPageData = unstable_cache(
  async (
    slug: string
  ): Promise<{ post: BlogPost; pool: BlogPoolPost[] } | null> => {
    const supabase = createPublicClient();
    const { data: post } = await supabase
      .from("blog_posts")
      .select("*, author:profiles(username, avatar_url)")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!post) return null;
    const { data: pool } = await supabase
      .from("blog_posts")
      .select("slug, title, image_url, tags, published_at, created_at")
      .eq("is_published", true)
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(24);
    return {
      post: post as BlogPost,
      pool: (pool as BlogPoolPost[]) ?? [],
    };
  },
  ["blog-post-page"],
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
