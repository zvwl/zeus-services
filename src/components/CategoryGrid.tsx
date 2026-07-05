"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/cards";
import { EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Game, Product } from "@/lib/types";

// The full product list is already in the page payload, so game filtering is a
// pure in-memory operation. Doing it client-side makes chip clicks instant —
// as <Link> navigations they each cost a full dynamic server render (the page
// was flagged for poor INP). The chips stay real links so open-in-new-tab and
// crawling of ?game= URLs keep working; a plain click intercepts and syncs the
// URL via history.replaceState without a server round trip. The active filter
// is derived from useSearchParams — never duplicated into state — so it stays
// correct when a navigation (e.g. the navbar category link) changes only the
// search params without remounting this component. Next syncs native
// history.replaceState calls back into useSearchParams.
export function CategoryGrid({
  categorySlug,
  games,
  products,
}: {
  categorySlug: string;
  games: Game[];
  products: Product[];
}) {
  const gameFilter = useSearchParams().get("game");

  function select(e: React.MouseEvent, slug: string | null) {
    // Let modified clicks (new tab, etc.) behave like normal links.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    window.history.replaceState(
      null,
      "",
      slug
        ? `/category/${categorySlug}?game=${encodeURIComponent(slug)}`
        : `/category/${categorySlug}`
    );
  }

  const filtered = gameFilter
    ? products.filter((p) => p.game?.slug === gameFilter)
    : products;

  return (
    <>
      {games.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href={`/category/${categorySlug}`}
            onClick={(e) => select(e, null)}
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
              href={`/category/${categorySlug}?game=${g.slug}`}
              onClick={(e) => select(e, g.slug)}
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
          {filtered.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              // First row of covers is the LCP element on category pages. The
              // grid is 1-col below sm, so the default 50vw sizes undersizes
              // the mobile LCP image.
              priority={i < 4}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ))}
        </div>
      )}
    </>
  );
}
