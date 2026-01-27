import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7?deno-std=0.224.0";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
}

const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Missing orderId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { customer_email, customer_name, items, total_amount, currency, created_at } = order;

    if (!customer_email) {
      console.error('No customer email for order:', orderId);
      return new Response(JSON.stringify({ error: 'No customer email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Format items for email
    const itemsList = (items || []).map((item: any) => 
      `${item.name} (${item.platform || 'N/A'}) - ${item.quantity}x ${formatCurrency(item.price_converted || item.price_usd, currency)}`
    ).join('\n');

    const orderDate = new Date(created_at).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    console.log('Sending order confirmation to:', customer_email);

    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));

    // Send email via Resend with retry logic
    let resendRes;
    let resendData;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Zeus Services <orders@zeuservices.com>',
          to: customer_email,
          subject: `Order Confirmation #${orderId.slice(0, 8)}`,
          html: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 20px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 26px; letter-spacing: 0.5px;">Zeus Services</h1>
    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Order Confirmation</p>
  </div>

  <div style="padding: 32px 20px; max-width: 640px; margin: 0 auto; background: #f8fafc;">
    <p style="font-size: 16px; margin: 0 0 12px;">Hi ${customer_name || 'there'},</p>
    <p style="font-size: 15px; color: #555; margin: 0 0 16px;">Thank you for your purchase! We've received your payment and are processing your order.</p>

    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px 18px; margin: 20px 0;">
      <p style="margin: 4px 0; font-size: 14px;"><strong>Order ID:</strong> ${orderId}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Order Date:</strong> ${orderDate}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Total:</strong> ${formatCurrency(total_amount, currency)}</p>
    </div>

    <h3 style="margin: 16px 0 10px; font-size: 15px; color: #111;">Items Ordered</h3>
    <pre style="white-space: pre-wrap; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 12px; font-size: 14px; color: #374151; margin: 0 0 20px;">${itemsList}</pre>

    <div style="text-align: center; margin: 28px 0;">
      <a href="https://zeuservices.com/orders" style="display: inline-block; background-color: #FFD700; color: #000; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View Your Order</a>
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
        `
        })
      });

      resendData = await resendRes.json();

      // If rate limited, wait and retry
      if (resendRes.status === 429 && retries < maxRetries - 1) {
        const waitTime = Math.pow(2, retries) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`Rate limited, retrying in ${waitTime}ms (attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
        continue;
      }

      // If successful, break the loop
      if (resendRes.ok) {
        break;
      }

      // If not rate limited and not ok, fail
      console.error('Resend error:', resendData);
      return new Response(JSON.stringify({ error: resendData }), {
        status: resendRes.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Resend API response:', resendData);

    if (!resendRes.ok) {
      console.error('Resend error:', resendData);
      return new Response(JSON.stringify({ error: resendData }), {
        status: resendRes.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, emailId: resendData.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Send order confirmation error:', error);
    return new Response(JSON.stringify({ error: "Failed to send order confirmation" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { USD: '$', GBP: '£', EUR: '€' };
  const symbol = symbols[currency] || currency;
  return `${symbol}${Number(amount).toFixed(2)}`;
}
