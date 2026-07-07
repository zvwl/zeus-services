import Link from "next/link";
import { CheckCircle2, Clock, PackageCheck, Sparkles, Zap } from "lucide-react";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { fulfillCheckoutSession } from "@/lib/fulfill";
import { formatMoney } from "@/lib/currency";
import { Badge, ButtonLink, Card, statusBadgeVariant } from "@/components/ui";
import { Float, Reveal } from "@/components/motion";
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
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
      {cart === "1" && <ClearCart />}

      <div className="relative text-center">
        {/* Subtle celebratory sparks — decorative only */}
        <Float className="pointer-events-none absolute left-4 top-2 hidden sm:block" duration={5}>
          <Sparkles aria-hidden className="h-6 w-6 text-gold/60" />
        </Float>
        <Float className="pointer-events-none absolute right-6 top-12 hidden sm:block" duration={7} amplitude={10}>
          <Zap aria-hidden className="h-5 w-5 text-primary-light/60" fill="currentColor" />
        </Float>
        <Float className="pointer-events-none absolute right-16 -top-2 hidden sm:block" duration={6} amplitude={6}>
          <Sparkles aria-hidden className="h-4 w-4 text-primary-light/50" />
        </Float>

        <Reveal y={12}>
          <span className="relative mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_60px_-10px_rgba(16,185,129,0.55)]">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </span>
        </Reveal>
        <Reveal y={14} delay={0.08}>
          <h1 className="mt-6 text-3xl font-extrabold text-white sm:text-4xl">
            Payment <span className="text-gradient">successful!</span>
          </h1>
          <p className="mt-3 text-zinc-400">
            Thank you for your purchase — a receipt has been emailed to you by
            Stripe.
          </p>
        </Reveal>
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
        // CSS fade-up, not framer <Reveal>: the confirmation card carries the
        // delivered payloads, which must never sit at opacity:0 waiting for
        // hydration (decorative sparkles above can stay framer).
        <div className="animate-fade-up" style={{ animationDelay: "150ms" }}>
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
                    <p className="font-semibold tabular-nums text-white">
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
              <span className="text-xl font-bold tabular-nums text-white">
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
        </div>
      ) : (
        <Reveal y={18} delay={0.15}>
          <Card className="mt-10 text-center text-sm text-zinc-400">
            We&apos;re confirming your payment. Your order will appear in{" "}
            <Link href="/account/orders" className="text-primary-light underline">
              your orders
            </Link>{" "}
            within a minute.
          </Card>
        </Reveal>
      )}

      <Reveal y={14} delay={0.25}>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/account/orders" variant="outline">
            View my orders
          </ButtonLink>
          <ButtonLink href="/games">Keep shopping</ButtonLink>
        </div>
      </Reveal>
    </div>
  );
}
