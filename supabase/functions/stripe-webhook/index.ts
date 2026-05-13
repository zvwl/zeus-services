import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7?deno-std=0.224.0";

const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

if (!STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables.");
}

const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");

// Encryption helpers
async function importAesKey(base64Key: string) {
  const raw = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function toBase64(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

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

  // Log minimal webhook context (never log secrets or raw body)
  console.log("Received stripe-signature header");

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
    // ─── Shared order-creation logic ────────────────────────────────────────
    async function createOrderFromSession(
      sessionId: string,
      userId: string | null,
      paymentIntentId: string | null,
      checkoutSessionId: string | null,
      customerEmailOverride?: string
    ) {
      const { data: checkoutData, error: fetchError } = await supabase
        .from("checkout_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (fetchError || !checkoutData) {
        console.error("❌ Failed to fetch checkout session:", fetchError);
        return { error: "Checkout session not found" };
      }

      const { items, total_amount, currency, customer_email, customer_name, notes } = checkoutData;
      const resolvedEmail = customerEmailOverride || customer_email;

      if (!items || !total_amount || !currency) {
        return { error: "Invalid checkout session data" };
      }

      // Encrypt notes
      let notesCiphertext = null;
      let notesIv = null;
      const NOTES_ENC_KEY = Deno.env.get("NOTES_ENC_KEY");
      if (notes && notes.trim() && NOTES_ENC_KEY) {
        try {
          const fullNote = `${notes.trim()}\n\nSystem: Payment completed`;
          const key = await importAesKey(NOTES_ENC_KEY);
          const iv = crypto.getRandomValues(new Uint8Array(12));
          const encoder = new TextEncoder();
          const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(fullNote));
          notesCiphertext = toBase64(encrypted);
          notesIv = toBase64(iv.buffer);
        } catch (encErr) {
          console.error("❌ Note encryption error:", encErr);
        }
      }

      const { data: newOrder, error: insertError } = await supabase
        .from("orders")
        .insert([{
          user_id: userId || null,
          customer_email: resolvedEmail,
          customer_name: customer_name || resolvedEmail?.split("@")[0] || null,
          items,
          total_amount: parseFloat(total_amount),
          currency,
          status: "processing",
          payment_status: "paid",
          payment_method: checkoutSessionId ? "stripe_checkout" : "stripe_payment_element",
          payment_intent_id: paymentIntentId,
          paid_at: new Date().toISOString(),
          checkout_session_id: checkoutSessionId,
          payment_provider: "stripe",
          notes: null,
          notes_ciphertext: notesCiphertext,
          notes_iv: notesIv,
        }])
        .select()
        .single();

      if (insertError) {
        console.error("❌ Failed to create order:", insertError);
        return { error: "Order creation failed" };
      }

      console.log(`✅ Order ${newOrder.id} created`);

      // Decrease stock
      for (const item of items) {
        if (item.id && item.quantity) {
          const { error: stockError } = await supabase.rpc("decrease_item_stock", {
            item_id: item.id,
            quantity: item.quantity,
          });
          if (stockError) console.error(`❌ Stock decrease failed for ${item.id}:`, stockError);
        }
      }

      const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

      // Send order confirmation email
      if (SUPABASE_ANON_KEY) {
        fetch(`${SUPABASE_URL}/functions/v1/send-order-confirmation`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ orderId: newOrder.id }),
        }).catch(err => console.error("❌ Confirmation email error:", err));

        // Assign Discord role
        if (userId) {
          fetch(`${SUPABASE_URL}/functions/v1/assign-discord-role`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ userId, orderId: newOrder.id }),
          }).catch(err => console.error("❌ Discord role error:", err));
        }
      }

      // Clean up checkout session
      await supabase.from("checkout_sessions").delete().eq("id", sessionId);

      return { order: newOrder };
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (event.type === "payment_intent.succeeded") {
      // Embedded Payment Element flow
      const paymentIntent = event.data.object as any;
      console.log(`💳 [payment_intent.succeeded] ${paymentIntent.id}`);

      const sessionId = paymentIntent.metadata?.session_id;
      const userId = paymentIntent.metadata?.user_id || null;

      if (!sessionId) {
        console.error("❌ Missing session_id in payment_intent metadata");
        return new Response("Missing session_id", { status: 400 });
      }

      // Guard: don't create order if already created (idempotency)
      const { data: existing } = await supabase
        .from("orders")
        .select("id")
        .eq("payment_intent_id", paymentIntent.id)
        .maybeSingle();

      if (existing) {
        console.log(`ℹ️ Order already exists for payment_intent ${paymentIntent.id}, skipping`);
        return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
      }

      const result = await createOrderFromSession(
        sessionId,
        userId,
        paymentIntent.id,
        null, // no checkout_session_id for Payment Element flow
        paymentIntent.receipt_email
      );

      if (result.error) {
        return new Response(result.error, { status: 500 });
      }

    } else if (event.type === "checkout.session.completed") {
      // Legacy Stripe Checkout Session flow (kept for backwards compatibility)
      const session = event.data.object as any;
      console.log(`📦 [checkout.session.completed] ${session.id}`);

      const userId = session.metadata?.user_id || null;
      const sessionId = session.metadata?.session_id;

      if (!sessionId) {
        console.error("❌ Missing session_id in checkout session metadata");
        return new Response("Missing session_id", { status: 400 });
      }

      // If a payment_intent.succeeded already handled this, skip
      if (session.payment_intent) {
        const { data: existing } = await supabase
          .from("orders")
          .select("id")
          .eq("payment_intent_id", session.payment_intent)
          .maybeSingle();

        if (existing) {
          console.log(`ℹ️ Order already created via payment_intent.succeeded, skipping`);
          return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
        }
      }

      const result = await createOrderFromSession(
        sessionId,
        userId,
        session.payment_intent ?? null,
        session.id,
        session.customer_email
      );

      if (result.error) {
        return new Response(result.error, { status: 500 });
      }

    } else if (event.type === "payment_intent.payment_failed") {
      // Payment failed - nothing to do since order was never created
      console.log(`ℹ️ [payment_intent.payment_failed] Payment failed, no order created`);
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
