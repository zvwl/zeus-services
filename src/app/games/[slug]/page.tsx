import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { CoverImage, ProductCard } from "@/components/cards";
import { Badge, EmptyState } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { Reveal } from "@/components/motion";
import { metaText, siteUrl } from "@/lib/utils";
import type { Category, Game, Product } from "@/lib/types";

// Static + tag-invalidated (admin saves call revalidateTag("site")) with a
// 5-minute safety net, instead of a full DB-bound render per crawl.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createPublicClient();
  // select("*") so the optional meta_title/meta_description columns are picked
  // up when present without breaking on pre-0021 schemas.
  const { data } = await supabase
    .from("games")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle<Game>();
  // Real 404 status for unknown slugs — the page body's notFound() fires too
  // late once the streamed shell has already sent a 200 (soft-404).
  if (!data) notFound();
  const title = data.meta_title || `${data.name} Top-Ups, Boosting & Accounts`;
  const description = metaText(
    data.meta_description ||
      data.description ||
      `Cheap ${data.name} top-ups, boosting and accounts — fast, secure delivery.`
  );
  const image = data.banner_url || data.image_url;
  return {
    title,
    description,
    alternates: { canonical: `/games/${data.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/games/${data.slug}`,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!game) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("*, game:games(*), category:categories(*), variants:product_variants(*)")
    .eq("game_id", game.id)
    .eq("is_active", true)
    .order("sort_order");

  const byCategory = new Map<string, { category: Category; items: Product[] }>();
  for (const p of (products as Product[]) ?? []) {
    if (!p.category) continue;
    const entry = byCategory.get(p.category.id) ?? {
      category: p.category,
      items: [],
    };
    entry.items.push(p);
    byCategory.set(p.category.id, entry);
  }
  const groups = [...byCategory.values()].sort(
    (a, b) => a.category.sort_order - b.category.sort_order
  );

  const base = siteUrl();
  const allProducts = (products as Product[]) ?? [];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Games", item: `${base}/games` },
      {
        "@type": "ListItem",
        position: 3,
        name: game.name,
        item: `${base}/games/${game.slug}`,
      },
    ],
  };
  const itemListJsonLd =
    allProducts.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${game.name} services — Zeuservices`,
          numberOfItems: allProducts.length,
          itemListElement: allProducts.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: p.name,
            url: `${base}/product/${p.slug}`,
          })),
        }
      : null;

  return (
    <div>
      <JsonLd data={breadcrumbJsonLd} />
      {itemListJsonLd && <JsonLd data={itemListJsonLd} />}
      {/* Banner hero — DB art behind a legibility veil, copy pinned bottom-left */}
      <div className="relative h-64 overflow-hidden border-b border-edge sm:h-80">
        <CoverImage
          src={(game as Game).banner_url ?? (game as Game).image_url}
          alt={game.name}
          fallbackText={game.name}
          className="h-full w-full"
          sizes="100vw"
          priority
        />
        <div className="art-veil" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10">
          <Reveal y={14}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="primary">Official store</Badge>
              {allProducts.length > 0 && (
                <Badge>
                  {allProducts.length}{" "}
                  {allProducts.length === 1 ? "offer" : "offers"}
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow sm:text-5xl">
              {game.name}
            </h1>
            {game.description && (
              <p className="mt-2 max-w-2xl text-sm text-zinc-300 sm:text-base">
                {game.description}
              </p>
            )}
          </Reveal>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {game.intro && (
          <Reveal y={16}>
            <div className="mb-12 max-w-3xl">
              <Markdown>{game.intro}</Markdown>
            </div>
          </Reveal>
        )}
        {groups.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description={`We don't have offers for ${game.name} right now — check back soon.`}
          />
        ) : (
          groups.map(({ category, items }) => (
            <section key={category.id} className="mb-14">
              <Reveal y={14}>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-white">
                    <span
                      aria-hidden
                      className="h-6 w-1 rounded-full bg-gradient-to-b from-primary to-fuchsia-500"
                    />
                    {/* Deep link into the game×category SEO landing page */}
                    <Link
                      href={`/games/${game.slug}/${category.slug}`}
                      className="transition hover:text-primary-light"
                    >
                      {category.name}
                    </Link>
                  </h2>
                  <Link
                    href={`/games/${game.slug}/${category.slug}`}
                    className="inline-flex items-center gap-1 text-sm text-zinc-400 transition hover:text-primary-light"
                  >
                    View all {game.name} {category.name.toLowerCase()}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
              {/* CSS-only stagger — cards paint at first paint instead of
                  waiting for framer hydration (LCP); disabled under
                  prefers-reduced-motion via globals.css. */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((p, i) => (
                  <div
                    key={p.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
