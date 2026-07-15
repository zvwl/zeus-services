"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Lock, Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui";
import { BuyBoxSlider } from "@/components/BuyBoxSlider";
import { useCurrency } from "@/components/CurrencyProvider";
import { useCart } from "@/components/CartProvider";
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

interface BuyAddon {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

/** Price text that does a quick fade/slide tick whenever the value changes. */
function AnimatedPrice({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex overflow-hidden", className)}>
      {/* key remount re-runs the fade-up keyframes on every price change.
          Inline overrides (not arbitrary variants) because Tailwind emits
          arbitrary properties before named utilities, so the animate-fade-up
          shorthand would win over a [animation-duration:…] class. */}
      <span
        key={text}
        className="inline-block animate-fade-up tabular-nums"
        style={{ animationDuration: "0.18s", animationTimingFunction: "ease-out" }}
      >
        {text}
      </span>
    </span>
  );
}

export function BuyBox({
  product,
  variants,
  fields,
  addons,
}: {
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    gameName: string | null;
    basePrice: number;
    compareAtPrice: number | null;
    stock: number | null;
    deliveryType: "instant" | "manual";
    pricingMode: "fixed" | "custom";
    customUnitLabel: string | null;
    customPricePerUnit: number | null;
    customMin: number | null;
    customMax: number | null;
    customStep: number | null;
  };
  variants: BuyVariant[];
  fields: BuyField[];
  addons: BuyAddon[];
}) {
  const { currency, format } = useCurrency();
  const { addLine, open } = useCart();

  const isCustom =
    product.pricingMode === "custom" && product.customPricePerUnit != null;
  const min = Math.max(0, product.customMin ?? 1);
  const max = Math.max(min, product.customMax ?? Math.max(min, 1000));
  const step =
    product.customStep && product.customStep > 0 ? product.customStep : 1;
  const perUnit = product.customPricePerUnit ?? 0;
  const clamp = (n: number) =>
    Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;

  const [variantId, setVariantId] = useState<string | null>(
    variants.find((v) => v.stock === null || v.stock > 0)?.id ??
      variants[0]?.id ??
      null
  );
  const [amount, setAmount] = useState<number>(min);
  const [qty, setQty] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mobile sticky bar: hidden while the in-box CTAs are on screen, so the
  // action never appears twice at once.
  const boxRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [barHidden, setBarHidden] = useState(true);
  useEffect(() => {
    const el = actionsRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setBarHidden(entry.isIntersecting),
      { rootMargin: "0px 0px -72px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const selected = variants.find((v) => v.id === variantId) ?? null;
  const unitUsd = isCustom
    ? amount * perUnit
    : selected
      ? selected.price
      : product.basePrice;
  const compareUsd = isCustom
    ? null
    : selected
      ? selected.compareAtPrice
      : product.compareAtPrice;
  const stock = isCustom ? null : selected ? selected.stock : product.stock;
  const soldOut = stock !== null && stock <= 0;
  const maxQty = stock === null ? 99 : Math.min(99, stock);
  const effectiveQty = isCustom ? 1 : qty;

  const chosenAddons = useMemo(
    () => addons.filter((a) => selectedAddons.has(a.id)),
    [addons, selectedAddons]
  );
  const addonTotal = chosenAddons.reduce((s, a) => s + a.price, 0);
  const lineTotal = unitUsd * effectiveQty + addonTotal;
  const customLabel = `${amount.toLocaleString()} ${
    product.customUnitLabel || "units"
  }`;

  const missingRequired = useMemo(
    () => fields.filter((f) => f.required && !(values[f.label] ?? "").trim()),
    [fields, values]
  );

  function validate() {
    if (missingRequired.length > 0) {
      setError(
        `Please fill in: ${missingRequired.map((f) => f.label).join(", ")}`
      );
      return false;
    }
    return true;
  }

  function scrollToBox() {
    boxRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleAddon(id: string) {
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addToCart(opts?: { fromBar?: boolean }) {
    setError(null);
    if (!validate()) {
      if (opts?.fromBar) scrollToBox();
      return;
    }
    addLine({
      productId: product.id,
      slug: product.slug,
      name: product.gameName
        ? `${product.gameName} — ${product.name}`
        : product.name,
      imageUrl: product.imageUrl,
      variantId: isCustom ? null : variantId,
      variantName: isCustom ? null : (selected?.name ?? null),
      unitPriceUsd: unitUsd,
      quantity: effectiveQty,
      deliveryType: product.deliveryType,
      customFields: values,
      customAmount: isCustom ? amount : null,
      customLabel: isCustom ? customLabel : null,
      addons: chosenAddons.map((a) => ({
        id: a.id,
        name: a.name,
        price: a.price,
      })),
    });
    trackEvent("add_to_cart", {
      currency: "USD",
      value: Math.round(lineTotal * 100) / 100,
      items: [{ item_id: product.id, item_name: product.name, quantity: effectiveQty }],
    });
    open();
  }

  async function buy(opts?: { fromBar?: boolean }) {
    setError(null);
    if (!validate()) {
      if (opts?.fromBar) scrollToBox();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: isCustom ? null : variantId,
          quantity: effectiveQty,
          currency,
          customFields: values,
          customAmount: isCustom ? amount : undefined,
          addonIds: chosenAddons.map((a) => a.id),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Checkout failed");
      trackEvent("begin_checkout", {
        currency: "USD",
        value: Math.round(lineTotal * 100) / 100,
        items: [{ item_id: product.id, item_name: product.name, quantity: effectiveQty }],
      });
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoading(false);
      if (opts?.fromBar) scrollToBox();
    }
  }

  return (
    <>
      <div ref={boxRef} className="glass scroll-mt-24 p-6">
        {/* Custom-amount slider */}
        {isCustom && (
          <div className="mb-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="label mb-0">
                Choose amount
                {product.customUnitLabel ? ` (${product.customUnitLabel})` : ""}
              </p>
              <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                {/* The currency formatter rounds to 2dp, so sub-cent unit
                    prices (e.g. $0.005) would display as an overstated
                    "$0.01 / unit" — show the per-1,000 price instead. */}
                {perUnit < 0.01
                  ? `${format(perUnit * 1000)} / 1,000 ${
                      product.customUnitLabel || "units"
                    }`
                  : `${format(perUnit)} / ${product.customUnitLabel || "unit"}`}
              </span>
            </div>
            <BuyBoxSlider
              min={min}
              max={max}
              step={step}
              value={amount}
              onChange={(n) => setAmount(clamp(n))}
              ariaLabel={`Amount${
                product.customUnitLabel ? ` (${product.customUnitLabel})` : ""
              }`}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <input
                type="number"
                min={min}
                max={max}
                step={step}
                value={amount}
                onChange={(e) => setAmount(clamp(Number(e.target.value)))}
                className="input w-36 tabular-nums"
                aria-label="Exact amount"
              />
              <AnimatedPrice
                text={format(amount * perUnit)}
                className="text-lg font-bold text-primary-light"
              />
            </div>
          </div>
        )}

        {/* Fixed variants */}
        {!isCustom && variants.length > 0 && (
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
                      "min-h-[44px] rounded-xl border px-3 py-2.5 text-left transition",
                      variantId === v.id
                        ? "border-primary bg-primary/15 shadow-glow-sm ring-2 ring-primary/20"
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

        {/* Add-ons */}
        {addons.length > 0 && (
          <div className="mb-5">
            <p className="label">Add to your order</p>
            <div className="space-y-2">
              {addons.map((a) => (
                <label
                  key={a.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition",
                    selectedAddons.has(a.id)
                      ? "border-primary bg-primary/10"
                      : "border-edge bg-raised/40 hover:border-primary/40"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedAddons.has(a.id)}
                    onChange={() => toggleAddon(a.id)}
                    className="mt-0.5 h-4 w-4 accent-violet-500"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white">{a.name}</span>
                      <span className="shrink-0 text-sm font-semibold text-primary-light">
                        +{format(a.price)}
                      </span>
                    </span>
                    {a.description && (
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {a.description}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Custom checkout questions */}
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
          {isCustom ? (
            <span className="text-sm text-zinc-500">{customLabel}</span>
          ) : (
            <div className="flex items-center gap-1 rounded-xl border border-edge bg-raised p-1">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-surface hover:text-white sm:h-9 sm:w-9"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-semibold tabular-nums text-white">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-surface hover:text-white sm:h-9 sm:w-9"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="text-right">
            {compareUsd != null && compareUsd > unitUsd && (
              <span className="mr-2 text-sm text-zinc-500 line-through">
                {format(compareUsd * effectiveQty + addonTotal)}
              </span>
            )}
            <AnimatedPrice
              text={format(lineTotal)}
              className="text-2xl font-extrabold text-white"
            />
            <p className="text-xs text-zinc-500">
              incl. all fees · paying in {currency}
            </p>
          </div>
        </div>

        {stock !== null && stock > 0 && stock <= 10 && (
          <p className="mb-3 text-xs font-medium text-amber-300">
            Only {stock} left in stock
          </p>
        )}
        {error && (
          <p className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div ref={actionsRef} className="space-y-2">
          <Button
            size="lg"
            className="w-full"
            disabled={loading || soldOut}
            onClick={() => addToCart()}
          >
            <ShoppingCart className="h-5 w-5" />
            {soldOut ? "Sold out" : "Add to cart"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            disabled={loading || soldOut}
            onClick={() => buy()}
          >
            {loading ? "Redirecting to checkout…" : "Buy now"}
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-zinc-500">
          Secure payment via Stripe · Apple Pay & Google Pay supported
        </p>
      </div>

      {/* Mobile sticky action bar — keeps price + CTA reachable while the buy
          box itself is scrolled away. Hidden on lg+ (the box is sticky there). */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-bg/95 backdrop-blur transition-transform duration-300 lg:hidden",
          barHidden ? "translate-y-full" : "translate-y-0"
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-hidden={barHidden}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-zinc-500">
              {isCustom ? customLabel : (selected?.name ?? product.name)}
            </p>
            <AnimatedPrice
              text={format(lineTotal)}
              className="text-lg font-extrabold text-white"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              className="h-11 w-11 p-0"
              disabled={loading || soldOut}
              onClick={() => addToCart({ fromBar: true })}
              aria-label="Add to cart"
              tabIndex={barHidden ? -1 : 0}
            >
              <ShoppingCart className="h-5 w-5" />
            </Button>
            <Button
              className="h-11 px-5"
              disabled={loading || soldOut}
              onClick={() => buy({ fromBar: true })}
              tabIndex={barHidden ? -1 : 0}
            >
              <Zap className="h-4 w-4" fill="currentColor" />
              {soldOut ? "Sold out" : loading ? "Redirecting…" : "Buy now"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
