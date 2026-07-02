import type { Metadata } from "next";
import { XCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";

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
    await db
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("status", "pending");
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
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-32 text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
        <XCircle className="h-9 w-9 text-red-400" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold text-white">
        Checkout cancelled
      </h1>
      <p className="mt-2 max-w-md text-zinc-400">
        No payment was taken. Your order was not completed — you can try again
        whenever you&apos;re ready.
      </p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/games">Back to store</ButtonLink>
        <ButtonLink href="/support" variant="outline">
          Need help?
        </ButtonLink>
      </div>
    </div>
  );
}
