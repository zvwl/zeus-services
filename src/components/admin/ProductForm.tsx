"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CircleDollarSign,
  GripVertical,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { upsertProduct, type ProductPayload } from "@/app/admin/actions";
import { BuyBoxSlider } from "@/components/BuyBoxSlider";
import { ImageUpload } from "@/components/ImageUpload";
import { Badge, Button, Card } from "@/components/ui";
import { formatMoney } from "@/lib/currency";
import { cn, slugify } from "@/lib/utils";
import type { Category, Game, Product } from "@/lib/types";

/**
 * Live, interactive replica of the storefront BuyBox custom-amount slider.
 * Uses the same clamping + pricing math (amount × price per unit, USD) so the
 * preview is exactly what buyers will see.
 */
function SliderPreview({
  unitLabel,
  min: rawMin,
  max: rawMax,
  step: rawStep,
  perUnit,
}: {
  unitLabel: string;
  min: number;
  max: number;
  step: number;
  perUnit: number;
}) {
  // Mirror BuyBox: clamp min to ≥0, max to ≥min, step to >0.
  const min = Math.max(0, rawMin);
  const max = Math.max(min, rawMax);
  const step = rawStep > 0 ? rawStep : 1;
  const clamp = (n: number) =>
    Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;

  const [amount, setAmount] = useState(min);
  const shown = clamp(amount);
  const label = `${shown.toLocaleString()} ${unitLabel || "units"}`;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Badge variant="primary">Live preview — what buyers see</Badge>
        <span className="text-xs text-zinc-500">
          {formatMoney(min * perUnit, "USD")} – {formatMoney(max * perUnit, "USD")}
        </span>
      </div>
      <p className="label">
        Choose amount{unitLabel ? ` (${unitLabel})` : ""}
      </p>
      <BuyBoxSlider
        min={min}
        max={max}
        step={step}
        value={shown}
        onChange={(n) => setAmount(clamp(n))}
        ariaLabel="Preview amount"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={shown}
          onChange={(e) => setAmount(clamp(Number(e.target.value)))}
          className="input w-36"
          aria-label="Preview amount (typed)"
        />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-primary/20 pt-3">
        <span className="text-sm text-zinc-500">{label}</span>
        <span className="text-2xl font-extrabold text-white">
          {formatMoney(shown * perUnit, "USD")}
        </span>
      </div>
      <p className="mt-1 text-right text-xs text-zinc-600">
        Buyers pay in their own currency — converted from this USD price.
      </p>
    </div>
  );
}

interface VariantDraft {
  id?: string;
  name: string;
  price: string;
  compare_at_price: string;
  stock: string;
}

interface FieldDraft {
  id?: string;
  label: string;
  field_type: "text" | "email" | "password" | "select" | "textarea";
  placeholder: string;
  options: string;
  required: boolean;
}

interface AddonDraft {
  id?: string;
  name: string;
  description: string;
  price: string;
}

export function ProductForm({
  product,
  games,
  categories,
}: {
  product: Product | null;
  games: Game[];
  categories: Category[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [gameId, setGameId] = useState(product?.game_id ?? games[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(
    product?.category_id ?? categories[0]?.id ?? ""
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [metaTitle, setMetaTitle] = useState(product?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(
    product?.meta_description ?? ""
  );
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url ?? null);
  const [basePrice, setBasePrice] = useState(String(product?.base_price ?? "9.99"));
  const [compareAt, setCompareAt] = useState(
    product?.compare_at_price ? String(product.compare_at_price) : ""
  );
  const [deliveryType, setDeliveryType] = useState<"instant" | "manual">(
    product?.delivery_type ?? "manual"
  );
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    product?.delivery_instructions ?? ""
  );
  const [stock, setStock] = useState(
    product?.stock === null || product?.stock === undefined ? "" : String(product.stock)
  );
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);

  const [variants, setVariants] = useState<VariantDraft[]>(
    (product?.variants ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => ({
        id: v.id,
        name: v.name,
        price: String(v.price),
        compare_at_price: v.compare_at_price ? String(v.compare_at_price) : "",
        stock: v.stock === null ? "" : String(v.stock),
      }))
  );
  const [fields, setFields] = useState<FieldDraft[]>(
    (product?.fields ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((f) => ({
        id: f.id,
        label: f.label,
        field_type: f.field_type,
        placeholder: f.placeholder ?? "",
        options: (f.options ?? []).join(", "),
        required: f.required,
      }))
  );

  const [pricingMode, setPricingMode] = useState<"fixed" | "custom">(
    product?.pricing_mode === "custom" ? "custom" : "fixed"
  );
  const [customUnitLabel, setCustomUnitLabel] = useState(
    product?.custom_unit_label ?? ""
  );
  const [customPricePerUnit, setCustomPricePerUnit] = useState(
    product?.custom_price_per_unit != null
      ? String(product.custom_price_per_unit)
      : ""
  );
  const [customMin, setCustomMin] = useState(
    product?.custom_min != null ? String(product.custom_min) : ""
  );
  const [customMax, setCustomMax] = useState(
    product?.custom_max != null ? String(product.custom_max) : ""
  );
  const [customStep, setCustomStep] = useState(
    product?.custom_step != null ? String(product.custom_step) : ""
  );
  const [addons, setAddons] = useState<AddonDraft[]>(
    (product?.addons ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description ?? "",
        price: String(a.price),
      }))
  );

  // ── Custom-amount (slider) inline validation ─────────────────────────────
  // Mirrors what the storefront BuyBox expects so what staff configure here is
  // exactly what buyers get.
  const nPpu = customPricePerUnit === "" ? null : Number(customPricePerUnit);
  const nMin = customMin === "" ? null : Number(customMin);
  const nMax = customMax === "" ? null : Number(customMax);
  const nStep = customStep === "" ? null : Number(customStep);

  const ppuError =
    nPpu === null || !Number.isFinite(nPpu)
      ? "Enter the price of one unit."
      : nPpu <= 0
        ? "Price per unit must be greater than 0."
        : null;
  const minError =
    nMin === null || !Number.isFinite(nMin)
      ? "Enter the smallest amount a buyer can pick."
      : nMin < 0
        ? "Minimum can't be negative."
        : null;
  const maxError =
    nMax === null || !Number.isFinite(nMax)
      ? "Enter the largest amount a buyer can pick."
      : nMin !== null && Number.isFinite(nMin) && nMax <= nMin
        ? "Maximum must be greater than the minimum."
        : null;
  let stepError: string | null = null;
  if (nStep === null || !Number.isFinite(nStep)) {
    stepError = "Enter the slider increment.";
  } else if (nStep <= 0) {
    stepError = "Step must be greater than 0.";
  } else if (!minError && !maxError && nMin !== null && nMax !== null) {
    const ratio = (nMax - nMin) / nStep;
    // Relative epsilon: a fixed 1e-9 false-positives for large ranges (e.g.
    // min=0, max=10,000,000, step=0.1) where float error alone exceeds it.
    if (Math.abs(Math.round(ratio) - ratio) > 1e-9 * Math.max(1, Math.abs(ratio))) {
      stepError =
        "Step must divide the range evenly — (max − min) ÷ step has to be a whole number, or the slider can never reach the maximum.";
    }
  }
  const customValid = !ppuError && !minError && !maxError && !stepError;

  function submit() {
    setMsg(null);
    if (pricingMode === "custom" && !customValid) {
      setMsg({
        ok: false,
        text: "Fix the highlighted custom-amount settings before saving.",
      });
      return;
    }
    const payload: ProductPayload = {
      id: product?.id,
      game_id: gameId,
      category_id: categoryId,
      name,
      slug: slug || slugify(name),
      description,
      meta_title: metaTitle,
      meta_description: metaDescription,
      image_url: imageUrl,
      base_price: Number(basePrice),
      compare_at_price: compareAt ? Number(compareAt) : null,
      delivery_type: deliveryType,
      delivery_instructions: deliveryInstructions,
      stock: stock === "" ? null : Number(stock),
      is_active: isActive,
      is_featured: isFeatured,
      variants: variants.map((v) => ({
        id: v.id,
        name: v.name,
        price: Number(v.price),
        compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
        stock: v.stock === "" ? null : Number(v.stock),
      })),
      fields: fields.map((f) => ({
        id: f.id,
        label: f.label,
        field_type: f.field_type,
        placeholder: f.placeholder,
        options: f.options
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean),
        required: f.required,
      })),
      addons: addons.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        price: Number(a.price),
      })),
      pricing_mode: pricingMode,
      custom_unit_label: customUnitLabel || null,
      custom_price_per_unit:
        customPricePerUnit !== "" ? Number(customPricePerUnit) : null,
      custom_min: customMin !== "" ? Number(customMin) : null,
      custom_max: customMax !== "" ? Number(customMax) : null,
      custom_step: customStep !== "" ? Number(customStep) : null,
    };
    startTransition(async () => {
      const res = await upsertProduct(JSON.stringify(payload));
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok && !product) {
        router.push(`/admin/products/${res.id}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <h2 className="font-bold text-white">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Name *</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="V-Bucks Top-Up"
            />
          </div>
          <div>
            <label className="label">Slug</label>
            <input
              className="input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={slugify(name) || "auto-generated"}
            />
          </div>
          <div>
            <label className="label">Game *</label>
            <select
              className="input"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
            >
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Category *</label>
            <select
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Description (Markdown supported)</label>
          <textarea
            className="input min-h-[120px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does the customer get? Delivery time? Requirements?"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Meta title (SERP override)</label>
            <input
              className="input"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              maxLength={70}
              placeholder="Leave blank for “Game Product-name”"
            />
          </div>
          <div>
            <label className="label">Meta description (SERP override)</label>
            <input
              className="input"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              maxLength={170}
              placeholder="~150 chars shown in Google — blank for description"
            />
          </div>
        </div>
        <ImageUpload
          folder="products"
          value={imageUrl}
          onChange={setImageUrl}
          label="Product image"
        />
      </Card>

      <Card className="space-y-4">
        <h2 className="font-bold text-white">Pricing & stock</h2>
        <div>
          <label className="label">How is this product priced?</label>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPricingMode("fixed")}
              aria-pressed={pricingMode === "fixed"}
              className={cn(
                "rounded-xl border p-4 text-left transition",
                pricingMode === "fixed"
                  ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                  : "border-edge bg-raised/40 hover:border-primary/40"
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <CircleDollarSign className="h-4 w-4 text-primary-light" />
                Fixed price / options
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                One set price, or a list of options (e.g. 1,000 / 2,800 V-Bucks)
                each with its own price and stock.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPricingMode("custom")}
              aria-pressed={pricingMode === "custom"}
              className={cn(
                "rounded-xl border p-4 text-left transition",
                pricingMode === "custom"
                  ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                  : "border-edge bg-raised/40 hover:border-primary/40"
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <SlidersHorizontal className="h-4 w-4 text-primary-light" />
                Custom amount (slider)
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                The buyer drags a slider to pick how much they want — price is
                amount × price per unit. Great for currency top-ups.
              </span>
            </button>
          </div>
        </div>
        {pricingMode === "fixed" ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Base price (USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
              />
              <p className="mt-1 text-xs text-zinc-600">
                Ignored when options below are used.
              </p>
            </div>
            <div>
              <label className="label">Compare-at price (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={compareAt}
                onChange={(e) => setCompareAt(e.target.value)}
                placeholder="Strikethrough price"
              />
            </div>
            <div>
              <label className="label">Stock</label>
              <input
                type="number"
                min="0"
                className="input"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Empty = unlimited"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Unit label</label>
                <input
                  className="input"
                  value={customUnitLabel}
                  onChange={(e) => setCustomUnitLabel(e.target.value)}
                  placeholder="e.g. V-Bucks, GTA$ millions, Credits"
                />
                <p className="mt-1 text-xs text-zinc-600">
                  What the buyer is choosing an amount of — shown next to the
                  slider. Falls back to “units” if left empty.
                </p>
              </div>
              <div>
                <label className="label">Price per unit (USD) *</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  className={cn("input", ppuError && "border-red-500/50")}
                  value={customPricePerUnit}
                  onChange={(e) => setCustomPricePerUnit(e.target.value)}
                  placeholder="0.01"
                />
                <p className={cn("mt-1 text-xs", ppuError ? "text-red-400" : "text-zinc-600")}>
                  {ppuError ??
                    "What one unit costs. E.g. 0.005 = $5.00 per 1,000 units."}
                </p>
              </div>
              <div>
                <label className="label">Minimum amount *</label>
                <input
                  type="number"
                  min="0"
                  className={cn("input", minError && "border-red-500/50")}
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  placeholder="1000"
                />
                <p className={cn("mt-1 text-xs", minError ? "text-red-400" : "text-zinc-600")}>
                  {minError ?? "Where the slider starts."}
                </p>
              </div>
              <div>
                <label className="label">Maximum amount *</label>
                <input
                  type="number"
                  min="0"
                  className={cn("input", maxError && "border-red-500/50")}
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  placeholder="100000"
                />
                <p className={cn("mt-1 text-xs", maxError ? "text-red-400" : "text-zinc-600")}>
                  {maxError ?? "Where the slider ends."}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Step *</label>
                <input
                  type="number"
                  min="0"
                  className={cn("input sm:max-w-[240px]", stepError && "border-red-500/50")}
                  value={customStep}
                  onChange={(e) => setCustomStep(e.target.value)}
                  placeholder="500"
                />
                <p className={cn("mt-1 text-xs", stepError ? "text-red-400" : "text-zinc-600")}>
                  {stepError ??
                    "How much the slider jumps per notch. Must divide the min–max range evenly."}
                </p>
              </div>
            </div>

            {customValid ? (
              <SliderPreview
                unitLabel={customUnitLabel}
                min={nMin!}
                max={nMax!}
                step={nStep!}
                perUnit={nPpu!}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-edge bg-raised/30 p-4 text-sm text-zinc-500">
                Fill in the fields above to see a live preview of the slider
                buyers will get.
              </div>
            )}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Delivery type</label>
            <select
              className="input"
              value={deliveryType}
              onChange={(e) =>
                setDeliveryType(e.target.value as "instant" | "manual")
              }
            >
              <option value="manual">Manual — staff completes each order</option>
              <option value="instant">Instant — auto-delivered on payment</option>
            </select>
          </div>
          <div>
            <label className="label">
              {deliveryType === "instant"
                ? "Instant delivery message *"
                : "Internal delivery notes"}
            </label>
            <input
              className="input"
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              placeholder={
                deliveryType === "instant"
                  ? "Sent to the buyer automatically after payment"
                  : "Optional notes for staff"
              }
            />
          </div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-violet-500"
            />
            Active (visible in store)
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 accent-violet-500"
            />
            Featured on homepage
          </label>
        </div>
      </Card>

      {pricingMode === "fixed" && (
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">Options / amounts</h2>
            <p className="text-xs text-zinc-500">
              e.g. “1,000 V-Bucks”, “2,800 V-Bucks” — each with its own price and
              stock. Leave empty for a single-price product.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setVariants((v) => [
                ...v,
                { name: "", price: "", compare_at_price: "", stock: "" },
              ])
            }
          >
            <Plus className="h-4 w-4" /> Add option
          </Button>
        </div>
        {variants.map((v, i) => (
          <div
            key={v.id ?? `new-${i}`}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-edge bg-raised/40 p-3"
          >
            <GripVertical className="h-4 w-4 shrink-0 text-zinc-600" />
            <input
              className="input min-w-[160px] flex-1"
              placeholder="Option name (e.g. 1,000 V-Bucks)"
              value={v.name}
              onChange={(e) =>
                setVariants((arr) =>
                  arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))
                )
              }
            />
            <input
              type="number"
              step="0.01"
              className="input w-28"
              placeholder="Price $"
              value={v.price}
              onChange={(e) =>
                setVariants((arr) =>
                  arr.map((x, j) => (j === i ? { ...x, price: e.target.value } : x))
                )
              }
            />
            <input
              type="number"
              step="0.01"
              className="input w-28"
              placeholder="Was $"
              value={v.compare_at_price}
              onChange={(e) =>
                setVariants((arr) =>
                  arr.map((x, j) =>
                    j === i ? { ...x, compare_at_price: e.target.value } : x
                  )
                )
              }
            />
            <input
              type="number"
              className="input w-24"
              placeholder="Stock ∞"
              value={v.stock}
              onChange={(e) =>
                setVariants((arr) =>
                  arr.map((x, j) => (j === i ? { ...x, stock: e.target.value } : x))
                )
              }
            />
            <button
              type="button"
              onClick={() => setVariants((arr) => arr.filter((_, j) => j !== i))}
              className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
              aria-label="Remove option"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </Card>
      )}

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">Checkout questions</h2>
            <p className="text-xs text-zinc-500">
              Details collected from the buyer — e.g. “Epic Games username”,
              “Current rank”, “Account email”.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setFields((f) => [
                ...f,
                {
                  label: "",
                  field_type: "text",
                  placeholder: "",
                  options: "",
                  required: true,
                },
              ])
            }
          >
            <Plus className="h-4 w-4" /> Add question
          </Button>
        </div>
        {fields.map((f, i) => (
          <div
            key={f.id ?? `new-${i}`}
            className="space-y-2 rounded-xl border border-edge bg-raised/40 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="input min-w-[180px] flex-1"
                placeholder="Label (e.g. Epic Games username)"
                value={f.label}
                onChange={(e) =>
                  setFields((arr) =>
                    arr.map((x, j) => (j === i ? { ...x, label: e.target.value } : x))
                  )
                }
              />
              <select
                className="input w-32"
                value={f.field_type}
                onChange={(e) =>
                  setFields((arr) =>
                    arr.map((x, j) =>
                      j === i
                        ? { ...x, field_type: e.target.value as FieldDraft["field_type"] }
                        : x
                    )
                  )
                }
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="password">Password</option>
                <option value="select">Dropdown</option>
                <option value="textarea">Long text</option>
              </select>
              <label className="flex items-center gap-1.5 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={f.required}
                  onChange={(e) =>
                    setFields((arr) =>
                      arr.map((x, j) =>
                        j === i ? { ...x, required: e.target.checked } : x
                      )
                    )
                  }
                  className="h-3.5 w-3.5 accent-violet-500"
                />
                Required
              </label>
              <button
                type="button"
                onClick={() => setFields((arr) => arr.filter((_, j) => j !== i))}
                className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                aria-label="Remove question"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                className="input flex-1"
                placeholder="Placeholder text"
                value={f.placeholder}
                onChange={(e) =>
                  setFields((arr) =>
                    arr.map((x, j) =>
                      j === i ? { ...x, placeholder: e.target.value } : x
                    )
                  )
                }
              />
              {f.field_type === "select" && (
                <input
                  className="input flex-1"
                  placeholder="Options, comma-separated (e.g. Bronze, Silver, Gold)"
                  value={f.options}
                  onChange={(e) =>
                    setFields((arr) =>
                      arr.map((x, j) =>
                        j === i ? { ...x, options: e.target.value } : x
                      )
                    )
                  }
                />
              )}
            </div>
          </div>
        ))}
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-white">Add-ons / bundles</h2>
            <p className="text-xs text-zinc-500">
              Optional extras a buyer can tick at checkout — e.g. “+1,000 bonus
              gold”, “Express delivery”, a second item.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setAddons((a) => [...a, { name: "", description: "", price: "" }])
            }
          >
            <Plus className="h-4 w-4" /> Add bundle
          </Button>
        </div>
        {addons.map((a, i) => (
          <div
            key={a.id ?? `new-${i}`}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-edge bg-raised/40 p-3"
          >
            <input
              className="input min-w-[150px] flex-1"
              placeholder="Name (e.g. +1,000 bonus gold)"
              value={a.name}
              onChange={(e) =>
                setAddons((arr) =>
                  arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))
                )
              }
            />
            <input
              className="input min-w-[150px] flex-1"
              placeholder="Short description (optional)"
              value={a.description}
              onChange={(e) =>
                setAddons((arr) =>
                  arr.map((x, j) =>
                    j === i ? { ...x, description: e.target.value } : x
                  )
                )
              }
            />
            <input
              type="number"
              step="0.01"
              className="input w-28"
              placeholder="Price $"
              value={a.price}
              onChange={(e) =>
                setAddons((arr) =>
                  arr.map((x, j) => (j === i ? { ...x, price: e.target.value } : x))
                )
              }
            />
            <button
              type="button"
              onClick={() => setAddons((arr) => arr.filter((_, j) => j !== i))}
              className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
              aria-label="Remove add-on"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </Card>

      {msg && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            msg.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {msg.text}
        </p>
      )}

      <div className="flex gap-3">
        <Button size="lg" disabled={pending} onClick={submit}>
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </Button>
        {product && (
          <a
            href={`/product/${product.slug}`}
            target="_blank"
            className="inline-flex items-center rounded-xl border border-edge px-6 py-3 text-base font-medium text-zinc-300 hover:bg-raised"
          >
            View in store
          </a>
        )}
      </div>
    </div>
  );
}
