import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7?deno-std=0.224.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://zeuservices.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": FRONTEND_URL,
  "Access-Control-Allow-Headers": "authorization,apikey,content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS"
};

const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "", {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function sendAdminEmail(adminEmail: string, orderDetails: any) {
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "admin@zeuservices.com",
        to: adminEmail,
        subject: `[ADMIN] New Order #${orderDetails.order_id} - ${orderDetails.currency}${orderDetails.total_amount}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 26px; letter-spacing: 0.5px;">Zeus Services</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">New Order Received</p>
            </div>

            <div style="padding: 32px 20px; max-width: 640px; margin: 0 auto; background: #f8fafc;">
              <p style="font-size: 16px; margin: 0 0 12px;">Hello Admin,</p>
              <p style="font-size: 15px; color: #555; margin: 0 0 16px;">A new order has been placed. Details are below.</p>

              <div style="background: white; border-left: 4px solid #fbbf24; padding: 16px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 4px 0; font-size: 14px;"><strong>Order ID:</strong> ${orderDetails.order_id}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Customer:</strong> ${orderDetails.customer_name || orderDetails.customer_email}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${orderDetails.customer_email}" style="color: #0066cc; text-decoration: none;">${orderDetails.customer_email}</a></p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Amount:</strong> ${orderDetails.currency}${orderDetails.total_amount}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Payment Method:</strong> ${orderDetails.payment_method === 'stripe_checkout' ? 'Stripe' : orderDetails.payment_method}</p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Date:</strong> ${new Date(orderDetails.created_at).toLocaleString()}</p>
              </div>

              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 18px; margin: 20px 0;">
                <p style="margin: 0 0 10px; font-size: 14px;"><strong>Items Ordered</strong></p>
                <ul style="margin: 0; padding-left: 18px; font-size: 14px; color: #555;">
                  ${orderDetails.items.map((item: any) => `
                    <li style="margin: 8px 0;">
                      ${item.icon || '📦'} <strong>${item.name}</strong> (${item.platform})
                      <br/><span style="color: #666; font-size: 13px;">Qty: ${item.quantity} | Price: ${(() => {
                        const rawPrice = item?.price_converted ?? item?.price ?? item?.price_usd ?? item?.unit_price ?? null;
                        const numeric = typeof rawPrice === "number" ? rawPrice : Number(rawPrice);
                        if (!Number.isFinite(numeric)) return "N/A";
                        const currency = item?.currency || orderDetails.currency || "GBP";
                        return `${currency}${numeric.toFixed(2)}`;
                      })()}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>

              <div style="text-align: center; margin: 28px 0;">
                <a href="https://zeuservices.com/admin/orders" style="display: inline-block; background-color: #FFD700; color: #000; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                  View in Admin Panel
                </a>
              </div>

              <p style="font-size: 12px; color: #999; text-align: center; margin: 0 0 18px;">
                This is an automated notification. Do not reply to this email.
              </p>

              <div style="text-align: center; padding-top: 18px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #999;">
                <p style="margin: 12px 0; font-size: 14px; color: #555;"><strong>Need help?</strong> Join our Discord for instant support:</p>
                <p style="margin: 12px 0;">
                  <a href="https://discord.gg/KTmYbqxBBU" style="display: inline-block; background-color: #5865f2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Discord Server</a>
                </p>
                <p style="margin: 6px 0;">2026 Zeus Services. All rights reserved.</p>
                <p style="margin: 6px 0;"><a href="https://zeuservices.com" style="color: #0066cc; text-decoration: none;">Visit Our Website</a></p>
              </div>
            </div>
          </div>
        `
      })
    });
    
    const result = await response.json();
    
    // If rate limited, retry with exponential backoff
    if (response.status === 429 && retries < maxRetries - 1) {
      const waitTime = Math.pow(2, retries) * 1000;
      console.log(`Rate limited for ${adminEmail}, retrying in ${waitTime}ms (attempt ${retries + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      retries++;
      continue;
    }
    
    // If successful or final attempt, return result
    if (!response.ok) {
      console.error(`Resend error for ${adminEmail}:`, result);
    }
    return result;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Received body:", JSON.stringify(body));
    
    const orderId = body.orderId || body.order_id;
    console.log("Extracted orderId:", orderId);
    
    if (!orderId) {
      console.error("Missing orderId in request body:", body);
      return new Response(
        JSON.stringify({ error: "Missing orderId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching order with ID:", orderId);
    // Fetch the order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    console.log("Order fetch result - error:", orderError, "order:", order);
    if (orderError || !order) {
      console.error("Order not found:", orderId, orderError);
      return new Response(
        JSON.stringify({ error: "Order not found", details: orderError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Order found:", order.id);
    const order_id = order.id;
    const { customer_email, customer_name, total_amount, currency, items, payment_method, created_at } = order;

    if (!order_id || !customer_email || !items) {
      console.error("Missing required fields - order_id:", order_id, "email:", customer_email, "items:", items);
      return new Response(
        JSON.stringify({ error: "Missing required fields in order" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all active admin user_ids
    const { data: admins, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("active", true);

    if (adminError) {
      console.error("Error fetching admins:", adminError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch admins" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!admins || admins.length === 0) {
      console.warn("No active admins found");
      return new Response(
        JSON.stringify({ success: true, message: "No admins to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get emails for each admin user from auth.users
    const emailPromises = admins.map(async (admin, index) => {
      // Add staggered delay between each email to avoid Resend rate limits (2 per second)
      // 1000ms delay per admin ensures smooth spacing
      await new Promise(resolve => setTimeout(resolve, index * 1000));
      
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(admin.user_id);
      
      if (userError || !userData?.user?.email) {
        console.warn(`Could not get email for admin user ${admin.user_id}`);
        return null;
      }

      return sendAdminEmail(userData.user.email, {
        order_id,
        customer_email,
        customer_name,
        total_amount,
        currency,
        items,
        payment_method,
        created_at
      }).catch(err => {
        console.error(`Failed to email ${userData.user.email}:`, err);
        return null;
      });
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Admin notifications sent to ${successCount} admin(s)`,
        admins_notified: successCount
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("notify-order-admins error:", err);
    return new Response(
      JSON.stringify({ error: "Server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
