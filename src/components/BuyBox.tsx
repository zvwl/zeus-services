"use client";

import { useMemo, useState } from "react";
import { Lock, Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui";
import { useCurrency } from "@/components/CurrencyProvider";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface BuyVariant {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  stock: number | null;
}

interface BuyField {
  id: string;
  label: string;
  fieldType: "text" | "email" | "password" | "select" | "textarea";
  placeholder: string | null;
  options: string[];
  required: boolean;
}

export function BuyBox({
  product,
  variants,
  fields,
}: {
  product: {
    id: string;
    name: string;
    basePrice: number;
    compareAtPrice: number | null;
    stock: number | null;
    deliveryType: "instant" | "manual";
  };
  variants: BuyVariant[];
  fields: BuyField[];
}) {
  const { currency, format } = useCurrency();
  const [variantId, setVariantId] = useState<string | null>(
    variants.find((v) => v.stock === null || v.stock > 0)?.id ??
      variants[0]?.id ??
      null
  );
  const [qty, setQty] = useState(1);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = variants.find((v) => v.id === variantId) ?? null;
  const unitUsd = selected ? selected.price : product.basePrice;
  const compareUsd = selected ? selected.compareAtPrice : product.compareAtPrice;
  const stock = selected ? selected.stock : product.stock;
  const soldOut = stock !== null && stock <= 0;
  const maxQty = stock === null ? 99 : Math.min(99, stock);

  const missingRequired = useMemo(
    () =>
      fields.filter(
        (f) => f.required && !(values[f.label] ?? "").trim()
      ),
    [fields, values]
  );

  async function buy() {
    setError(null);
    if (missingRequired.length > 0) {
      setError(`Please fill in: ${missingRequired.map((f) => f.label).join(", ")}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId,
          quantity: qty,
          currency,
          customFields: values,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Checkout failed");
      // Funnel: visitor started a Stripe checkout.
      trackEvent("begin_checkout", {
        currency: "USD",
        value: Math.round(unitUsd * qty * 100) / 100,
        items: [
          {
            item_id: product.id,
            item_name: `${product.name}${selected ? ` — ${selected.name}` : ""}`,
            quantity: qty,
          },
        ],
      });
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <div className="glass p-6">
      {variants.length > 0 && (
        <div className="mb-5">
          <p className="label">Choose an option</p>
          <div className="grid grid-cols-2 gap-2">
            {variants.map((v) => {
              const vSoldOut = v.stock !== null && v.stock <= 0;
              return (
                <button
                  key={v.id}
                  disabled={vSoldOut}
                  onClick={() => {
                    setVariantId(v.id);
                    setQty(1);
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition",
                    variantId === v.id
                      ? "border-primary bg-primary/15 ring-2 ring-primary/20"
                      : "border-edge bg-raised/50 hover:border-primary/40",
                    vSoldOut && "cursor-not-allowed opacity-40"
                  )}
                >
                  <span className="block text-sm font-medium text-white">
                    {v.name}
                  </span>
                  <span className="text-sm font-bold text-primary-light">
                    {format(v.price)}
                  </span>
                  {vSoldOut && (
                    <span className="ml-2 text-xs text-red-400">Sold out</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {fields.length > 0 && (
        <div className="mb-5 space-y-3">
          {fields.map((f) => (
            <div key={f.id}>
              <label className="label">
                {f.label}
                {f.required && <span className="text-red-400"> *</span>}
              </label>
              {f.fieldType === "select" ? (
                <select
                  className="input"
                  value={values[f.label] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.label]: e.target.value }))
                  }
                >
                  <option value="">Select…</option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : f.fieldType === "textarea" ? (
                <textarea
                  className="input min-h-[90px]"
                  placeholder={f.placeholder ?? ""}
                  value={values[f.label] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.label]: e.target.value }))
                  }
                />
              ) : (
                <input
                  type={f.fieldType}
                  className="input"
                  placeholder={f.placeholder ?? ""}
                  value={values[f.label] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.label]: e.target.value }))
                  }
                />
              )}
            </div>
          ))}
          <p className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Lock className="h-3 w-3" /> Your details are encrypted and only
            visible to our delivery team.
          </p>
        </div>
      )}

      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-xl border border-edge bg-raised p-1">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="rounded-lg p-2 text-zinc-400 hover:bg-surface hover:text-white"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center font-semibold tabular-nums text-white">
            {qty}
          </span>
          <button
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            className="rounded-lg p-2 text-zinc-400 hover:bg-surface hover:text-white"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="text-right">
          {compareUsd != null && compareUsd > unitUsd && (
            <span className="mr-2 text-sm text-zinc-500 line-through">
              {format(compareUsd * qty)}
            </span>
          )}
          <span className="text-2xl font-extrabold text-white">
            {format(unitUsd * qty)}
          </span>
          <p className="text-xs text-zinc-500">
            incl. all fees · paying in {currency}
          </p>
        </div>
      </div>

      {stock !== null && stock > 0 && stock <= 10 && (
        <p className="mb-3 text-xs font-medium text-amber-300">
          ⚠ Only {stock} left in stock
        </p>
      )}
      {error && (
        <p className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={loading || soldOut}
        onClick={buy}
      >
        <ShoppingCart className="h-5 w-5" />
        {soldOut ? "Sold out" : loading ? "Redirecting to checkout…" : "Buy now"}
      </Button>
      <p className="mt-3 text-center text-xs text-zinc-500">
        Secure payment via Stripe · Apple Pay & Google Pay supported
      </p>
    </div>
  );
}
