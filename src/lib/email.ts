// Best-effort transactional email via Resend (https://resend.com).
// No-op when RESEND_API_KEY is unset, and never throws into the request
// path — mirrors the Discord notifier.
import { formatMoney } from "@/lib/currency";
import { siteUrl } from "@/lib/utils";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface SendResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: SendArgs): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { ok: false, skipped: true, error: "RESEND_API_KEY not set in this deployment" };
  }
  if (!to) return { ok: false, skipped: true, error: "no recipient" };
  const from =
    process.env.EMAIL_FROM || "Zeuservices <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Resend email failed:", res.status, body);
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("Resend email error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "network error" };
  }
}

/** Shared branded shell so all emails look consistent. */
function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#07070e;padding:32px 0;font-family:Inter,-apple-system,Segoe UI,Roboto,sans-serif;color:#e4e4e7">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px" cellpadding="0" cellspacing="0">
      <tr><td style="padding:0 24px 20px">
        <span style="font-size:22px;font-weight:800;color:#fff">⚡ Zeu<span style="color:#a78bfa">services</span></span>
      </td></tr>
      <tr><td style="background:#12121f;border:1px solid #1e1e30;border-radius:16px;padding:28px 24px">
        <h1 style="margin:0 0 16px;font-size:20px;color:#fff">${title}</h1>
        ${body}
      </td></tr>
      <tr><td style="padding:18px 24px;color:#52525b;font-size:12px">
        You're receiving this because you placed an order or have an account at Zeuservices.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function itemRows(
  items: { quantity: number; product_name: string; variant_name: string | null }[]
) {
  return items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #1e1e30;color:#d4d4d8">${i.quantity}× ${i.product_name}${
          i.variant_name ? ` <span style="color:#71717a">(${i.variant_name})</span>` : ""
        }</td></tr>`
    )
    .join("");
}

export function orderConfirmationEmail(opts: {
  orderNumber: number | string;
  total: number;
  currency: string;
  items: { quantity: number; product_name: string; variant_name: string | null }[];
  manual: boolean;
}) {
  const body = `
    <p style="margin:0 0 16px;color:#a1a1aa;line-height:1.6">Thanks for your purchase! Your payment was successful and your order is confirmed.</p>
    <p style="margin:0 0 6px;color:#71717a;font-size:13px">Order</p>
    <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#fff">${opts.orderNumber}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">${itemRows(opts.items)}</table>
    <p style="margin:0 0 20px;font-size:16px;color:#fff"><strong>Total paid:</strong> ${formatMoney(opts.total, opts.currency)}</p>
    ${
      opts.manual
        ? `<p style="margin:0;padding:12px 14px;background:rgba(56,189,248,.1);border-radius:10px;color:#bae6fd;font-size:14px">⏳ This order is being processed by our team and will be delivered shortly — we'll email you the moment it's done.</p>`
        : `<p style="margin:0;padding:12px 14px;background:rgba(34,197,94,.1);border-radius:10px;color:#bbf7d0;font-size:14px">✅ Your delivery details are available in your account now.</p>`
    }
    <p style="margin:20px 0 0"><a href="${siteUrl()}/account/orders" style="color:#a78bfa">View your order →</a></p>`;
  return layout(`Order ${opts.orderNumber} confirmed ⚡`, body);
}

const STATUS_COPY: Record<
  string,
  { heading: string; body: string; accent: string }
> = {
  pending: {
    heading: "We've received your order",
    body: "Your order has been created and is awaiting payment. Complete checkout to get it moving.",
    accent: "#a1a1aa",
  },
  paid: {
    heading: "Payment confirmed ✅",
    body: "Thanks! We've received your payment and your order is now being prepared.",
    accent: "#22c55e",
  },
  processing: {
    heading: "Your order is being processed",
    body: "Our team is working on your order right now — we'll email you the moment it's delivered.",
    accent: "#38bdf8",
  },
  completed: {
    heading: "Your order is complete 🎉",
    body: "Your order has been fully delivered. Thanks for choosing Zeuservices — we hope to see you again!",
    accent: "#22c55e",
  },
  cancelled: {
    heading: "Your order was cancelled",
    body: "This order has been cancelled. If you were charged, a refund will follow shortly. Reply to this email if you have any questions.",
    accent: "#ef4444",
  },
  refunded: {
    heading: "Your order was refunded",
    body: "We've issued a refund for this order. It usually lands back on your original payment method within 5–10 business days.",
    accent: "#fbbf24",
  },
};

export function orderStatusSubject(
  orderNumber: number | string,
  status: string
) {
  const map: Record<string, string> = {
    pending: `Order ${orderNumber} received`,
    paid: `Payment confirmed — order ${orderNumber}`,
    processing: `Your order ${orderNumber} is being processed`,
    completed: `Your order ${orderNumber} is complete 🎉`,
    cancelled: `Your order ${orderNumber} was cancelled`,
    refunded: `Your order ${orderNumber} was refunded`,
  };
  return map[status] ?? `Update on your order ${orderNumber}`;
}

export function orderStatusEmail(opts: {
  orderNumber: number | string;
  status: string;
  total: number;
  currency: string;
}) {
  const copy =
    STATUS_COPY[opts.status] ?? {
      heading: `Order update`,
      body: `Your order status is now "${opts.status}".`,
      accent: "#a78bfa",
    };
  const body = `
    <p style="margin:0 0 16px;color:#a1a1aa;line-height:1.6">${copy.body}</p>
    <p style="margin:0 0 6px;color:#71717a;font-size:13px">Order</p>
    <p style="margin:0 0 14px;font-size:18px;font-weight:700;color:#fff">${opts.orderNumber}</p>
    <p style="margin:0 0 18px"><span style="display:inline-block;padding:6px 14px;border-radius:999px;background:#07070e;border:1px solid ${copy.accent};color:${copy.accent};font-size:13px;font-weight:700;text-transform:capitalize">${opts.status}</span></p>
    <p style="margin:0 0 4px;color:#71717a;font-size:13px">Order total</p>
    <p style="margin:0 0 20px;font-size:16px;color:#fff">${formatMoney(opts.total, opts.currency)}</p>
    <p style="margin:20px 0 0"><a href="${siteUrl()}/account/orders" style="color:#a78bfa">View your order →</a></p>`;
  return layout(copy.heading, body);
}

export function orderDeliveredEmail(opts: {
  orderNumber: number | string;
  productName: string;
  payload: string;
}) {
  const body = `
    <p style="margin:0 0 16px;color:#a1a1aa;line-height:1.6">Good news — your order has been delivered.</p>
    <p style="margin:0 0 6px;color:#71717a;font-size:13px">Order ${opts.orderNumber}</p>
    <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#fff">${opts.productName}</p>
    <pre style="margin:0 0 16px;padding:14px;background:#07070e;border:1px solid #1e1e30;border-radius:10px;color:#bbf7d0;font-size:13px;white-space:pre-wrap;word-break:break-word">${opts.payload}</pre>
    <p style="margin:0"><a href="${siteUrl()}/account/orders" style="color:#a78bfa">Open in your account →</a></p>`;
  return layout("Your order has been delivered 🎉", body);
}
