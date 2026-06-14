import { NextResponse } from "next/server";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { convertFromUSD } from "@/lib/currency";
import { siteUrl } from "@/lib/utils";
import type { Product, ProductField, ProductVariant } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
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
    const productId = String(body.productId ?? "");
    const variantId = body.variantId ? String(body.variantId) : null;
    const quantity = Math.floor(Number(body.quantity ?? 1));
    const currency = String(body.currency ?? "USD").toUpperCase();
    const customFields: Record<string, string> =
      body.customFields && typeof body.customFields === "object"
        ? Object.fromEntries(
            Object.entries(body.customFields).map(([k, v]) => [
              String(k).slice(0, 100),
              String(v).slice(0, 500),
            ])
          )
        : {};

    if (!productId || !Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
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

    const { data: productData } = await db
      .from("products")
      .select("*, fields:product_fields(*), game:games(name)")
      .eq("id", productId)
      .eq("is_active", true)
      .maybeSingle();
    if (!productData) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    const product = productData as Product & { game: { name: string } | null };

    let variant: ProductVariant | null = null;
    if (variantId) {
      const { data: v } = await db
        .from("product_variants")
        .select("*")
        .eq("id", variantId)
        .eq("product_id", productId)
        .eq("is_active", true)
        .maybeSingle();
      if (!v) {
        return NextResponse.json({ error: "Option not found." }, { status: 404 });
      }
      variant = v as ProductVariant;
    }

    // Stock validation
    const stock = variant ? variant.stock : product.stock;
    if (stock !== null && stock < quantity) {
      return NextResponse.json(
        { error: stock <= 0 ? "Sold out." : `Only ${stock} left in stock.` },
        { status: 400 }
      );
    }

    // Required custom fields
    for (const field of (product.fields ?? []) as ProductField[]) {
      if (field.required && !(customFields[field.label] ?? "").trim()) {
        return NextResponse.json(
          { error: `"${field.label}" is required.` },
          { status: 400 }
        );
      }
    }

    // Server-side pricing — never trust the client.
    const { data: rateRow } = await db
      .from("exchange_rates")
      .select("rate")
      .eq("code", currency)
      .maybeSingle();
    if (!rateRow) {
      return NextResponse.json({ error: "Unsupported currency." }, { status: 400 });
    }
    const rate = Number(rateRow.rate);
    const unitUsd = Number(variant ? variant.price : product.base_price);
    const unitConverted = convertFromUSD(unitUsd, rate);
    const total = Math.round(unitConverted * quantity * 100) / 100;

    const { data: order, error: orderError } = await db
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        email: user?.email ?? null,
        status: "pending",
        currency,
        exchange_rate: rate,
        subtotal_usd: Math.round(unitUsd * quantity * 100) / 100,
        total,
      })
      .select("*")
      .single();
    if (orderError || !order) {
      console.error("Order insert failed:", orderError);
      return NextResponse.json(
        { error: "Could not create order." },
        { status: 500 }
      );
    }

    await db.from("order_items").insert({
      order_id: order.id,
      product_id: product.id,
      variant_id: variant?.id ?? null,
      product_name: `${product.game?.name ? `${product.game.name} — ` : ""}${product.name}`,
      variant_name: variant?.name ?? null,
      quantity,
      unit_price: unitConverted,
      unit_price_usd: unitUsd,
      custom_fields: customFields,
    });

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: Math.round(unitConverted * 100),
            product_data: {
              name: `${product.name}${variant ? ` — ${variant.name}` : ""}`,
              ...(product.image_url ? { images: [product.image_url] } : {}),
              metadata: { product_id: product.id },
            },
          },
        },
      ],
      metadata: { type: "order", order_id: order.id },
      customer_email: user?.email ?? undefined,
      success_url: siteUrl("/checkout/success?session_id={CHECKOUT_SESSION_ID}"),
      cancel_url: siteUrl(`/checkout/cancelled?order=${order.order_number}`),
    });

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
