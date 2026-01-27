
import Stripe from "https://esm.sh/stripe@17.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";


const FRONTEND_URL = Deno.env.get("FRONTEND_URL");
const corsHeaders = {
  'Access-Control-Allow-Origin': FRONTEND_URL || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to verify JWT and check admin (no node polyfills)
function parseJwtSub(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded.sub;
  } catch {
    return null;
  }
}

async function isAdminUser(req, supabase) {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  console.log('Auth header:', authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No Bearer token');
    return false;
  }
  const token = authHeader.replace('Bearer ', '');
  const userId = parseJwtSub(token);
  console.log('Parsed userId from JWT:', userId);
  if (!userId) {
    console.log('No userId in JWT');
    return false;
  }
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .single();
    console.log('Admin user lookup:', { data, error });
    return !!data && !error;
  } catch (e) {
    console.log('Admin user lookup error:', e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

    if (!STRIPE_SECRET_KEY || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_URL) {
      return new Response(JSON.stringify({ error: "Server configuration error: Missing keys" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { orderId } = await req.json();

    // Auth check: only allow admin users
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const isAdmin = await isAdminUser(req, supabaseAdmin);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId is required" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = supabaseAdmin;
    // Fetch the order to get payment_intent_id
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, payment_intent_id, payment_status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: orderError?.message || "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!order.payment_intent_id) {
      return new Response(JSON.stringify({ error: "Order does not have a payment_intent_id" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (order.payment_status === 'refunded') {
      return new Response(JSON.stringify({ error: "Order already refunded" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      httpClient: Stripe.createFetchHttpClient(),
      apiVersion: "2023-10-16",
    });

    // Create the refund in Stripe
    const refund = await stripe.refunds.create(
      {
        payment_intent: order.payment_intent_id,
      },
      {
        idempotencyKey: `refund-${order.id}`,
      }
    );

    // Update the order status in Supabase
    await supabase
      .from("orders")
      .update({
        payment_status: "refunded",
        status: "cancelled",
      })
      .eq("id", orderId);

    return new Response(JSON.stringify({ success: true, refund }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Refund error:', err);
    return new Response(JSON.stringify({ error: "Failed to process refund. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
