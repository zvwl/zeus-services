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
      console.log(`📦 [checkout.session.completed] Session:`, session.id);
      console.log(`📦 Metadata:`, JSON.stringify(session.metadata));
      
      const userId = session.metadata?.user_id;
      const sessionId = session.metadata?.session_id;

      console.log(`📦 Parsed - userId: ${userId}, sessionId: ${sessionId}`);

      if (!sessionId) {
        console.error("❌ Missing session_id in checkout session metadata");
        return new Response("Missing session_id", { status: 400 });
      }

      // Fetch cart items from checkout_sessions table
      const { data: checkoutData, error: fetchError } = await supabase
        .from("checkout_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (fetchError || !checkoutData) {
        console.error("❌ Failed to fetch checkout session:", fetchError);
        return new Response("Checkout session not found", { status: 404 });
      }

      console.log(`✅ Retrieved checkout session with ${checkoutData.items?.length || 0} items`);

      const items = checkoutData.items;
      const totalAmount = checkoutData.total_amount;
      const currency = checkoutData.currency;
      const customerEmail = checkoutData.customer_email || session.customer_email;
      const customerName = checkoutData.customer_name;
      const notes = checkoutData.notes;

      if (!items || !totalAmount || !currency) {
        console.error("❌ Missing required data in checkout session");
        return new Response("Invalid checkout session data", { status: 400 });
      }

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
          notesIv = toBase64(iv.buffer);
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

      // Decrease stock for purchased items
      try {
        console.log(`📦 Processing stock decrease for ${items.length} items in order ${newOrder.id}`);
        for (const item of items) {
          if (item.id && item.quantity) {
            const { data: stockResult, error: stockError } = await supabase
              .rpc('decrease_item_stock', {
                item_id: item.id,
                quantity: item.quantity
              });

            if (stockError) {
              console.error(`❌ Failed to decrease stock for item ${item.id}:`, stockError);
              // Continue processing other items even if one fails
            } else if (stockResult === false) {
              console.warn(`⚠️ Item ${item.id} stock was already 0 or stock tracking disabled`);
            } else {
              console.log(`✅ Stock decreased for item ${item.id} by ${item.quantity}`);
            }
          }
        }
      } catch (stockErr) {
        console.error('❌ Stock decrease error:', stockErr);
        // Non-fatal: order already created, continue with email/Discord
      }

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

      // Assign Discord role if user has connected Discord account
      if (userId) {
        try {
          console.log(`🎮 Attempting to assign Discord role for user ${userId}`);
          const discordRoleUrl = `${SUPABASE_URL}/functions/v1/assign-discord-role`;
          const discordRes = await fetch(discordRoleUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ 
              userId: userId,
              orderId: newOrder.id 
            })
          });
          
          const discordText = await discordRes.text();
          console.log(`🎮 Discord role response: status=${discordRes.status}, body=${discordText}`);
          
          if (!discordRes.ok) {
            console.error(`❌ Failed to assign Discord role for user ${userId}`);
          } else {
            console.log(`✅ Discord role assignment completed for user ${userId}`);
          }
        } catch (discordErr) {
          console.error('❌ Discord role assignment error:', discordErr);
        }
      } else {
        console.log(`ℹ️ No userId provided - skipping Discord role assignment`);
      }

      // Clean up checkout session after successful order creation
      try {
        const { error: deleteError } = await supabase
          .from("checkout_sessions")
          .delete()
          .eq("id", sessionId);

        if (deleteError) {
          console.error(`❌ Failed to delete checkout session ${sessionId}:`, deleteError);
        } else {
          console.log(`✅ Cleaned up checkout session ${sessionId}`);
        }
      } catch (cleanupErr) {
        console.error("❌ Checkout session cleanup error:", cleanupErr);
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
