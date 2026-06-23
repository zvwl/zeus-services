"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { Button } from "@/components/ui";
import { createCartCheckout } from "@/lib/checkout-client";

export function CartDrawer() {
  const { lines, subtotalUsd, isOpen, close, updateQty, removeLine } = useCart();
  const { format, currency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll + close on Escape while the drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

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

  return (
    <div
      className={`fixed inset-0 z-[60] ${isOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        onClick={close}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* Panel */}
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-edge bg-surface shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-edge px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <ShoppingCart className="h-5 w-5 text-primary-light" /> Your cart
          </h2>
          <button
            onClick={close}
            aria-label="Close cart"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-raised hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingCart className="h-10 w-10 text-zinc-700" />
            <p className="text-sm text-zinc-500">Your cart is empty.</p>
            <Button variant="outline" size="sm" onClick={close}>
              Continue shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-4">
                {lines.map((l) => (
                  <li key={l.key} className="flex gap-3">
                    <CartThumb src={l.imageUrl} alt={l.name} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${l.slug}`}
                        onClick={close}
                        className="line-clamp-2 text-sm font-medium text-white hover:text-primary-light"
                      >
                        {l.name}
                      </Link>
                      {l.variantName && (
                        <p className="text-xs text-zinc-500">{l.variantName}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1 rounded-lg border border-edge bg-raised p-0.5">
                          <button
                            onClick={() => updateQty(l.key, l.quantity - 1)}
                            className="rounded p-1 text-zinc-400 hover:bg-surface hover:text-white"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-7 text-center text-sm font-semibold tabular-nums text-white">
                            {l.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(l.key, l.quantity + 1)}
                            className="rounded p-1 text-zinc-400 hover:bg-surface hover:text-white"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {format(l.unitPriceUsd * l.quantity)}
                          </span>
                          <button
                            onClick={() => removeLine(l.key)}
                            aria-label="Remove item"
                            className="rounded p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-edge px-5 py-4">
              {error && (
                <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-zinc-400">Subtotal</span>
                <span className="text-lg font-bold text-white">
                  {format(subtotalUsd)}
                </span>
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={checkout}
                disabled={loading}
              >
                {loading ? "Redirecting to checkout…" : "Checkout"}
              </Button>
              <Link
                href="/cart"
                onClick={close}
                className="mt-2 block text-center text-xs text-zinc-500 hover:text-primary-light"
              >
                View full cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function CartThumb({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="h-16 w-16 shrink-0 rounded-lg border border-edge bg-gradient-to-br from-primary/20 to-surface" />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-16 w-16 shrink-0 rounded-lg border border-edge object-cover"
    />
  );
}
