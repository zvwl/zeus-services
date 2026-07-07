import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink } from "@/components/ui";
import { ActionButton } from "@/components/admin/ActionControls";
import { AdminTable } from "@/components/admin/AdminTable";
import { deleteProduct, duplicateProduct } from "@/app/admin/actions";
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
        <div>
          <h1 className="text-2xl font-extrabold text-white">Products</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Everything you sell — prices, options, delivery and visibility.
          </p>
        </div>
        <ButtonLink href="/admin/products/new">
          <Plus className="h-4 w-4" /> New product
        </ButtonLink>
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
