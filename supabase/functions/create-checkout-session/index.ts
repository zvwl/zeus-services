import Stripe from "https://esm.sh/stripe@17.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    
    // Determine frontend URL based on environment
    const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://zeuservices.com";
    const finalFrontendUrl = FRONTEND_URL;
    
    if (!STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Server configuration error: Missing Stripe key" }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Try to read the authorization header (case-insensitive)
    const authHeader = req.headers.get('Authorization') ?? req.headers.get('authorization') ?? ''

    let userId: string | null = null
    if (authHeader && SUPABASE_ANON_KEY) {
      try {
        const supabaseClient = createClient(
          SUPABASE_URL ?? '',
          SUPABASE_ANON_KEY ?? '',
          {
            global: { headers: { Authorization: authHeader } },
            auth: { autoRefreshToken: false, persistSession: false }
          }
        )
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (user) {
          userId = user.id
        }
      } catch (e) {
        // Auth verification failed silently
      }
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
      apiVersion: "2023-10-16",
    });

    // Use service role to bypass RLS for reading order
    const supabaseAdmin = createClient(
      SUPABASE_URL ?? '',
      SUPABASE_SERVICE_ROLE_KEY ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { orderId } = await req.json();
    
    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId is required" }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, items, total_amount, currency, customer_email")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: orderError?.message ?? "Order not found" }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const currency = (order.currency || "USD").toLowerCase();
    const items = Array.isArray(order.items) ? order.items : [];

    const lineItems = items.map((item: any) => {
      const unit = typeof item.price_converted === "number" ? item.price_converted : Number(item.price_converted ?? 0);
      const amount = Math.max(0, Math.round(unit * 100));
      return {
        price_data: {
          currency,
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency,
      customer_email: order.customer_email ?? undefined,
      line_items: lineItems,
      payment_method_types: ['card'],
      metadata: {
        order_id: order.id,
      },
      success_url: `${finalFrontendUrl}/cart?success=true&orderId=${order.id}`,
      cancel_url: `${finalFrontendUrl}/cart?canceled=true&orderId=${order.id}`,
    });

    await supabaseAdmin
      .from("orders")
      .update({
        payment_provider: "stripe",
        payment_status: "pending",
        checkout_session_id: session.id,
      })
      .eq("id", order.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err?.message ?? "Server error" }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
