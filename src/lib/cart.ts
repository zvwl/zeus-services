import type { CartLine } from "@/lib/types";

/**
 * Stable identity for a cart line. Two "add to cart" actions collapse onto the
 * same line only when product, variant AND custom fields all match — so a
 * boosting order with different credentials stays a separate line.
 */
export function cartLineKey(
  productId: string,
  variantId: string | null,
  customFields: Record<string, string>
) {
  const cf =
    customFields && Object.keys(customFields).length
      ? JSON.stringify(customFields)
      : "";
  return `${productId}::${variantId ?? ""}::${cf}`;
}

export function cartCount(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function cartSubtotalUsd(lines: CartLine[]) {
  return lines.reduce((sum, l) => sum + l.unitPriceUsd * l.quantity, 0);
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
