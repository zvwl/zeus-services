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
      title: "New donation",
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
    // Add-on lines carry no product_id. They're paid extras bundled with their
    // parent product, so auto-mark them fulfilled and let them NOT force the
    // whole order into manual processing.
    if (!item.product_id) {
      if (!item.delivered_at) {
        await db
          .from("order_items")
          .update({
            delivered_payload: "Included with your order.",
            delivered_at: new Date().toISOString(),
          })
          .eq("id", item.id);
      }
      continue;
    }
    const { data: product } = await db
      .from("products")
      .select("id, delivery_type, delivery_instructions")
      .eq("id", item.product_id)
      .maybeSingle();
    if (!product) {
      allInstant = false;
      continue;
    }

    // Decrement stock atomically (the RPC guards stock >= qty), and only the
    // level that was actually sold: a variant purchase must not also draw down
    // the parent product's stock (which was never checked at checkout).
    if (item.variant_id) {
      await db.rpc("decrement_variant_stock", {
        v_id: item.variant_id,
        p_qty: item.quantity,
      });
    } else {
      await db.rpc("decrement_stock", {
        p_id: product.id,
        p_qty: item.quantity,
      });
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

  const orderRef = order.reference ?? `#${order.order_number}`;
  await notifyDiscord({
    title: `Order ${orderRef} paid`,
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
      subject: `Order ${orderRef} confirmed`,
      html: orderConfirmationEmail({
        orderNumber: orderRef,
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

  // Clear the buyer's saved server cart now that the cart checkout is paid, so
  // their items don't reappear after payment (works even if they never return
  // to the success page — this runs from the webhook too). Only for cart
  // checkouts; "Buy now" purchases never touched the cart.
  if (order.user_id && session.metadata?.from_cart === "1") {
    await db.from("cart_items").delete().eq("user_id", order.user_id);
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
