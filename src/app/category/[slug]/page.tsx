import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCategoryWithProducts } from "@/lib/data";
import { CategoryGrid } from "@/components/CategoryGrid";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { Reveal } from "@/components/motion";
import { categoryVisual } from "@/lib/category-art";
import { CATEGORY_COPY } from "@/lib/category-copy";
import { metaText, siteUrl } from "@/lib/utils";
import type { Game, Product } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Same cached unit the page body uses — no extra query.
  const { category: data } = await getCategoryWithProducts(slug);
  // notFound() here (not just in the page body) so unknown slugs get a real
  // 404 status: once the streamed shell has flushed, the body's notFound()
  // can no longer change the 200 that already went out (soft-404).
  if (!data) notFound();
  const title = data.meta_title || data.name;
  const description = metaText(
    data.meta_description ||
      data.description ||
      `Browse ${data.name} at Zeuservices.`
  );
  // Category art exists locally — without this, shares fall back to the
  // generic sitewide card while games/products get real art.
  const { art } = categoryVisual(data);
  return {
    title,
    description,
    alternates: { canonical: `/category/${data.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/category/${data.slug}`,
      images: art ? [{ url: art }] : undefined,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { category, products: all } = await getCategoryWithProducts(slug);
  if (!category) notFound();

  // The grid derives the active ?game= filter from useSearchParams (correct on
  // both SSR deep links and client-side filtering), so the page itself doesn't
  // read searchParams.
  // Explicit picks, not null-ed spreads: everything here crosses into the
  // "use client" grid, so spreads still shipped meta/timestamps/UUIDs per
  // chip. The chips render id/slug/name and are sorted by sort_order.
  // Inactive games are skipped: their chips link to /games/[slug]/[category]
  // landings that 404 (getGameCategoryLanding requires an active game). Their
  // products still get cards below — deactivating a game hides the game, not
  // its products.
  const games = [...new Map(
    all
      .filter((p) => p.game?.is_active === true)
      .map((p) => [p.game!.id, p.game as Game])
  ).values()]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((g) => ({
      id: g.id,
      slug: g.slug,
      name: g.name,
      sort_order: g.sort_order,
    })) as Game[];

  // Likewise pick exactly what ProductCard, fromPrice and the game filter
  // read; inactive variants (with their pricing/stock) must not ship in the
  // page source at all.
  const cards = all.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    image_url: p.image_url,
    base_price: p.base_price,
    compare_at_price: p.compare_at_price,
    stock: p.stock,
    delivery_type: p.delivery_type,
    pricing_mode: p.pricing_mode,
    custom_price_per_unit: p.custom_price_per_unit,
    custom_min: p.custom_min,
    variants: (p.variants ?? [])
      .filter((v) => v.is_active)
      .map((v) => ({
        id: v.id,
        price: v.price,
        stock: v.stock,
        is_active: v.is_active,
      })),
    game: p.game ? { name: p.game.name, slug: p.game.slug } : null,
    category: p.category ? { name: p.category.name } : null,
  })) as Product[];

  const base = siteUrl();
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: `${base}/category/${category.slug}`,
      },
    ],
  };
  const itemListJsonLd =
    all.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${category.name} — Zeuservices`,
          numberOfItems: all.length,
          itemListElement: all.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: p.name,
            url: `${base}/product/${p.slug}`,
          })),
        }
      : null;

  const { art } = categoryVisual(category);

  return (
    <div>
      <JsonLd data={breadcrumbJsonLd} />
      {itemListJsonLd && <JsonLd data={itemListJsonLd} />}

      {art ? (
        // Cinematic category header — Higgsfield art behind a legibility veil
        <div className="relative overflow-hidden border-b border-edge">
          <Image
            src={art}
            alt=""
            aria-hidden
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="art-veil" />
          <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 sm:pb-14 sm:pt-24">
            <Reveal y={14}>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-light">
                Category
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                {category.name}
              </h1>
              {category.description && (
                <p className="mt-3 max-w-2xl text-zinc-300">
                  {category.description}
                </p>
              )}
            </Reveal>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
          <Reveal y={14}>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-light">
              Category
            </p>
            <h1 className="text-4xl font-extrabold text-white">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-3 max-w-2xl text-zinc-400">
                {category.description}
              </p>
            )}
          </Reveal>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Admin-editable intro wins; the in-repo copy keeps the page from
            shipping thin when the DB field is empty. */}
        {(category.intro || CATEGORY_COPY[category.slug]) && (
          <Reveal y={16}>
            <div className="mb-10 max-w-3xl">
              <Markdown>{category.intro || CATEGORY_COPY[category.slug]}</Markdown>
            </div>
          </Reveal>
        )}

        <CategoryGrid categorySlug={slug} games={games} products={cards} />
      </div>
    </div>
  );
}
