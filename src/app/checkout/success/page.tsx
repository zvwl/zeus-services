import Link from "next/link";
import { CheckCircle2, Clock, PackageCheck } from "lucide-react";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { fulfillCheckoutSession } from "@/lib/fulfill";
import { formatMoney } from "@/lib/currency";
import { Badge, ButtonLink, Card, statusBadgeVariant } from "@/components/ui";
import { AnalyticsEvent } from "@/components/AnalyticsEvent";
import { ClearCart } from "@/components/ClearCart";
import type { Metadata } from "next";
import type { Order, OrderItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; cart?: string }>;
}) {
  const { session_id: sessionId, cart } = await searchParams;

  let order: (Order & { items: OrderItem[] }) | null = null;

  if (sessionId && hasAdminClient()) {
    const db = createAdminClient();

    // Webhook race: if the order is still pending, verify directly with
    // Stripe and fulfill inline (idempotent).
    if (stripeConfigured()) {
      try {
        const session = await getStripe().checkout.sessions.retrieve(sessionId);
        if (session.payment_status === "paid") {
          await fulfillCheckoutSession(session);
        }
      } catch {
        // ignore — we'll show whatever state the order is in
      }
    }

    const { data } = await db
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();
    order = (data as Order & { items: OrderItem[] }) ?? null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      {cart === "1" && <ClearCart />}
      <div className="text-center">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="h-9 w-9 text-emerald-400" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold text-white">
          Payment successful!
        </h1>
        <p className="mt-2 text-zinc-400">
          Thank you for your purchase — a receipt has been emailed to you by
          Stripe.
        </p>
      </div>

      {order && (
        <AnalyticsEvent
          name="purchase"
          params={{
            transaction_id: order.reference ?? String(order.order_number),
            value: Number(order.total),
            currency: order.currency,
          }}
        />
      )}

      {order ? (
        <Card className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge pb-4">
            <div>
              <p className="text-sm text-zinc-500">Order</p>
              <p className="text-lg font-bold text-white">
                {order.reference ?? `#${order.order_number}`}
              </p>
            </div>
            <Badge variant={statusBadgeVariant(order.status)}>
              {order.status}
            </Badge>
          </div>
          <ul className="divide-y divide-edge">
            {order.items?.map((item) => (
              <li key={item.id} className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">
                      {item.quantity}× {item.product_name}
                    </p>
                    {item.variant_name && (
                      <p className="text-sm text-zinc-500">{item.variant_name}</p>
                    )}
                  </div>
                  <p className="font-semibold text-white">
                    {formatMoney(item.unit_price * item.quantity, order.currency)}
                  </p>
                </div>
                {item.delivered_payload && (
                  <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                    <p className="mb-1 flex items-center gap-1.5 font-semibold">
                      <PackageCheck className="h-4 w-4" /> Delivery
                    </p>
                    <p className="whitespace-pre-wrap">{item.delivered_payload}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-edge pt-4">
            <span className="text-zinc-400">Total paid</span>
            <span className="text-xl font-bold text-white">
              {formatMoney(Number(order.total), order.currency)}
            </span>
          </div>
          {order.status === "processing" && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-sky-500/10 p-3 text-sm text-sky-200">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              Your order needs manual delivery. Our team has been notified and
              will complete it shortly — track progress in your account or on
              Discord.
            </p>
          )}
        </Card>
      ) : (
        <Card className="mt-10 text-center text-sm text-zinc-400">
          We&apos;re confirming your payment. Your order will appear in{" "}
          <Link href="/account/orders" className="text-primary-light underline">
            your orders
          </Link>{" "}
          within a minute.
        </Card>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <ButtonLink href="/account/orders" variant="outline">
          View my orders
        </ButtonLink>
        <ButtonLink href="/games">Keep shopping</ButtonLink>
      </div>
    </div>
  );
}
