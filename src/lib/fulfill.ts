import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyDiscord, syncCustomerDiscordRole } from "@/lib/discord";
import { orderConfirmationEmail, sendEmail } from "@/lib/email";
import { formatMoney } from "@/lib/currency";
import type { OrderItem } from "@/lib/types";

/**
 * Marks an order/donation paid after Stripe confirms payment. Idempotent:
 * guarded by a status='pending' filter, so the webhook and the success page
 * can both call it safely.
 */
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session
) {
  const type = session.metadata?.type;
  if (type === "donation") {
    return fulfillDonation(session);
  }
  if (type === "order") {
    return fulfillOrder(session);
  }
}

async function fulfillDonation(session: Stripe.Checkout.Session) {
  const id = session.metadata?.donation_id;
  if (!id) return;
  const db = createAdminClient();
  const { data } = await db
    .from("donations")
    .update({ status: "completed" })
    .eq("id", id)
    .eq("status", "pending")
    .select("name, amount, currency")
    .maybeSingle();
  if (data) {
    await notifyDiscord({
      title: "☕ New donation",
      description: `**${data.name || "Anonymous"}** donated **${formatMoney(
        Number(data.amount),
        data.currency
      )}**`,
      color: 0xfbbf24,
    });
  }
}

async function fulfillOrder(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;
  const db = createAdminClient();

  // Claim the pending order (idempotency guard).
  const { data: order } = await db
    .from("orders")
    .update({
      status: "paid",
      stripe_payment_intent:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      email: session.customer_details?.email ?? undefined,
    })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();
  if (!order) return; // already fulfilled or unknown

  const { data: items } = await db
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);
  const orderItems = (items ?? []) as OrderItem[];

  let allInstant = orderItems.length > 0;
  for (const item of orderItems) {
    if (!item.product_id) {
      allInstant = false;
      continue;
    }
    const { data: product } = await db
      .from("products")
      .select("id, stock, delivery_type, delivery_instructions")
      .eq("id", item.product_id)
      .maybeSingle();
    if (!product) {
      allInstant = false;
      continue;
    }

    // Decrement stock counters (null = unlimited).
    if (product.stock !== null) {
      await db
        .from("products")
        .update({ stock: Math.max(0, product.stock - item.quantity) })
        .eq("id", product.id);
    }
    if (item.variant_id) {
      const { data: variant } = await db
        .from("product_variants")
        .select("id, stock")
        .eq("id", item.variant_id)
        .maybeSingle();
      if (variant && variant.stock !== null) {
        await db
          .from("product_variants")
          .update({ stock: Math.max(0, variant.stock - item.quantity) })
          .eq("id", variant.id);
      }
    }

    if (product.delivery_type === "instant") {
      await db
        .from("order_items")
        .update({
          delivered_payload:
            product.delivery_instructions ??
            "Your order is confirmed — our team will reach out shortly.",
          delivered_at: new Date().toISOString(),
        })
        .eq("id", item.id);
    } else {
      allInstant = false;
    }
  }

  await db
    .from("orders")
    .update({ status: allInstant ? "completed" : "processing" })
    .eq("id", orderId);

  await db.from("audit_logs").insert({
    actor_id: null,
    action: "order.paid",
    entity: "order",
    entity_id: orderId,
    meta: { order_number: order.order_number, total: order.total },
  });

  await notifyDiscord({
    title: `🛒 Order #${order.order_number} paid`,
    fields: [
      {
        name: "Total",
        value: formatMoney(Number(order.total), order.currency),
        inline: true,
      },
      { name: "Email", value: session.customer_details?.email ?? "—", inline: true },
      {
        name: "Items",
        value:
          orderItems
            .map(
              (i) =>
                `${i.quantity}× ${i.product_name}${
                  i.variant_name ? ` (${i.variant_name})` : ""
                }`
            )
            .join("\n") || "—",
      },
    ],
    color: 0x22c55e,
  });

  // Order confirmation email (Resend) — best effort.
  const email = session.customer_details?.email ?? order.email;
  if (email) {
    await sendEmail({
      to: email,
      subject: `Order #${order.order_number} confirmed ⚡`,
      html: orderConfirmationEmail({
        orderNumber: order.order_number,
        total: Number(order.total),
        currency: order.currency,
        items: orderItems.map((i) => ({
          quantity: i.quantity,
          product_name: i.product_name,
          variant_name: i.variant_name,
        })),
        manual: !allInstant,
      }),
    });
  }

  // Grant the verified-customer Discord role. Works whether the buyer
  // connected Discord before or after paying — connecting later re-runs the
  // same check from the auth callback. Best effort; never throws.
  if (order.user_id) {
    await syncCustomerDiscordRole(order.user_id, {
      db,
      meta: { order_id: orderId, order_number: order.order_number },
    });
  }
}
