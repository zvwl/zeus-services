import type { Metadata } from "next";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/cards";
import { EmptyState } from "@/components/ui";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Search" };
export const revalidate = 0;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  let products: Product[] = [];

  if (query) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*, game:games(*), category:categories(*), variants:product_variants(*)")
      .eq("is_active", true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(24);
    products = (data as Product[]) ?? [];
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-extrabold text-white">Search the store</h1>
      <form className="mt-6 max-w-xl" action="/search">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search products, e.g. V-Bucks, rank boost…"
            className="input py-3 pl-12"
            autoFocus
          />
        </div>
      </form>

      <div className="mt-10">
        {query && products.length === 0 ? (
          <EmptyState
            icon={<Search className="h-10 w-10" />}
            title={`No results for “${query}”`}
            description="Try a different keyword or browse by game instead."
          />
        ) : products.length > 0 ? (
          <>
            <p className="mb-6 text-sm text-zinc-500">
              {products.length} {products.length === 1 ? "result" : "results"}{" "}
              for “{query}”
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
