"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { cartLineKey } from "@/lib/cart";
import type { CartLine, DeliveryType } from "@/lib/types";

interface CartExtra {
  unitPriceUsd?: number;
  customAmount?: number | null;
  customLabel?: string | null;
  addons?: { id: string; name: string; price: number }[];
}

// Supabase has no generated types here, so the join comes back loosely typed.
interface CartRow {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  custom_fields: Record<string, string> | null;
  extra: CartExtra | null;
  product:
    | {
        name: string;
        slug: string;
        image_url: string | null;
        delivery_type: DeliveryType;
        base_price: number;
        game: { name: string } | { name: string }[] | null;
      }
    | null
    | Array<{
        name: string;
        slug: string;
        image_url: string | null;
        delivery_type: DeliveryType;
        base_price: number;
        game: { name: string } | { name: string }[] | null;
      }>;
  variant:
    | { name: string; price: number }
    | { name: string; price: number }[]
    | null;
}

const one = <T>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;

/**
 * Hydrate the signed-in user's saved cart from the DB (joining product/variant
 * for display). Returns [] for guests, or if the cart table isn't present yet
 * (migration pending) — the local cart still works in that case.
 */
export async function loadServerCart(): Promise<CartLine[]> {
  const user = await getUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      "product_id, variant_id, quantity, custom_fields, extra, product:products(name, slug, image_url, delivery_type, base_price, game:games(name)), variant:product_variants(name, price)"
    )
    .eq("user_id", user.id);
  if (error || !data) return [];

  return (data as unknown as CartRow[])
    .map((row): CartLine | null => {
      const p = one(row.product);
      if (!p) return null; // product was deleted — drop the line
      const v = one(row.variant);
      const game = one(p.game);
      const customFields = row.custom_fields ?? {};
      const extra = row.extra ?? {};
      const addons = extra.addons ?? [];
      const unitPriceUsd =
        typeof extra.unitPriceUsd === "number"
          ? extra.unitPriceUsd
          : Number(v?.price ?? p.base_price);
      return {
        key: cartLineKey(row.product_id, row.variant_id, customFields, {
          customAmount: extra.customAmount ?? null,
          addonIds: addons.map((a) => a.id),
        }),
        productId: row.product_id,
        slug: p.slug,
        name: game?.name ? `${game.name} — ${p.name}` : p.name,
        imageUrl: p.image_url,
        variantId: row.variant_id,
        variantName: v?.name ?? null,
        unitPriceUsd,
        quantity: row.quantity,
        deliveryType: p.delivery_type,
        customFields,
        customAmount: extra.customAmount ?? null,
        customLabel: extra.customLabel ?? null,
        addons,
      };
    })
    .filter((l): l is CartLine => l !== null);
}

/**
 * Replace the signed-in user's saved cart with `lines` (delete-all + insert —
 * carts are tiny). No-op for guests. Swallows errors so a missing table or a
 * transient failure never breaks the UI; the local cart remains the fallback.
 */
export async function saveServerCart(lines: CartLine[]): Promise<void> {
  const user = await getUser();
  if (!user) return;
  const supabase = await createClient();
  try {
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    if (lines.length > 0) {
      await supabase.from("cart_items").insert(
        lines.map((l) => ({
          user_id: user.id,
          product_id: l.productId,
          variant_id: l.variantId,
          quantity: Math.min(99, Math.max(1, l.quantity)),
          custom_fields: l.customFields ?? {},
          extra: {
            unitPriceUsd: l.unitPriceUsd,
            customAmount: l.customAmount ?? null,
            customLabel: l.customLabel ?? null,
            addons: l.addons ?? [],
          },
        }))
      );
    }
  } catch {
    // cart table may not exist yet (migration pending) — ignore.
  }
}
