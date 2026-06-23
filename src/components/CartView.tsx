"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { Button, ButtonLink, Card, EmptyState } from "@/components/ui";
import { lineTotalUsd } from "@/lib/cart";
import { createCartCheckout } from "@/lib/checkout-client";

export function CartView() {
  const { lines, subtotalUsd, count, ready, updateQty, removeLine } = useCart();
  const { format, currency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setError(null);
    setLoading(true);
    try {
      const url = await createCartCheckout(lines, currency);
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="h-40 animate-pulse rounded-2xl border border-edge bg-surface/60" />
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="h-10 w-10" />}
        title="Your cart is empty"
        description="Browse our games and services to find your next top-up, boost or account."
        action={<ButtonLink href="/games">Browse games</ButtonLink>}
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Items */}
      <div className="lg:col-span-2">
        <ul className="space-y-4">
          {lines.map((l) => {
            const fieldLabels = Object.keys(l.customFields ?? {});
            return (
              <li key={l.key} className="glass flex gap-4 p-4">
                <Thumb src={l.imageUrl} alt={l.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${l.slug}`}
                        className="font-medium text-white hover:text-primary-light"
                      >
                        {l.name}
                      </Link>
                      {l.variantName && (
                        <p className="text-sm text-zinc-500">{l.variantName}</p>
                      )}
                      {l.customLabel && (
                        <p className="text-sm text-primary-light">{l.customLabel}</p>
                      )}
                      <p className="mt-0.5 text-xs text-zinc-600">
                        {l.deliveryType === "instant"
                          ? "Instant delivery"
                          : "Manual delivery"}
                      </p>
                      {l.addons && l.addons.length > 0 && (
                        <p className="mt-1 text-xs text-zinc-500">
                          Add-ons: {l.addons.map((a) => a.name).join(", ")}
                        </p>
                      )}
                      {fieldLabels.length > 0 && (
                        <p className="mt-1 text-xs text-zinc-500">
                          Your info: {fieldLabels.join(", ")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeLine(l.key)}
                      aria-label="Remove item"
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    {l.customAmount != null ? (
                      <span className="text-xs text-zinc-500">Qty 1</span>
                    ) : (
                      <div className="flex items-center gap-1 rounded-lg border border-edge bg-raised p-0.5">
                        <button
                          onClick={() => updateQty(l.key, l.quantity - 1)}
                          className="rounded p-1.5 text-zinc-400 hover:bg-surface hover:text-white"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums text-white">
                          {l.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(l.key, l.quantity + 1)}
                          className="rounded p-1.5 text-zinc-400 hover:bg-surface hover:text-white"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    <div className="text-right">
                      <span className="font-semibold text-white">
                        {format(lineTotalUsd(l))}
                      </span>
                      {l.customAmount == null && l.quantity > 1 && (
                        <p className="text-xs text-zinc-500">
                          {format(l.unitPriceUsd)} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Summary */}
      <div className="lg:col-span-1">
        <Card className="lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-white">Order summary</h2>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-zinc-400">
              Subtotal ({count} item{count === 1 ? "" : "s"})
            </span>
            <span className="font-medium text-white">{format(subtotalUsd)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-edge pt-4">
            <span className="text-zinc-300">Total</span>
            <span className="text-xl font-bold text-white">
              {format(subtotalUsd)}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Charged in {currency} · taxes/fees calculated at checkout
          </p>

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <Button
            size="lg"
            className="mt-5 w-full"
            onClick={checkout}
            disabled={loading}
          >
            {loading ? "Redirecting to checkout…" : "Proceed to checkout"}
          </Button>
          <Link
            href="/games"
            className="mt-3 block text-center text-xs text-zinc-500 hover:text-primary-light"
          >
            Continue shopping
          </Link>
          <p className="mt-4 text-center text-xs text-zinc-500">
            Secure payment via Stripe · Apple Pay &amp; Google Pay
          </p>
        </Card>
      </div>
    </div>
  );
}

function Thumb({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="h-20 w-20 shrink-0 rounded-xl border border-edge bg-gradient-to-br from-primary/20 to-surface" />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-20 w-20 shrink-0 rounded-xl border border-edge object-cover"
    />
  );
}
