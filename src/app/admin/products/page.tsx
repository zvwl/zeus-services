import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink } from "@/components/ui";
import { ActionButton } from "@/components/admin/ActionControls";
import { AdminTable } from "@/components/admin/AdminTable";
import { deleteProduct, duplicateProduct } from "@/app/admin/actions";
import { formatMoney } from "@/lib/currency";
import { cn, sanitizeSearchTerm } from "@/lib/utils";
import type { Game, Product } from "@/lib/types";

export const revalidate = 0;

const STATUS_FILTERS = ["all", "active", "hidden", "featured"];

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; game?: string; status?: string }>;
}) {
  const { q, game: gameSlug, status: statusRaw } = await searchParams;
  const search = (q ?? "").trim();
  const status = STATUS_FILTERS.includes(statusRaw ?? "") ? statusRaw! : "all";

  const supabase = await createClient();
  const { data: allGames } = await supabase
    .from("games")
    .select("id, name, slug")
    .order("sort_order");
  const games = (allGames as Pick<Game, "id" | "name" | "slug">[]) ?? [];
  const activeGame = games.find((g) => g.slug === gameSlug) ?? null;

  let query = supabase
    .from("products")
    .select("*, game:games(name), category:categories(name), variants:product_variants(id)")
    .order("created_at", { ascending: false });
  if (activeGame) query = query.eq("game_id", activeGame.id);
  if (status === "active") query = query.eq("is_active", true);
  else if (status === "hidden") query = query.eq("is_active", false);
  else if (status === "featured") query = query.eq("is_featured", true);
  const safe = sanitizeSearchTerm(search);
  if (safe) query = query.ilike("name", `%${safe}%`);

  const { data } = await query;
  const products = (data as Product[]) ?? [];

  const buildHref = (overrides: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (activeGame) params.set("game", activeGame.slug);
    if (status !== "all") params.set("status", status);
    if (search) params.set("q", search);
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Products</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Everything you sell — prices, options, delivery and visibility.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <form action="/admin/products" className="w-full sm:w-64">
            {activeGame && (
              <input type="hidden" name="game" value={activeGame.slug} />
            )}
            {status !== "all" && (
              <input type="hidden" name="status" value={status} />
            )}
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Search products…"
              className="input"
            />
          </form>
          <ButtonLink href="/admin/products/new" className="shrink-0">
            <Plus className="h-4 w-4" /> New product
          </ButtonLink>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={buildHref({ game: null })}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
            !activeGame
              ? "border-primary/50 bg-primary/15 text-primary-light"
              : "border-edge bg-raised/50 text-zinc-400 hover:text-white"
          )}
        >
          All games
        </Link>
        {games.map((g) => (
          <Link
            key={g.id}
            href={buildHref({ game: g.slug })}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
              activeGame?.id === g.id
                ? "border-primary/50 bg-primary/15 text-primary-light"
                : "border-edge bg-raised/50 text-zinc-400 hover:text-white"
            )}
          >
            {g.name}
          </Link>
        ))}
        <span aria-hidden className="mx-1 h-4 w-px bg-edge" />
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s}
            href={buildHref({ status: s === "all" ? null : s })}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition",
              status === s
                ? "border-primary/50 bg-primary/15 text-primary-light"
                : "border-edge bg-raised/50 text-zinc-400 hover:text-white"
            )}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <AdminTable
          minWidth={760}
          empty="No products yet — hit “New product” to create your first one."
          columns={[
            { header: "Product" },
            { header: "Game" },
            { header: "Category" },
            { header: "Price (USD)" },
            { header: "Stock" },
            { header: "Status" },
            { header: "" },
          ]}
          rows={products.map((p) => ({
            key: p.id,
            cells: [
              <span key="name">
                <Link
                  href={`/admin/products/${p.id}`}
                  className="font-medium text-primary-light hover:underline"
                >
                  {p.name}
                </Link>
                {(p.variants?.length ?? 0) > 0 && (
                  <span className="ml-2 text-xs text-zinc-600">
                    {p.variants!.length} options
                  </span>
                )}
                {p.pricing_mode === "custom" && (
                  <span className="ml-2 text-xs text-zinc-600">slider</span>
                )}
              </span>,
              <span key="game" className="text-zinc-400">
                {p.game?.name}
              </span>,
              <span key="cat" className="text-zinc-400">
                {p.category?.name}
              </span>,
              <span key="price" className="text-white">
                {p.pricing_mode === "custom" && p.custom_price_per_unit != null
                  ? `${formatMoney(
                      // Mirror the storefront fromPrice — a null custom_min
                      // must not show a $0.00 floor.
                      Math.max(1, Number(p.custom_min ?? 1)) *
                        Number(p.custom_price_per_unit),
                      "USD"
                    )}+`
                  : formatMoney(Number(p.base_price), "USD")}
              </span>,
              <span key="stock" className="text-zinc-400">
                {p.stock ?? "∞"}
              </span>,
              <span key="status" className="inline-flex gap-1.5">
                <Badge variant={p.is_active ? "success" : "danger"}>
                  {p.is_active ? "active" : "hidden"}
                </Badge>
                {p.is_featured && <Badge variant="gold">featured</Badge>}
              </span>,
              <span key="actions" className="inline-flex justify-end gap-1.5">
                <ActionButton
                  action={duplicateProduct}
                  fields={{ id: p.id }}
                  variant="outline"
                >
                  Duplicate
                </ActionButton>
                <ActionButton
                  action={deleteProduct}
                  fields={{ id: p.id }}
                  variant="danger"
                  confirmText={`Delete "${p.name}"? This cannot be undone.`}
                >
                  Delete
                </ActionButton>
              </span>,
            ],
          }))}
        />
      </div>
    </div>
  );
}
