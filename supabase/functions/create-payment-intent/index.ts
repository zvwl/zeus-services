import Stripe from "https://esm.sh/stripe@17.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    let userId: string | null = null;

    if (authHeader && SUPABASE_ANON_KEY && SUPABASE_URL) {
      try {
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader } },
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) userId = user.id;
      } catch { /* ignore auth errors */ }
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-01-27.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { items, total_amount, currency, customer_email, customer_name, notes } = await req.json();

    if (!Array.isArray(items) || typeof total_amount !== "number" || !currency) {
      return new Response(JSON.stringify({ error: "items, total_amount, and currency are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalCurrency = String(currency).toLowerCase();
    const amountInCents = Math.round(total_amount * 100);

    if (amountInCents < 50) {
      return new Response(JSON.stringify({ error: "Amount too small" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate session ID to link payment intent to cart items
    const sessionId = `pi_sess_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;

    // Store cart in checkout_sessions (same table, reusing existing infrastructure)
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: authHeader ? { Authorization: authHeader } : {} },
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { error: insertError } = await supabaseClient
        .from("checkout_sessions")
        .insert({
          id: sessionId,
          user_id: userId,
          items,
          total_amount,
          currency: String(currency),
          customer_email: customer_email || null,
          customer_name: customer_name || null,
          notes: notes || null,
        });

      if (insertError) {
        console.error("Failed to store session:", insertError);
        return new Response(JSON.stringify({ error: "Failed to prepare payment" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: finalCurrency,
      payment_method_types: ['card'],
      receipt_email: customer_email || undefined,
      metadata: {
        session_id: sessionId,
        ...(userId ? { user_id: userId } : {}),
      },
      description: `Zeuservices order — ${items.length} item${items.length !== 1 ? "s" : ""}`,
    });

    console.log(`✅ Created PaymentIntent ${paymentIntent.id} for session ${sessionId}`);

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-payment-intent error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
