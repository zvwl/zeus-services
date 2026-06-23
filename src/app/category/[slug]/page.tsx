import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/cards";
import { EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Game, Product } from "@/lib/types";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("name, slug, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ game?: string }>;
}) {
  const [{ slug }, { game: gameFilter }] = await Promise.all([
    params,
    searchParams,
  ]);
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!category) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("*, game:games(*), category:categories(*), variants:product_variants(*)")
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("sort_order");

  const all = (products as Product[]) ?? [];
  const games = [...new Map(
    all.filter((p) => p.game).map((p) => [p.game!.id, p.game as Game])
  ).values()].sort((a, b) => a.sort_order - b.sort_order);
  const filtered = gameFilter
    ? all.filter((p) => p.game?.slug === gameFilter)
    : all;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mb-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-light">
          Category
        </p>
        <h1 className="flex items-center gap-3 text-4xl font-extrabold text-white">
          <span>{category.icon ?? "🎮"}</span> {category.name}
        </h1>
        {category.description && (
          <p className="mt-3 max-w-2xl text-zinc-400">{category.description}</p>
        )}
      </div>

      {games.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href={`/category/${slug}`}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition",
              !gameFilter
                ? "border-primary/50 bg-primary/15 text-primary-light"
                : "border-edge bg-raised/50 text-zinc-400 hover:text-white"
            )}
          >
            All games
          </Link>
          {games.map((g) => (
            <Link
              key={g.id}
              href={`/category/${slug}?game=${g.slug}`}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition",
                gameFilter === g.slug
                  ? "border-primary/50 bg-primary/15 text-primary-light"
                  : "border-edge bg-raised/50 text-zinc-400 hover:text-white"
              )}
            >
              {g.name}
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title="No offers in this category yet"
          description="Our team adds new products all the time — check back soon."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
