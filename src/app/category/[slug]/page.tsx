import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryWithProducts } from "@/lib/data";
import { CategoryGrid } from "@/components/CategoryGrid";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <JsonLd data={breadcrumbJsonLd} />
      {itemListJsonLd && <JsonLd data={itemListJsonLd} />}
      <div className="mb-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-light">
          Category
        </p>
        <h1 className="flex items-center gap-3 text-4xl font-extrabold text-white">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-3 max-w-2xl text-zinc-400">{category.description}</p>
        )}
        {category.intro && (
          <div className="mt-6 max-w-3xl">
            <Markdown>{category.intro}</Markdown>
          </div>
        )}
      </div>

      <CategoryGrid categorySlug={slug} games={games} products={cards} />
    </div>
  );
}
