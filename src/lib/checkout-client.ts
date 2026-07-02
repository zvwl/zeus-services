import type { CartLine } from "@/lib/types";

/**
 * Kick off a multi-item Stripe Checkout for the given cart lines. Returns the
 * hosted Checkout URL to redirect to. The server re-validates every price and
 * stock level — these lines are only references. `fromCart` makes the success
 * page clear the cart afterwards.
 */
export async function createCartCheckout(
  lines: CartLine[],
  currency: string
): Promise<string> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fromCart: true,
      currency,
      items: lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        quantity: l.quantity,
        customFields: l.customFields,
        // Forward flexible-listing selections so custom-amount products and
        // add-on bundles survive a cart checkout (the server re-prices them).
        customAmount: l.customAmount ?? null,
        addonIds: (l.addons ?? []).map((a) => a.id),
      })),
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Checkout failed");
  return json.url as string;
}
