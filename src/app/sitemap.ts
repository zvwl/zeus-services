import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { siteUrl } from "@/lib/utils";
import type { Category, Game } from "@/lib/types";

// Regenerate hourly so newly added/removed games, products, categories, blog
// posts and giveaways show up for Google automatically (with lastModified).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const supabase = createPublicClient();

  // games/categories use select("*") so updated_at (migration 0021) is used
  // when present without breaking on older schemas.
  const [games, products, categories, posts, giveaways] = await Promise.all([
    supabase.from("games").select("*").eq("is_active", true),
    supabase
      .from("products")
      .select("slug, updated_at, game_id, category_id")
      .eq("is_active", true),
    supabase.from("categories").select("*").eq("is_active", true),
    supabase.from("blog_posts").select("slug, updated_at").eq("is_published", true),
    supabase.from("giveaways").select("slug, created_at").eq("is_active", true),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/games`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/giveaways`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/discount-codes`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/reviews`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/donate`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/support`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/refunds`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const gameRows = (games.data as Game[]) ?? [];
  const categoryRows = (categories.data as Category[]) ?? [];
  const productRows =
    (products.data as {
      slug: string;
      updated_at: string | null;
      game_id: string;
      category_id: string;
    }[]) ?? [];

  // Game×category landing pages (/games/[slug]/[category]) — only combos that
  // actually have live products, mirroring the route's own 404 rule.
  const gameById = new Map(gameRows.map((g) => [g.id, g]));
  const categoryById = new Map(categoryRows.map((c) => [c.id, c]));
  const combos = new Map<string, string | undefined>();
  for (const p of productRows) {
    const game = gameById.get(p.game_id);
    const category = categoryById.get(p.category_id);
    if (!game || !category) continue;
    const url = `${base}/games/${game.slug}/${category.slug}`;
    const prev = combos.get(url);
    const next = p.updated_at ?? undefined;
    if (!prev || (next && next > prev)) combos.set(url, next);
  }

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...productRows.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: p.updated_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...[...combos.entries()].map(([url, lastModified]) => ({
      url,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...gameRows.map((g) => ({
      url: `${base}/games/${g.slug}`,
      lastModified: g.updated_at ?? g.created_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...categoryRows.map((c) => ({
      url: `${base}/category/${c.slug}`,
      lastModified: c.updated_at ?? c.created_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...(posts.data ?? []).map((b) => ({
      url: `${base}/blog/${b.slug}`,
      lastModified: b.updated_at ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...(giveaways.data ?? []).map((gv) => ({
      url: `${base}/giveaways/${gv.slug}`,
      lastModified: gv.created_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
