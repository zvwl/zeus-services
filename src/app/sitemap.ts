import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { siteUrl } from "@/lib/utils";

// Regenerate hourly so newly added/removed games, products, categories, blog
// posts and giveaways show up for Google automatically (with lastModified).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const supabase = createPublicClient();

  const [games, products, categories, posts, giveaways] = await Promise.all([
    supabase.from("games").select("slug, created_at").eq("is_active", true),
    supabase.from("products").select("slug, updated_at").eq("is_active", true),
    supabase.from("categories").select("slug, created_at").eq("is_active", true),
    supabase.from("blog_posts").select("slug, updated_at").eq("is_published", true),
    supabase.from("giveaways").select("slug, created_at").eq("is_active", true),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/games`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/giveaways`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/reviews`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/donate`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/support`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/refunds`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...(products.data ?? []).map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: p.updated_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...(games.data ?? []).map((g) => ({
      url: `${base}/games/${g.slug}`,
      lastModified: g.created_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...(categories.data ?? []).map((c) => ({
      url: `${base}/category/${c.slug}`,
      lastModified: c.created_at ?? undefined,
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
