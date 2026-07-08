import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGameCategoryLanding } from "@/lib/data";
import { landingCopy } from "@/lib/landing";
import { CoverImage, ProductCard } from "@/components/cards";
import { Badge } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { Reveal } from "@/components/motion";
import { siteUrl } from "@/lib/utils";
import type { Game } from "@/lib/types";

// Static + tag-invalidated (revalidateTag("site") on admin saves) with a
// 5-minute safety net — these are the primary SEO landing pages, so crawler
// TTFB must not be DB-bound.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; category: string }>;
}): Promise<Metadata> {
  const { slug, category: categorySlug } = await params;
  const { game, category, products } = await getGameCategoryLanding(
    slug,
    categorySlug
  );
  if (!game || !category || products.length === 0) {
    return { title: "Not found" };
  }
  const copy = landingCopy(game, category);
  const image = game.banner_url || game.image_url;
  const path = `/games/${game.slug}/${category.slug}`;
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: copy.title,
      description: copy.description,
      url: path,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function GameCategoryPage({
  params,
}: {
  params: Promise<{ slug: string; category: string }>;
}) {
  const { slug, category: categorySlug } = await params;
  const { game, category, products } = await getGameCategoryLanding(
    slug,
    categorySlug
  );
  // No offers = thin/duplicate page: don't publish an empty landing page.
  if (!game || !category || products.length === 0) notFound();
  const copy = landingCopy(game, category);

  const base = siteUrl();
  const path = `${base}/games/${game.slug}/${category.slug}`;
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
      { "@type": "ListItem", position: 4, name: copy.h1, item: path },
    ],
  };
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${copy.h1} — Zeuservices`,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${base}/product/${p.slug}`,
    })),
  };
  const faqJsonLd =
    copy.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: copy.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  return (
    <div>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={itemListJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}

      {/* Banner hero — same veiled-art treatment as the game hub */}
      <div className="relative h-56 overflow-hidden border-b border-edge sm:h-72">
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
              <Badge variant="primary">{game.name}</Badge>
              <Badge>
                {products.length} {products.length === 1 ? "offer" : "offers"}
              </Badge>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow sm:text-5xl">
              {copy.h1}
            </h1>
          </Reveal>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* Breadcrumbs */}
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-primary-light">Home</Link>
          <span>/</span>
          <Link href="/games" className="hover:text-primary-light">Games</Link>
          <span>/</span>
          <Link
            href={`/games/${game.slug}`}
            className="hover:text-primary-light"
          >
            {game.name}
          </Link>
          <span>/</span>
          <span className="text-zinc-300">{category.name}</span>
        </nav>

        <Reveal y={16}>
          <div className="mb-10 max-w-3xl">
            <Markdown>{copy.intro}</Markdown>
          </div>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p, i) => (
            <div
              key={p.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>

        {copy.faqs.length > 0 && (
          <section className="mt-16 max-w-3xl">
            <Reveal y={14}>
              <h2 className="mb-6 text-2xl font-bold text-white">
                {copy.h1} — FAQ
              </h2>
            </Reveal>
            <div className="space-y-4">
              {copy.faqs.map((f) => (
                <details
                  key={f.q}
                  className="glass group rounded-xl p-5 open:border-primary/40"
                >
                  <summary className="cursor-pointer list-none text-[15px] font-semibold text-white marker:content-none">
                    {f.q}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
