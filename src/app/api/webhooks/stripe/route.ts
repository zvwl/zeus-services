import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/fulfill";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 503 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await req.text();
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.payment_status === "paid") {
          await fulfillCheckoutSession(session);
        }
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        await fulfillCheckoutSession(event.data.object);
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        const db = createAdminClient();
        if (session.metadata?.order_id) {
          await db
            .from("orders")
            .update({ status: "cancelled" })
            .eq("id", session.metadata.order_id)
            .eq("status", "pending");
        }
        if (session.metadata?.donation_id) {
          await db
            .from("donations")
            .delete()
            .eq("id", session.metadata.donation_id)
            .eq("status", "pending");
        }
        break;
      }
      // Dashboard/API refunds and chargebacks: reflect them on the order so the
      // admin order list and the customer's history stay truthful.
      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntent =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (paymentIntent) {
          const db = createAdminClient();
          await db
            .from("orders")
            .update({ status: "refunded" })
            .eq("stripe_payment_intent", paymentIntent)
            .not("status", "in", "(refunded,cancelled)");
        }
        break;
      }
      case "charge.dispute.created": {
        const dispute = event.data.object;
        const paymentIntent =
          typeof dispute.payment_intent === "string"
            ? dispute.payment_intent
            : dispute.payment_intent?.id;
        if (paymentIntent) {
          const db = createAdminClient();
          // Flag the order as disputed and record it for staff follow-up.
          const { data: order } = await db
            .from("orders")
            .select("id, order_number")
            .eq("stripe_payment_intent", paymentIntent)
            .maybeSingle();
          if (order) {
            await db.from("audit_logs").insert({
              actor_id: null,
              action: "order.disputed",
              entity: "order",
              entity_id: order.id,
              meta: { order_number: order.order_number, reason: dispute.reason },
            });
          }
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`Webhook handler error for ${event.type}:`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
