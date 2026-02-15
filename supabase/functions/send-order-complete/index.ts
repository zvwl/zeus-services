import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7?deno-std=0.224.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://zeuservices.com";

if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
}

const supabaseUser = createClient(SUPABASE_URL ?? "", SUPABASE_ANON_KEY ?? "");
const supabaseService = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "", {
  auth: { autoRefreshToken: false, persistSession: false }
});

const corsHeaders = {
  "Access-Control-Allow-Origin": FRONTEND_URL,
  "Access-Control-Allow-Headers": "authorization,apikey,content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: userData, error: userError } = await supabaseUser.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: adminRow } = await supabaseService
      .from("admin_users")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!adminRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing orderId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (order.status !== "completed") {
      return new Response(JSON.stringify({ error: "Order not completed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { customer_email, customer_name, total_amount, currency, updated_at, created_at } = order;

    if (!customer_email) {
      return new Response(JSON.stringify({ error: "No customer email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const completedAt = new Date(updated_at || created_at).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const html = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 20px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 26px; letter-spacing: 0.5px;">Zeus Services</h1>
    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Order Complete</p>
  </div>

  <div style="padding: 32px 20px; max-width: 640px; margin: 0 auto; background: #f8fafc;">
    <p style="font-size: 16px; margin: 0 0 12px;">Hi ${customer_name || "there"},</p>
    <p style="font-size: 15px; color: #555; margin: 0 0 16px;">Your order is now complete. If you need anything else, our team is here to help.</p>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 18px; margin: 20px 0;">
      <p style="margin: 4px 0; font-size: 14px;"><strong>Order ID:</strong> ${orderId}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Completed:</strong> ${completedAt}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Total:</strong> ${formatCurrency(total_amount, currency)}</p>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="https://zeuservices.com/orders" style="display: inline-block; background-color: #FFD700; color: #000; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View Your Order</a>
    </div>

    <div style="background: #fff7ed; border: 1px solid #fdba74; border-radius: 8px; padding: 16px 18px; margin: 20px 0;">
      <p style="margin: 0 0 8px; font-size: 15px; color: #9a3412;"><strong>Enjoyed your service?</strong></p>
      <p style="margin: 0 0 12px; font-size: 14px; color: #9a3412;">Please leave a review in the <strong>My Orders</strong> section on our website. It helps a lot.</p>
      <a href="https://zeuservices.com/orders" style="display: inline-block; background-color: #f97316; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Leave a Review</a>
    </div>

    <div style="background: #f1f5f9; border-left: 4px solid #667eea; padding: 16px; border-radius: 6px; margin: 24px 0;">
      <p style="font-size: 14px; color: #334155; margin: 0 0 12px;"><strong>Need help or have questions?</strong></p>
      <p style="font-size: 13px; color: #64748b; margin: 0 0 12px;">Join our Discord community for instant support and updates:</p>
      <a href="http://discord.gg/zeusservices" style="display: inline-block; background-color: #5865F2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Join Discord Server</a>
    </div>

    <div style="text-align: center; padding-top: 18px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #999;">
      <p style="margin: 6px 0;">© 2026 Zeus Services. All rights reserved.</p>
      <p style="margin: 6px 0;"><a href="https://zeuservices.com" style="color: #0066cc; text-decoration: none;">Visit Our Website</a></p>
    </div>
  </div>
</div>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Zeus Services <orders@zeuservices.com>",
        to: customer_email,
        subject: `Order Complete #${String(orderId).slice(0, 8)}`,
        html
      })
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      console.error("Resend error:", resendData);
      return new Response(JSON.stringify({ error: resendData }), {
        status: resendRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true, emailId: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Send order complete error:", error);
    return new Response(JSON.stringify({ error: "Failed to send order complete email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { USD: "$", GBP: "£", EUR: "€" };
  const symbol = symbols[currency] || currency;
  return `${symbol}${Number(amount).toFixed(2)}`;
}
