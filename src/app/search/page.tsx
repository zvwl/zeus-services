import type { Metadata } from "next";
import { Gamepad2, Gift, LifeBuoy, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/cards";
import { Button, ButtonLink, EmptyState } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { sanitizeSearchTerm } from "@/lib/utils";
import type { Product } from "@/lib/types";

// Internal search results should never be indexed (Google guidance); follow
// links so crawlers can still discover products through them.
export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};
export const revalidate = 0;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  let products: Product[] = [];

  const safe = sanitizeSearchTerm(query);
  if (safe) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*, game:games(*), category:categories(*), variants:product_variants(*)")
      .eq("is_active", true)
      .or(`name.ilike.%${safe}%,description.ilike.%${safe}%`)
      .limit(24);
    products = (data as Product[]) ?? [];
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <Reveal y={14}>
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-light">
          Find it fast
        </p>
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
          Search the store
        </h1>
      </Reveal>
      <Reveal y={14} delay={0.08}>
        <form className="mt-6 max-w-xl" action="/search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search products, e.g. V-Bucks, rank boost…"
              className="input rounded-2xl py-3.5 pl-12 pr-28 text-base"
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 top-1/2 h-9 -translate-y-1/2"
            >
              Search
            </Button>
          </div>
        </form>
      </Reveal>

      <div className="mt-10">
        {query && products.length === 0 ? (
          <Reveal y={16}>
            <EmptyState
              icon={<Search className="h-10 w-10" />}
              title={`No results for “${query}”`}
              description="Try a different keyword or browse by game instead."
              action={
                <ButtonLink href="/games" variant="outline">
                  <Gamepad2 className="h-4 w-4" /> Browse all games
                </ButtonLink>
              }
            />
          </Reveal>
        ) : products.length > 0 ? (
          <>
            <Reveal y={12}>
              <p className="mb-6 text-sm text-zinc-500">
                {products.length} {products.length === 1 ? "result" : "results"}{" "}
                for “{query}”
              </p>
            </Reveal>
            {/* CSS-only stagger — results paint at first paint instead of
                waiting for framer hydration (LCP); disabled under
                prefers-reduced-motion via globals.css. */}
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
          </>
        ) : (
          <Reveal y={16}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-zinc-500">Not sure where to start?</span>
              <ButtonLink href="/games" variant="outline" size="sm">
                <Gamepad2 className="h-4 w-4" /> All games
              </ButtonLink>
              <ButtonLink href="/giveaways" variant="outline" size="sm">
                <Gift className="h-4 w-4" /> Giveaways
              </ButtonLink>
              <ButtonLink href="/faq" variant="outline" size="sm">
                <LifeBuoy className="h-4 w-4" /> FAQ
              </ButtonLink>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
