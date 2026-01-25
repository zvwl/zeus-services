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
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const userId = session.metadata?.user_id;
      const itemsJson = session.metadata?.items;
      const totalAmount = session.metadata?.total_amount;
      const currency = session.metadata?.currency;
      const customerEmail = session.metadata?.customer_email || session.customer_email;
      const customerName = session.metadata?.customer_name;
      const notes = session.metadata?.notes;

      if (!itemsJson || !totalAmount || !currency) {
        console.error("❌ Missing required metadata in checkout session");
        return new Response("Missing metadata", { status: 400 });
      }

      // Parse items
      const items = JSON.parse(itemsJson);

      // Encrypt notes if provided
      let notesCiphertext = null;
      let notesIv = null;
      
      const NOTES_ENC_KEY = Deno.env.get("NOTES_ENC_KEY");
      if (notes && notes.trim() && NOTES_ENC_KEY) {
        try {
          const fullNote = `${notes.trim()}\n\nSystem: Stripe payment completed`;
          const key = await importAesKey(NOTES_ENC_KEY);
          const iv = crypto.getRandomValues(new Uint8Array(12));
          const encoder = new TextEncoder();
          const data = encoder.encode(fullNote);
          const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
          notesCiphertext = toBase64(encrypted);
          notesIv = toBase64(iv);
        } catch (encErr) {
          console.error("❌ Note encryption error:", encErr);
        }
      }

      // Create the order NOW that payment is complete
      console.log(`✅ [checkout.session.completed] Creating order after successful payment`);
      const { data: newOrder, error: insertError } = await supabase
        .from("orders")
        .insert([{
          user_id: userId || null,
          customer_email: customerEmail,
          customer_name: customerName || customerEmail?.split("@")[0] || null,
          items: items,
          total_amount: parseFloat(totalAmount),
          currency: currency,
          status: "processing",
          payment_status: "paid",
          payment_method: "stripe_checkout",
          payment_intent_id: session.payment_intent ?? null,
          paid_at: new Date().toISOString(),
          checkout_session_id: session.id,
          payment_provider: "stripe",
          notes: null,
          notes_ciphertext: notesCiphertext,
          notes_iv: notesIv
        }])
        .select()
        .single();

      if (insertError) {
        console.error(`❌ Failed to create order:`, insertError);
        return new Response("Order creation failed", { status: 500 });
      }

      console.log(`✅ Order ${newOrder.id} created and marked as paid/processing`);

      // Send order confirmation email
      try {
        if (!SUPABASE_ANON_KEY) {
          console.error("❌ Missing SUPABASE_ANON_KEY env var; cannot send confirmation email");
        } else {
          const emailUrl = `${SUPABASE_URL}/functions/v1/send-order-confirmation`;
          console.log(`📧 Attempting to send email for order ${newOrder.id} via ${emailUrl}`);
          const emailRes = await fetch(emailUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ orderId: newOrder.id })
          });
          const emailText = await emailRes.text();
          console.log(`📧 Email response status=${emailRes.status}, body=${emailText}`);
          if (!emailRes.ok) {
            console.error(`❌ Failed to send confirmation email for ${newOrder.id}`);
          }
        }
      } catch (emailErr) {
        console.error('❌ Email send error:', emailErr);
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
