import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7?deno-std=0.224.0";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables.");
}

const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");

// Manual webhook signature verification using Web Crypto API
async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  // Signature format: t=timestamp,v1=signature,v0=signature
  const parts = signature.split(",");
  let timestamp = "";
  let sig = "";

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith("t=")) {
      timestamp = trimmed.substring(2);
    } else if (trimmed.startsWith("v1=")) {
      sig = trimmed.substring(3);
    }
  }

  if (!timestamp || !sig) {
    console.error("Invalid signature format", { timestamp, sig });
    return false;
  }

  // Stripe signs: timestamp.body
  const signedContent = `${timestamp}.${body}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const expectedSignature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedContent)
  );

  const hashArray = Array.from(new Uint8Array(expectedSignature));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  const isValid = sig === hashHex;
  console.log(`Verifying: timestamp=${timestamp}, computed=${hashHex}, expected=${sig}, valid=${isValid}`);
  return isValid;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Log all headers for debugging
  console.log("Received headers:", Object.fromEntries(req.headers.entries()));

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const rawBody = await req.text();

  // Log the received signature and secret for debugging
  console.log("Received stripe-signature:", sig);
  console.log("Using STRIPE_WEBHOOK_SECRET:", STRIPE_WEBHOOK_SECRET);
  console.log("Raw body:", rawBody);

  // Verify signature using Web Crypto API
  const isValid = await verifyWebhookSignature(
    rawBody,
    sig,
    STRIPE_WEBHOOK_SECRET ?? ""
  );

  if (!isValid) {
    console.error("Webhook signature verification failed");
    return new Response("Webhook Error: Invalid signature", { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error("Failed to parse webhook body", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const orderId = session.metadata?.order_id;
      const userId = session.metadata?.user_id;

      if (orderId) {
        console.log(`✅ [checkout.session.completed] Updating order ${orderId}`);
        const updateData: any = {
          payment_status: "paid",
          status: "processing",
          payment_intent_id: session.payment_intent ?? null,
          paid_at: new Date().toISOString(),
          checkout_session_id: session.id,
          payment_provider: "stripe",
        };
        if (userId) updateData.user_id = userId;
        await supabase
          .from("orders")
          .update(updateData)
          .eq("id", orderId);
        console.log(`✅ Order ${orderId} marked as paid/processing`);
      }
    } else if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as any;
      const orderId = intent.metadata?.order_id;
      const userId = intent.metadata?.user_id;

      if (orderId) {
        console.log(`✅ [payment_intent.succeeded] Updating order ${orderId}`);
        const updateData: any = {
          payment_status: "paid",
          status: "processing",
          payment_intent_id: intent.id,
          paid_at: new Date().toISOString(),
          payment_provider: "stripe",
        };
        if (userId) updateData.user_id = userId;
        await supabase
          .from("orders")
          .update(updateData)
          .eq("id", orderId);
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as any;
      const orderId = intent.metadata?.order_id;
      const userId = intent.metadata?.user_id;

      if (orderId) {
        console.log(`❌ [payment_intent.payment_failed] Marking order ${orderId} as failed`);
        const updateData: any = {
          payment_status: "failed",
          status: "cancelled",
        };
        if (userId) updateData.user_id = userId;
        await supabase
          .from("orders")
          .update(updateData)
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
