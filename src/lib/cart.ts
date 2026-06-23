import type { CartLine } from "@/lib/types";

/**
 * Stable identity for a cart line. Two "add to cart" actions collapse onto the
 * same line only when product, variant AND custom fields all match — so a
 * boosting order with different credentials stays a separate line.
 */
export function cartLineKey(
  productId: string,
  variantId: string | null,
  customFields: Record<string, string>,
  extra?: { customAmount?: number | null; addonIds?: string[] }
) {
  const cf =
    customFields && Object.keys(customFields).length
      ? JSON.stringify(customFields)
      : "";
  const amt = extra?.customAmount != null ? `#${extra.customAmount}` : "";
  const ad =
    extra?.addonIds && extra.addonIds.length
      ? `+${[...extra.addonIds].sort().join("+")}`
      : "";
  return `${productId}::${variantId ?? ""}::${cf}${amt}${ad}`;
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

/** USD total for one line: base × quantity, plus any add-ons (once per line). */
export function lineTotalUsd(line: CartLine) {
  const addons = (line.addons ?? []).reduce((s, a) => s + a.price, 0);
  return line.unitPriceUsd * line.quantity + addons;
}

export function cartSubtotalUsd(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + lineTotalUsd(l), 0);
}

/**
 * Merge two carts by line key, taking the MAX quantity for shared lines (not the
 * sum) so that merging an unchanged local copy with the server copy is
 * idempotent — reloads can't make quantities creep upward. Server display data
 * (b) wins for shared lines since it's freshest.
 */
export function unionMaxCarts(a: CartLine[], b: CartLine[]): CartLine[] {
  const map = new Map<string, CartLine>();
  for (const line of a) map.set(line.key, { ...line });
  for (const line of b) {
    const existing = map.get(line.key);
    if (existing) {
      map.set(line.key, {
        ...line,
        quantity: Math.max(existing.quantity, line.quantity),
      });
    } else {
      map.set(line.key, { ...line });
    }
  }
  return [...map.values()];
}
