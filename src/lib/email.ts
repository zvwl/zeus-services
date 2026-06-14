// Best-effort transactional email via Resend (https://resend.com).
// No-op when RESEND_API_KEY is unset, and never throws into the request
// path — mirrors the Discord notifier.
import { formatMoney } from "@/lib/currency";

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail({ to, subject, html, replyTo }: SendArgs) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  const from =
    process.env.EMAIL_FROM || "Zeus Services <onboarding@resend.dev>";
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
      console.error("Resend email failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Resend email error:", err);
  }
}

/** Shared branded shell so all emails look consistent. */
function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#07070e;padding:32px 0;font-family:Inter,-apple-system,Segoe UI,Roboto,sans-serif;color:#e4e4e7">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px" cellpadding="0" cellspacing="0">
      <tr><td style="padding:0 24px 20px">
        <span style="font-size:22px;font-weight:800;color:#fff">⚡ Zeus <span style="color:#a78bfa">Services</span></span>
      </td></tr>
      <tr><td style="background:#12121f;border:1px solid #1e1e30;border-radius:16px;padding:28px 24px">
        <h1 style="margin:0 0 16px;font-size:20px;color:#fff">${title}</h1>
        ${body}
      </td></tr>
      <tr><td style="padding:18px 24px;color:#52525b;font-size:12px">
        You're receiving this because you placed an order or have an account at Zeus Services.
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
    <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#fff">#${opts.orderNumber}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">${itemRows(opts.items)}</table>
    <p style="margin:0 0 20px;font-size:16px;color:#fff"><strong>Total paid:</strong> ${formatMoney(opts.total, opts.currency)}</p>
    ${
      opts.manual
        ? `<p style="margin:0;padding:12px 14px;background:rgba(56,189,248,.1);border-radius:10px;color:#bae6fd;font-size:14px">⏳ This order is being processed by our team and will be delivered shortly — we'll email you the moment it's done.</p>`
        : `<p style="margin:0;padding:12px 14px;background:rgba(34,197,94,.1);border-radius:10px;color:#bbf7d0;font-size:14px">✅ Your delivery details are available in your account now.</p>`
    }
    <p style="margin:20px 0 0"><a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://zeus-services.gg"}/account/orders" style="color:#a78bfa">View your order →</a></p>`;
  return layout(`Order #${opts.orderNumber} confirmed ⚡`, body);
}

export function orderDeliveredEmail(opts: {
  orderNumber: number | string;
  productName: string;
  payload: string;
}) {
  const body = `
    <p style="margin:0 0 16px;color:#a1a1aa;line-height:1.6">Good news — your order has been delivered.</p>
    <p style="margin:0 0 6px;color:#71717a;font-size:13px">Order #${opts.orderNumber}</p>
    <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#fff">${opts.productName}</p>
    <pre style="margin:0 0 16px;padding:14px;background:#07070e;border:1px solid #1e1e30;border-radius:10px;color:#bbf7d0;font-size:13px;white-space:pre-wrap;word-break:break-word">${opts.payload}</pre>
    <p style="margin:0"><a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://zeus-services.gg"}/account/orders" style="color:#a78bfa">Open in your account →</a></p>`;
  return layout("Your order has been delivered 🎉", body);
}
