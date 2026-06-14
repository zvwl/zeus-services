import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink } from "@/components/ui";
import { ActionButton } from "@/components/admin/ActionControls";
import { deleteProduct } from "@/app/admin/actions";
import { formatMoney } from "@/lib/currency";
import type { Product } from "@/lib/types";

export const revalidate = 0;

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, game:games(name), category:categories(name), variants:product_variants(id)")
    .order("created_at", { ascending: false });
  const products = (data as Product[]) ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-white">Products</h1>
        <ButtonLink href="/admin/products/new">
          <Plus className="h-4 w-4" /> New product
        </ButtonLink>
      </div>

      <div className="glass mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Game</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price (USD)</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {products.map((p) => (
              <tr key={p.id} className="transition hover:bg-raised/40">
                <td className="px-4 py-3">
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
                </td>
                <td className="px-4 py-3 text-zinc-400">{p.game?.name}</td>
                <td className="px-4 py-3 text-zinc-400">{p.category?.name}</td>
                <td className="px-4 py-3 text-white">
                  {formatMoney(Number(p.base_price), "USD")}
                </td>
                <td className="px-4 py-3 text-zinc-400">{p.stock ?? "∞"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <Badge variant={p.is_active ? "success" : "danger"}>
                      {p.is_active ? "active" : "hidden"}
                    </Badge>
                    {p.is_featured && <Badge variant="gold">featured</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <ActionButton
                    action={deleteProduct}
                    fields={{ id: p.id }}
                    variant="danger"
                    confirmText={`Delete "${p.name}"? This cannot be undone.`}
                  >
                    Delete
                  </ActionButton>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                  No products yet — create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
