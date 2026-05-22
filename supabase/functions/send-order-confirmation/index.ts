import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7?deno-std=0.224.0";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required environment variables");
}

const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");

function normalizeLabel(label: string) {
  return String(label || '').trim().replace(/\s*:\s*$/, '');
}

function stripPrefixedValue(value: string, label: string) {
  const normalizedLabel = normalizeLabel(label);
  const text = String(value || '').trim();
  if (!normalizedLabel || !text) return text;
  const prefixRegex = new RegExp(`^${normalizedLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*`, 'i');
  return text.replace(prefixRegex, '').trim();
}

// Format a numeric string nicely (e.g. "5000000" → "5,000,000")
function formatDisplayValue(value: string): string {
  const trimmed = value.trim();
  // If it looks like a plain integer or float with no letters, format with commas
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const num = parseFloat(trimmed);
    if (!isNaN(num)) {
      return num % 1 === 0
        ? num.toLocaleString('en-GB')
        : num.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }
  }
  return trimmed;
}

function isNaNString(v: string): boolean {
  return v.toLowerCase() === 'nan' || v.toLowerCase() === 'undefined' || v.toLowerCase() === 'null';
}

function getSelectionEntries(item: any): Array<{ label: string; value: string }> {
  const entries: Array<{ label: string; value: string }> = [];
  const seen = new Set<string>();

  const addEntry = (rawLabel: string, rawValue: any) => {
    const label = normalizeLabel(rawLabel);
    const raw = String(rawValue ?? '').trim();
    const value = stripPrefixedValue(raw, label);
    // Skip empty, NaN, undefined, null strings
    if (!label || !value || isNaNString(value)) return;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({ label, value: formatDisplayValue(value) });
  };

  // Primary source: customSelections object (has every field the customer filled)
  const customSelections = item?.customSelections;
  if (customSelections && typeof customSelections === 'object' && !Array.isArray(customSelections)) {
    for (const [label, value] of Object.entries(customSelections)) {
      addEntry(label, value);
    }
  }

  // Fallback: platform string (e.g. "Platform: Epic Games | Version: Enhanced | Credits: 5000000")
  const platformRaw = String(item?.platform || '').trim();
  if (platformRaw && !isNaNString(platformRaw)) {
    if (platformRaw.includes(':')) {
      platformRaw.split('|').forEach((segment: string) => {
        const trimmed = segment.trim();
        if (!trimmed) return;
        const sep = trimmed.indexOf(':');
        if (sep === -1) {
          addEntry('Platform', trimmed);
          return;
        }
        const label = trimmed.slice(0, sep).trim();
        const value = trimmed.slice(sep + 1).trim();
        addEntry(label, value);
      });
    } else {
      addEntry('Platform', platformRaw);
    }
  }

  // Fallback: version string
  const versionRaw = String(item?.version || '').trim();
  if (versionRaw && versionRaw.toLowerCase() !== 'standard' && !isNaNString(versionRaw)) {
    addEntry('Version', versionRaw);
  }

  return entries; // empty array = no selections (item had no custom fields)
}

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { USD: '$', GBP: '£', EUR: '€' };
  const symbol = symbols[currency?.toUpperCase()] || currency || '£';
  return `${symbol}${Number(amount).toFixed(2)}`;
}

function buildItemHtml(item: any, currency: string): string {
  const entries = getSelectionEntries(item);
  const quantity = Number(item?.quantity || 1);
  const itemPrice = Number(item?.price_converted ?? item?.price_usd ?? 0);
  const itemTotal = quantity * itemPrice;
  const itemName = String(item?.name || 'Item').replace(/[<>]/g, '');

  const selectionBadges = entries.length > 0
    ? entries.map(e => `<span style="display:inline-block;background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:5px;margin:2px 4px 2px 0;font-size:12px;font-weight:700;border:1px solid #fbbf24;">${e.label}: ${e.value}</span>`).join('')
    : '';

  return `
    <div style="background:#1e293b;border-left:3px solid #fbbf24;padding:14px 16px;margin:10px 0;border-radius:8px;">
      <div style="font-size:15px;font-weight:700;color:#f1f5f9;margin-bottom:${selectionBadges ? '8px' : '4px'};">${itemName}</div>
      ${selectionBadges ? `<div style="margin-bottom:8px;line-height:1.8;">${selectionBadges}</div>` : ''}
      <div style="font-size:13px;color:#94a3b8;">
        ${quantity > 1 ? `${quantity}× ` : ''}${formatCurrency(itemPrice, currency)}
        ${quantity > 1 ? `= <span style="color:#fbbf24;font-weight:700;">${formatCurrency(itemTotal, currency)}</span>` : ''}
      </div>
    </div>
  `;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Missing orderId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { customer_email, customer_name, items, total_amount, currency, created_at } = order;

    if (!customer_email) {
      return new Response(JSON.stringify({ error: 'No customer email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const itemsHtml = (items || []).map((item: any) => buildItemHtml(item, currency)).join('');

    const orderDate = new Date(created_at).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const displayName = customer_name || customer_email.split('@')[0] || 'there';
    const shortId = String(orderId).slice(0, 8).toUpperCase();

    await new Promise(resolve => setTimeout(resolve, 100));

    let resendRes: Response | undefined;
    let resendData: any;

    for (let attempt = 0; attempt < 3; attempt++) {
      resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Zeuservices <orders@zeuservices.com>',
          to: customer_email,
          subject: `Order Confirmed #${shortId} – Zeuservices`,
          html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0e1a;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111827;border-radius:16px;overflow:hidden;border:1px solid rgba(251,191,36,0.2);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#0a0e1a 0%,#1a1f35 100%);padding:32px 24px;text-align:center;border-bottom:2px solid #fbbf24;">
          <div style="font-size:28px;font-weight:900;color:#fbbf24;letter-spacing:1px;">Zeuservices</div>
          <div style="font-size:13px;color:#94a3b8;margin-top:6px;letter-spacing:0.5px;">ORDER CONFIRMATION</div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:28px 24px;">

          <p style="font-size:16px;color:#f1f5f9;margin:0 0 8px;">Hi ${displayName},</p>
          <p style="font-size:15px;color:#94a3b8;margin:0 0 24px;line-height:1.6;">Thanks for your order! Your payment has been received and we&apos;re now processing your service. We&apos;ll contact you on Discord shortly.</p>

          <!-- Order details box -->
          <div style="background:#1e293b;border:1px solid rgba(251,191,36,0.2);border-radius:10px;padding:16px;margin-bottom:24px;">
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;font-weight:700;">Order Details</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#94a3b8;padding:3px 0;">Order ID</td>
                <td style="font-size:13px;color:#f1f5f9;text-align:right;font-weight:700;">#${shortId}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#94a3b8;padding:3px 0;">Date</td>
                <td style="font-size:13px;color:#f1f5f9;text-align:right;">${orderDate}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#94a3b8;padding:3px 0;">Total Paid</td>
                <td style="font-size:15px;color:#fbbf24;text-align:right;font-weight:900;">${formatCurrency(total_amount, currency)}</td>
              </tr>
            </table>
          </div>

          <!-- Items -->
          <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;font-weight:700;">Items Ordered</div>
          ${itemsHtml || '<div style="color:#94a3b8;font-size:14px;padding:12px 0;">No items found.</div>'}

          <!-- CTA -->
          <div style="text-align:center;margin:28px 0 0;">
            <a href="https://zeuservices.com/orders" style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#0a0e1a;padding:13px 32px;text-decoration:none;border-radius:8px;font-weight:800;font-size:15px;">View Your Order</a>
          </div>
        </td>
      </tr>

      <!-- Discord CTA -->
      <tr>
        <td style="background:#1e293b;border-top:1px solid rgba(251,191,36,0.15);padding:20px 24px;">
          <p style="font-size:14px;color:#94a3b8;margin:0 0 12px;font-weight:600;">Need help or have questions?</p>
          <p style="font-size:13px;color:#64748b;margin:0 0 14px;">Join our Discord for instant support and delivery updates.</p>
          <a href="https://discord.gg/zeusservices" style="display:inline-block;background:#5865f2;color:#fff;padding:10px 22px;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">Join Discord</a>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:16px 24px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="font-size:12px;color:#475569;margin:0;">&copy; 2026 Zeuservices. All rights reserved.</p>
          <p style="font-size:12px;color:#475569;margin:4px 0 0;"><a href="https://zeuservices.com" style="color:#fbbf24;text-decoration:none;">zeuservices.com</a></p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>
          `,
        }),
      });

      resendData = await resendRes.json();

      if (resendRes.status === 429 && attempt < 2) {
        const wait = Math.pow(2, attempt) * 1000;
        console.log(`Rate limited, retrying in ${wait}ms (attempt ${attempt + 1}/3)`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      break;
    }

    if (!resendRes!.ok) {
      console.error('Resend error:', resendData);
      return new Response(JSON.stringify({ error: resendData }), {
        status: resendRes!.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Order confirmation sent to ${customer_email} (order ${shortId})`);
    return new Response(JSON.stringify({ success: true, emailId: resendData.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('send-order-confirmation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to send order confirmation' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
