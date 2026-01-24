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

    // Send email via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
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
          <h2>Thank you for your order, ${customer_name || 'valued customer'}! 🎉</h2>
          <p>We've received your payment and are processing your order.</p>
          
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Order Date:</strong> ${orderDate}</p>
          
          <h3>Items Ordered</h3>
          <pre>${itemsList}</pre>
          
          <h3>Total</h3>
          <p><strong>${formatCurrency(total_amount, currency)}</strong></p>
          
          <hr>
          <p>You can track your order status at <a href="https://zeuservices.com/orders">zeuservices.com/orders</a></p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p>Best regards,<br>The Zeus Services Team</p>
        `
      })
    });

    const resendData = await resendRes.json();
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
    return new Response(JSON.stringify({ error: error.message }), {
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
