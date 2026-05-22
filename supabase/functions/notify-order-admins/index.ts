import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7?deno-std=0.224.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://zeuservices.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": FRONTEND_URL,
  "Access-Control-Allow-Headers": "authorization,apikey,content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "", {
  auth: { autoRefreshToken: false, persistSession: false },
});

function normalizeLabel(label: string) {
  return String(label || "").trim().replace(/\s*:\s*$/, "");
}

function stripPrefixedValue(value: string, label: string) {
  const normalizedLabel = normalizeLabel(label);
  const text = String(value || "").trim();
  if (!normalizedLabel || !text) return text;
  const prefixRegex = new RegExp(`^${normalizedLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*`, "i");
  return text.replace(prefixRegex, "").trim();
}

function formatDisplayValue(value: string): string {
  const trimmed = value.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const num = parseFloat(trimmed);
    if (!isNaN(num)) {
      return num % 1 === 0
        ? num.toLocaleString("en-GB")
        : num.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }
  }
  return trimmed;
}

function isNaNString(v: string): boolean {
  const l = v.toLowerCase();
  return l === "nan" || l === "undefined" || l === "null";
}

function getSelectionEntries(item: any): Array<{ label: string; value: string }> {
  const entries: Array<{ label: string; value: string }> = [];
  const seen = new Set<string>();

  const addEntry = (rawLabel: string, rawValue: any) => {
    const label = normalizeLabel(rawLabel);
    const raw = String(rawValue ?? "").trim();
    const value = stripPrefixedValue(raw, label);
    if (!label || !value || isNaNString(value)) return;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    entries.push({ label, value: formatDisplayValue(value) });
  };

  const customSelections = item?.customSelections;
  if (customSelections && typeof customSelections === "object" && !Array.isArray(customSelections)) {
    for (const [label, value] of Object.entries(customSelections)) {
      addEntry(label, value);
    }
  }

  const platformRaw = String(item?.platform || "").trim();
  if (platformRaw && !isNaNString(platformRaw)) {
    if (platformRaw.includes(":")) {
      platformRaw.split("|").forEach((segment: string) => {
        const trimmed = segment.trim();
        if (!trimmed) return;
        const sep = trimmed.indexOf(":");
        if (sep === -1) { addEntry("Platform", trimmed); return; }
        addEntry(trimmed.slice(0, sep).trim(), trimmed.slice(sep + 1).trim());
      });
    } else {
      addEntry("Platform", platformRaw);
    }
  }

  const versionRaw = String(item?.version || "").trim();
  if (versionRaw && versionRaw.toLowerCase() !== "standard" && !isNaNString(versionRaw)) {
    addEntry("Version", versionRaw);
  }

  return entries;
}

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { USD: "$", GBP: "£", EUR: "€" };
  const symbol = symbols[String(currency || "").toUpperCase()] || currency || "£";
  return `${symbol}${Number(amount).toFixed(2)}`;
}

function buildItemHtml(item: any, currency: string): string {
  const entries = getSelectionEntries(item);
  const quantity = Number(item?.quantity || 1);
  const rawPrice = item?.price_converted ?? item?.price ?? item?.price_usd ?? null;
  const numeric = typeof rawPrice === "number" ? rawPrice : Number(rawPrice);
  const priceStr = Number.isFinite(numeric) ? formatCurrency(numeric, currency) : "N/A";
  const itemTotal = Number.isFinite(numeric) ? formatCurrency(numeric * quantity, currency) : "N/A";
  const itemName = String(item?.name || "Item").replace(/[<>]/g, "");

  const selectionRows = entries.length > 0
    ? entries.map(e => `<span style="display:inline-block;background:#292524;color:#fbbf24;border:1px solid rgba(251,191,36,0.4);padding:3px 10px;border-radius:5px;margin:2px 4px 2px 0;font-size:12px;font-weight:700;">${e.label}: ${e.value}</span>`).join("")
    : '<span style="font-size:12px;color:#78716c;font-style:italic;">No custom options</span>';

  return `
    <div style="background:#1c1917;border-left:3px solid #fbbf24;padding:14px 16px;margin:8px 0;border-radius:8px;">
      <div style="font-size:15px;font-weight:700;color:#f5f5f4;margin-bottom:8px;">${itemName}</div>
      <div style="margin-bottom:8px;line-height:1.9;">${selectionRows}</div>
      <div style="font-size:13px;color:#a8a29e;">
        ${quantity > 1 ? `${quantity}× ${priceStr} = <strong style="color:#fbbf24;">${itemTotal}</strong>` : priceStr}
      </div>
    </div>
  `;
}

async function sendAdminEmail(adminEmail: string, orderDetails: any) {
  const shortId = String(orderDetails.order_id).slice(0, 8).toUpperCase();
  const itemsHtml = (orderDetails.items || []).map((item: any) => buildItemHtml(item, orderDetails.currency)).join("");
  const orderDate = new Date(orderDetails.created_at).toLocaleString("en-GB", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Zeuservices Admin <admin@zeuservices.com>",
        to: adminEmail,
        subject: `[NEW ORDER] #${shortId} — ${formatCurrency(orderDetails.total_amount, orderDetails.currency)}`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0c0a09;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0c0a09;padding:28px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#1c1917;border-radius:12px;overflow:hidden;border:1px solid rgba(251,191,36,0.25);">

      <!-- Header -->
      <tr>
        <td style="background:#0c0a09;padding:24px;text-align:center;border-bottom:2px solid #fbbf24;">
          <div style="font-size:11px;color:#fbbf24;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Zeuservices</div>
          <div style="font-size:20px;font-weight:900;color:#f5f5f4;margin-top:4px;">New Order Received</div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:24px;">

          <!-- Order summary -->
          <div style="background:#0c0a09;border:1px solid rgba(251,191,36,0.2);border-radius:10px;padding:16px;margin-bottom:20px;">
            <div style="font-size:11px;color:#78716c;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;font-weight:700;">Order Info</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="font-size:13px;color:#a8a29e;padding:3px 0;">Order ID</td><td style="font-size:13px;color:#f5f5f4;text-align:right;font-weight:700;">#${shortId}</td></tr>
              <tr><td style="font-size:13px;color:#a8a29e;padding:3px 0;">Customer</td><td style="font-size:13px;color:#f5f5f4;text-align:right;">${orderDetails.customer_name || orderDetails.customer_email}</td></tr>
              <tr><td style="font-size:13px;color:#a8a29e;padding:3px 0;">Email</td><td style="font-size:13px;text-align:right;"><a href="mailto:${orderDetails.customer_email}" style="color:#fbbf24;text-decoration:none;">${orderDetails.customer_email}</a></td></tr>
              <tr><td style="font-size:13px;color:#a8a29e;padding:3px 0;">Date</td><td style="font-size:13px;color:#f5f5f4;text-align:right;">${orderDate}</td></tr>
              <tr><td style="font-size:13px;color:#a8a29e;padding:3px 0;">Payment</td><td style="font-size:13px;color:#f5f5f4;text-align:right;">${orderDetails.payment_method === "stripe_checkout" ? "Stripe" : (orderDetails.payment_method || "Stripe")}</td></tr>
              <tr><td style="font-size:14px;color:#a8a29e;padding:6px 0 0;font-weight:700;">Total</td><td style="font-size:18px;color:#fbbf24;text-align:right;font-weight:900;">${formatCurrency(orderDetails.total_amount, orderDetails.currency)}</td></tr>
            </table>
          </div>

          <!-- Items -->
          <div style="font-size:11px;color:#78716c;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;font-weight:700;">Items Ordered</div>
          ${itemsHtml || '<div style="color:#78716c;font-size:14px;">No items.</div>'}

          <!-- CTA -->
          <div style="text-align:center;margin:24px 0 0;">
            <a href="https://zeuservices.com/admin/orders" style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#0c0a09;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:800;font-size:14px;">Open Admin Panel</a>
          </div>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:14px 24px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="font-size:11px;color:#57534e;margin:0;">Automated admin notification · Zeuservices · <a href="https://zeuservices.com" style="color:#fbbf24;text-decoration:none;">zeuservices.com</a></p>
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

    const result = await response.json();

    if (response.status === 429 && attempt < 2) {
      const wait = Math.pow(2, attempt) * 1000;
      console.log(`Rate limited for ${adminEmail}, retrying in ${wait}ms`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }

    if (!response.ok) console.error(`Resend error for ${adminEmail}:`, result);
    return result;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const body = await req.json();
    const orderId = body.orderId || body.order_id;

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing orderId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders").select("*").eq("id", orderId).single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { customer_email, customer_name, total_amount, currency, items, payment_method, created_at } = order;

    const { data: admins } = await supabase.from("admin_users").select("user_id").eq("active", true);

    if (!admins || admins.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No admins to notify" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await Promise.all(
      admins.map(async (admin, index) => {
        await new Promise(r => setTimeout(r, index * 1000));
        const { data: userData } = await supabase.auth.admin.getUserById(admin.user_id);
        if (!userData?.user?.email) return null;
        return sendAdminEmail(userData.user.email, {
          order_id: orderId, customer_email, customer_name,
          total_amount, currency, items, payment_method, created_at,
        }).catch(err => { console.error(`Failed to email ${userData.user.email}:`, err); return null; });
      })
    );

    const successCount = results.filter(Boolean).length;
    console.log(`✅ Admin notifications sent to ${successCount} admin(s) for order ${String(orderId).slice(0, 8)}`);

    return new Response(JSON.stringify({ success: true, admins_notified: successCount }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-order-admins error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
