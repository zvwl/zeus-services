import type { Metadata } from "next";
import { XCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { Reveal } from "@/components/motion";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Checkout cancelled",
  robots: { index: false, follow: false },
};

export const revalidate = 0;

// When the buyer backs out of Stripe Checkout they land here. Release the
// still-pending order so it doesn't linger in the admin as a fake "pending"
// sale. Matched by the order's UUID (unguessable — set only in our own
// cancel_url) so it can't be used to enumerate + cancel other people's orders,
// and guarded by status='pending' so it can never touch a paid order.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function cancelPendingOrder(orderId: string) {
  if (!UUID_RE.test(orderId) || !hasAdminClient()) return;
  try {
    const db = createAdminClient();
    const { data: cancelled } = await db
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("status", "pending")
      .select("stripe_session_id")
      .maybeSingle();
    // Expire the Stripe Checkout Session too, so the buyer can't navigate back
    // and pay for an order we've just cancelled (which would leave them charged
    // with no fulfilled order). Only reached when THIS call did the cancel.
    if (cancelled?.stripe_session_id && stripeConfigured()) {
      try {
        await getStripe().checkout.sessions.expire(cancelled.stripe_session_id);
      } catch {
        // already completed/expired — nothing to do
      }
    }
  } catch {
    // best effort — the session-expired webhook is the backstop
  }
}

export default async function CheckoutCancelledPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  if (order) await cancelPendingOrder(order);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-28 text-center sm:py-32">
      <Reveal y={12}>
        <span className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 shadow-[0_0_50px_-12px_rgba(239,68,68,0.5)]">
          <XCircle className="h-10 w-10 text-red-400" />
        </span>
      </Reveal>
      <Reveal y={14} delay={0.08}>
        <h1 className="mt-6 text-3xl font-extrabold text-white sm:text-4xl">
          Checkout cancelled
        </h1>
        <p className="mx-auto mt-3 max-w-md text-zinc-400">
          No payment was taken. Your order was not completed — your cart is
          untouched, so you can pick up right where you left off.
        </p>
      </Reveal>
      <Reveal y={12} delay={0.16}>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/games">Back to store</ButtonLink>
          <ButtonLink href="/support" variant="outline">
            Need help?
          </ButtonLink>
        </div>
      </Reveal>
    </div>
  );
}
