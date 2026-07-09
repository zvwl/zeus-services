import { NextResponse } from "next/server";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { convertFromUSD } from "@/lib/currency";
import { originFromRequest } from "@/lib/utils";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { Product, ProductField, ProductVariant } from "@/lib/types";
import type Stripe from "stripe";

export const runtime = "nodejs";

const MAX_LINES = 50;

// Random, non-sequential public order code (unambiguous alphabet — no 0/O/1/I/L).
function generateReference() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 7; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `ZS-${code}`;
}

function sanitizeFields(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([k, v]) => [
      String(k).slice(0, 100),
      String(v).slice(0, 500),
    ])
  );
}

interface RawItem {
  productId: string;
  variantId: string | null;
  quantity: number;
  customFields: Record<string, string>;
  customAmount: number | null;
  addonIds: string[];
}

interface PricedAddon {
  name: string;
  unitUsd: number;
  unitConverted: number;
}

// A line that has passed validation and pricing.
interface PricedLine {
  product: Product & { game: { name: string } | null };
  variant: ProductVariant | null;
  quantity: number;
  customFields: Record<string, string>;
  unitUsd: number;
  unitConverted: number;
  customLabel: string | null;
  addons: PricedAddon[];
}

export async function POST(req: Request) {
  try {
    // Throttle order/session creation per IP (best effort).
    if (!rateLimit(`checkout:${clientIp(req)}`, 12, 60_000)) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    if (!stripeConfigured()) {
      return NextResponse.json(
        { error: "Payments are not configured yet. Please try again later." },
        { status: 503 }
      );
    }
    if (!hasAdminClient()) {
      return NextResponse.json(
        { error: "Store backend is not configured yet." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const currency = String(body.currency ?? "USD").toUpperCase();
    const fromCart = Boolean(body.fromCart);

    // Accept either a multi-item cart (`items: [...]`) or a single product
    // (legacy "Buy now" shape). Normalise to one array.
    const rawList: unknown[] = Array.isArray(body.items)
      ? body.items
      : [
          {
            productId: body.productId,
            variantId: body.variantId,
            quantity: body.quantity,
            customFields: body.customFields,
            // "Buy now" for custom-amount products / add-ons carries these too.
            customAmount: body.customAmount,
            addonIds: body.addonIds,
          },
        ];

    if (rawList.length === 0 || rawList.length > MAX_LINES) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const items: RawItem[] = [];
    for (const r of rawList) {
      const o = (r ?? {}) as Record<string, unknown>;
      const productId = String(o.productId ?? "");
      const quantity = Math.floor(Number(o.quantity ?? 1));
      if (!productId || !Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
        return NextResponse.json({ error: "Invalid request." }, { status: 400 });
      }
      items.push({
        productId,
        variantId: o.variantId ? String(o.variantId) : null,
        quantity,
        customFields: sanitizeFields(o.customFields),
        customAmount:
          o.customAmount != null && o.customAmount !== ""
            ? Number(o.customAmount)
            : null,
        addonIds: Array.isArray(o.addonIds)
          ? o.addonIds.map((x) => String(x)).slice(0, 20)
          : [],
      });
    }

    // Signed-in user (optional — guest checkout is allowed).
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const db = createAdminClient();

    if (user) {
      const { data: profile } = await db
        .from("profiles")
        .select("is_banned")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.is_banned) {
        return NextResponse.json(
          { error: "Your account is suspended. Contact support." },
          { status: 403 }
        );
      }
    }

    // Server-side pricing — never trust the client. One rate lookup for all lines.
    const { data: rateRow } = await db
      .from("exchange_rates")
      .select("rate")
      .eq("code", currency)
      .maybeSingle();
    if (!rateRow) {
      return NextResponse.json({ error: "Unsupported currency." }, { status: 400 });
    }
    const rate = Number(rateRow.rate);

    // Validate + price every line.
    const priced: PricedLine[] = [];
    for (const item of items) {
      const { data: productData } = await db
        .from("products")
        .select("*, fields:product_fields(*), game:games(name), addons:product_addons(*)")
        .eq("id", item.productId)
        .eq("is_active", true)
        .maybeSingle();
      if (!productData) {
        return NextResponse.json(
          { error: "A product in your cart is no longer available." },
          { status: 404 }
        );
      }
      const product = productData as Product & { game: { name: string } | null };
      const isCustom =
        product.pricing_mode === "custom" &&
        product.custom_price_per_unit != null;

      let variant: ProductVariant | null = null;
      let unitUsd: number;
      let quantity = item.quantity;
      let customLabel: string | null = null;

      if (isCustom) {
        // Custom-amount pricing: price = amount × unit price, server-validated.
        const amount = Number(item.customAmount);
        const min = product.custom_min != null ? Number(product.custom_min) : 0;
        const max = product.custom_max != null ? Number(product.custom_max) : null;
        if (
          !Number.isFinite(amount) ||
          amount <= 0 ||
          amount < min ||
          (max != null && amount > max)
        ) {
          return NextResponse.json(
            { error: `Choose a valid amount for "${product.name}".` },
            { status: 400 }
          );
        }
        unitUsd = Number(product.custom_price_per_unit) * amount;
        quantity = 1;
        customLabel = `${amount.toLocaleString()} ${
          product.custom_unit_label || "units"
        }`;
      } else {
        if (item.variantId) {
          const { data: v } = await db
            .from("product_variants")
            .select("*")
            .eq("id", item.variantId)
            .eq("product_id", item.productId)
            .eq("is_active", true)
            .maybeSingle();
          if (!v) {
            return NextResponse.json(
              { error: `An option for "${product.name}" is no longer available.` },
              { status: 404 }
            );
          }
          variant = v as ProductVariant;
        }
        const stock = variant ? variant.stock : product.stock;
        if (stock !== null && stock < item.quantity) {
          return NextResponse.json(
            {
              error:
                stock <= 0
                  ? `"${product.name}" is sold out.`
                  : `Only ${stock} of "${product.name}" left in stock.`,
            },
            { status: 400 }
          );
        }
        unitUsd = Number(variant ? variant.price : product.base_price);
      }

      // Required custom fields (apply to both pricing modes)
      for (const field of (product.fields ?? []) as ProductField[]) {
        if (field.required && !(item.customFields[field.label] ?? "").trim()) {
          return NextResponse.json(
            { error: `"${field.label}" is required for "${product.name}".` },
            { status: 400 }
          );
        }
      }

      // Validate + price selected add-ons against the product's own list.
      const addons: PricedAddon[] = [];
      if (item.addonIds.length > 0) {
        const productAddons = (product.addons ?? []).filter(
          (a) => a.is_active && item.addonIds.includes(a.id)
        );
        for (const a of productAddons) {
          const aUsd = Number(a.price);
          addons.push({
            name: a.name,
            unitUsd: aUsd,
            unitConverted: convertFromUSD(aUsd, rate),
          });
        }
      }

      priced.push({
        product,
        variant,
        quantity,
        customFields: item.customFields,
        unitUsd,
        unitConverted: convertFromUSD(unitUsd, rate),
        customLabel,
        addons,
      });
    }

    const subtotalUsd =
      Math.round(
        priced.reduce(
          (s, l) =>
            s +
            l.unitUsd * l.quantity +
            l.addons.reduce((a, x) => a + x.unitUsd, 0),
          0
        ) * 100
      ) / 100;
    const total =
      Math.round(
        priced.reduce(
          (s, l) =>
            s +
            l.unitConverted * l.quantity +
            l.addons.reduce((a, x) => a + x.unitConverted, 0),
          0
        ) * 100
      ) / 100;

    const orderRow = {
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      status: "pending",
      currency,
      exchange_rate: rate,
      subtotal_usd: subtotalUsd,
      total,
    };
    // Insert with a unique reference, retrying on the rare code collision.
    let order: { id: string; order_number: number } | null = null;
    let orderError: { code?: string; message?: string } | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await db
        .from("orders")
        .insert({ ...orderRow, reference: generateReference() })
        .select("*")
        .single();
      if (!error && data) {
        order = data;
        break;
      }
      orderError = error;
      if (error?.code !== "23505") break; // not a reference collision
    }
    if (!order) {
      console.error("Order insert failed:", orderError);
      return NextResponse.json(
        { error: "Could not create order." },
        { status: 500 }
      );
    }

    const orderItemRows = priced.flatMap((l) => {
      const base = {
        order_id: order!.id,
        product_id: l.product.id,
        variant_id: l.variant?.id ?? null,
        product_name: `${l.product.game?.name ? `${l.product.game.name} — ` : ""}${l.product.name}`,
        variant_name: l.customLabel ?? l.variant?.name ?? null,
        quantity: l.quantity,
        unit_price: l.unitConverted,
        unit_price_usd: l.unitUsd,
        custom_fields: l.customFields,
      };
      // Each add-on becomes its own order line (no product reference).
      const addonRows = l.addons.map((a) => ({
        order_id: order!.id,
        product_id: null,
        variant_id: null,
        product_name: `${l.product.name} — add-on: ${a.name}`,
        variant_name: null,
        quantity: 1,
        unit_price: a.unitConverted,
        unit_price_usd: a.unitUsd,
        custom_fields: {},
      }));
      return [base, ...addonRows];
    });
    const { error: itemsError } = await db
      .from("order_items")
      .insert(orderItemRows);
    if (itemsError) {
      console.error("Order items insert failed:", itemsError);
      // Roll back the now-orphaned pending order so it doesn't linger.
      await db.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Could not create order." },
        { status: 500 }
      );
    }

    const origin = originFromRequest(req);
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      priced.flatMap((l) => {
        // Stripe rejects relative image URLs (products now use local
        // /media/*.webp art) — absolutize against the request origin, and a
        // malformed value must never take down the session call.
        const rawImg = l.product.image_url;
        const img = rawImg
          ? rawImg.startsWith("http")
            ? rawImg
            : rawImg.startsWith("/")
              ? `${origin}${rawImg}`
              : null
          : null;
        const main: Stripe.Checkout.SessionCreateParams.LineItem = {
          quantity: l.quantity,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: Math.round(l.unitConverted * 100),
            product_data: {
              name: `${l.product.name}${
                l.customLabel
                  ? ` — ${l.customLabel}`
                  : l.variant
                    ? ` — ${l.variant.name}`
                    : ""
              }`,
              ...(img ? { images: [img] } : {}),
              metadata: { product_id: l.product.id },
            },
          },
        };
        // Skip free add-ons in Stripe (a $0 line item is rejected) — they still
        // appear as order lines and get delivered.
        const addonItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
          l.addons
            .filter((a) => a.unitConverted > 0)
            .map((a) => ({
              quantity: 1,
              price_data: {
                currency: currency.toLowerCase(),
                unit_amount: Math.round(a.unitConverted * 100),
                product_data: { name: `${l.product.name} — ${a.name}` },
              },
            }));
        return [main, ...addonItems];
      });

    const stripe = getStripe();
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        // Coupon/promo codes created in the Stripe dashboard work at checkout —
        // needed for coupon-site listings and the /discount-codes SEO play.
        allow_promotion_codes: true,
        line_items: lineItems,
        metadata: {
          type: "order",
          order_id: order.id,
          // Lets fulfillment clear the buyer's saved DB cart, but only for cart
          // checkouts (a single-item "Buy now" must leave the cart untouched).
          from_cart: fromCart ? "1" : "0",
        },
        customer_email: user?.email ?? undefined,
        // Abandoned sessions expire in 30 min (Stripe minimum); the
        // checkout.session.expired webhook then cancels the pending order.
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        // Return the buyer to the exact domain they're on so their session sticks.
        // `cart=1` tells the success page to clear the cart after a cart checkout.
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}${
          fromCart ? "&cart=1" : ""
        }`,
        // Use the unguessable order UUID (not the sequential order_number) so the
        // cancel page can't be used to enumerate + cancel other people's pending
        // orders. Guarded again by status='pending' on the update.
        cancel_url: `${origin}/checkout/cancelled?order=${order.id}`,
      });
    } catch (err) {
      // The pending order + items were already inserted — without a session
      // they can never be paid OR expired by the webhook, so roll them back
      // instead of stranding them in the admin order list.
      console.error("Stripe session create failed:", err);
      await db.from("order_items").delete().eq("order_id", order.id);
      await db.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Checkout failed. Please try again." },
        { status: 500 }
      );
    }

    await db
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Checkout failed. Please try again." },
      { status: 500 }
    );
  }
}
