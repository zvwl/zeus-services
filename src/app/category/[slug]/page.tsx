import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCategoryWithProducts } from "@/lib/data";
import { CategoryGrid } from "@/components/CategoryGrid";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { Reveal } from "@/components/motion";
import { categoryVisual } from "@/lib/category-art";
import { siteUrl } from "@/lib/utils";
import type { Game } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Same cached unit the page body uses — no extra query.
  const { category: data } = await getCategoryWithProducts(slug);
  if (!data) return { title: "Category not found" };
  const description = (
    data.description || `Browse ${data.name} at Zeuservices.`
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  return {
    title: data.name,
    description,
    alternates: { canonical: `/category/${data.slug}` },
    openGraph: {
      type: "website",
      title: data.name,
      description,
      url: `/category/${data.slug}`,
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
  const games = [...new Map(
    all.filter((p) => p.game).map((p) => [p.game!.id, p.game as Game])
  ).values()]
    .sort((a, b) => a.sort_order - b.sort_order)
    // Chips only need id/slug/name — keep long text out of the client payload.
    .map((g) => ({ ...g, description: null, intro: null }));

  // Likewise slim the products handed to the client grid: the cards never
  // render long text, and inactive variants (with their pricing/stock) should
  // not ship in the page source at all.
  const cards = all.map((p) => ({
    ...p,
    description: null,
    delivery_instructions: null,
    variants: p.variants?.filter((v) => v.is_active),
    fields: undefined,
    addons: undefined,
    game: p.game ? { ...p.game, description: null, intro: null } : p.game,
    category: p.category
      ? { ...p.category, description: null, intro: null }
      : p.category,
  }));

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
        {category.intro && (
          <Reveal y={16}>
            <div className="mb-10 max-w-3xl">
              <Markdown>{category.intro}</Markdown>
            </div>
          </Reveal>
        )}

        <CategoryGrid categorySlug={slug} games={games} products={cards} />
      </div>
    </div>
  );
}
