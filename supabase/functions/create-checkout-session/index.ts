import Stripe from "https://esm.sh/stripe@14.17.0";
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
    const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://zeuservices.com";

    if (!STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Server configuration error: Missing Stripe key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
    let userId: string | null = null;

    if (authHeader && SUPABASE_ANON_KEY && SUPABASE_URL) {
      try {
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader } },
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) userId = user.id;
      } catch {
        // ignore
      }
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const { items, total_amount, currency, customer_email, customer_name, notes } = await req.json();

    if (!Array.isArray(items) || typeof total_amount !== "number" || !currency) {
      return new Response(JSON.stringify({ error: "items, total_amount, and currency are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalCurrency = String(currency || "USD").toLowerCase();

    const lineItems = items.map((item: any) => {
      const unit = typeof item.price_converted === "number" ? item.price_converted : Number(item.price_converted ?? 0);
      const amount = Math.max(0, Math.round(unit * 100));
      return {
        price_data: {
          currency: finalCurrency,
          product_data: {
            name: item.name ?? "Item",
            description: item.platform ?? undefined,
          },
          unit_amount: amount,
        },
        quantity: item.quantity ?? 1,
      };
    });

    if (!lineItems.length) {
      return new Response(JSON.stringify({ error: "No items to charge" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const metadata: any = {
      items: JSON.stringify(items),
      total_amount: total_amount.toString(),
      currency: String(currency),
      customer_email: customer_email || "",
      customer_name: customer_name || "",
      notes: notes || "",
      ...(userId ? { user_id: userId } : {}),
    };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customer_email ?? undefined,
      line_items: lineItems,
      payment_method_types: ["card", "link"],
      billing_address_collection: "required",
      metadata,
      success_url: `${FRONTEND_URL}/cart?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/cart?canceled=true`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err?.message ?? "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
