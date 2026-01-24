import Stripe from "https://esm.sh/stripe@14.22.0?target=deno&deno-std=0.224.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7?deno-std=0.224.0";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables.");
}

const stripe = new Stripe(STRIPE_SECRET_KEY ?? "", {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2023-10-16",
});

const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const rawBody = await req.arrayBuffer();
  const decoder = new TextDecoder();
  const rawBodyString = decoder.decode(rawBody);

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBodyString, sig, STRIPE_WEBHOOK_SECRET ?? "");
  } catch (err) {
    console.error("Webhook signature verification failed", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const orderId = session.metadata?.order_id;

      if (orderId) {
        console.log(`✅ [checkout.session.completed] Updating order ${orderId}`);
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "processing",
            payment_intent_id: session.payment_intent ?? null,
            paid_at: new Date().toISOString(),
            checkout_session_id: session.id,
            payment_provider: "stripe",
          })
          .eq("id", orderId);
        console.log(`✅ Order ${orderId} marked as paid/processing`);
      }
    } else if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as any;
      const orderId = intent.metadata?.order_id;

      if (orderId) {
        console.log(`✅ [payment_intent.succeeded] Updating order ${orderId}`);
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "processing",
            payment_intent_id: intent.id,
            paid_at: new Date().toISOString(),
            payment_provider: "stripe",
          })
          .eq("id", orderId);
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as any;
      const orderId = intent.metadata?.order_id;

      if (orderId) {
        console.log(`❌ [payment_intent.payment_failed] Marking order ${orderId} as failed`);
        await supabase
          .from("orders")
          .update({
            payment_status: "failed",
            status: "cancelled",
          })
          .eq("id", orderId);
      }
    } else {
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("❌ Error handling webhook:", err);
    return new Response("Webhook handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
