import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { CoverImage, ProductCard } from "@/components/cards";
import { EmptyState } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { siteUrl } from "@/lib/utils";
import type { Category, Game, Product } from "@/lib/types";

export const revalidate = 3600;

// Prebuild live game pages at deploy + ISR-refresh; new slugs on-demand.
// Admin saves revalidatePath("/", "layout"), so edits appear immediately.
export async function generateStaticParams() {
  try {
    const { data } = await createPublicClient()
      .from("games")
      .select("slug")
      .eq("is_active", true);
    return (data ?? []).map((g: { slug: string }) => ({ slug: g.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("games")
    .select("name, slug, description, image_url, banner_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return { title: "Game not found" };
  const title = `${data.name} Top-Ups, Boosting & Accounts`;
  const description = (
    data.description ||
    `Cheap ${data.name} top-ups, boosting and accounts — fast, secure delivery.`
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
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
      <div className="relative h-56 overflow-hidden sm:h-72">
        <CoverImage
          src={(game as Game).banner_url ?? (game as Game).image_url}
          alt={game.name}
          fallbackText={game.name}
          className="h-full w-full"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-8 sm:px-6">
          <h1 className="text-4xl font-extrabold text-white drop-shadow">
            {game.name}
          </h1>
          {game.description && (
            <p className="mt-2 max-w-2xl text-sm text-zinc-300">
              {game.description}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {game.intro && (
          <div className="mb-12 max-w-3xl">
            <Markdown>{game.intro}</Markdown>
          </div>
        )}
        {groups.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description={`We don't have offers for ${game.name} right now — check back soon.`}
          />
        ) : (
          groups.map(({ category, items }) => (
            <section key={category.id} className="mb-14">
              <h2 className="mb-6 flex items-center gap-2.5 text-2xl font-bold text-white">
                {category.name}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
