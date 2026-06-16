import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, statusBadgeVariant } from "@/components/ui";
import { ActionSelect } from "@/components/admin/ActionControls";
import { DeliverItemForm } from "@/components/admin/DeliverItemForm";
import { updateOrderStatus } from "@/app/admin/actions";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/utils";
import type { Order, OrderItem, Profile } from "@/lib/types";

export const revalidate = 0;

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, items:order_items(*), profile:profiles(username, email)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const order = data as Order & { items: OrderItem[]; profile: Profile | null };

  return (
    <div className="max-w-4xl">
      <Link href="/admin/orders" className="text-sm text-zinc-500 hover:text-primary-light">
        ← All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            Order {order.reference ?? `#${order.order_number}`}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {formatDateTime(order.created_at)} · {order.email ?? "guest"}
            {order.profile?.username ? ` (@${order.profile.username})` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusBadgeVariant(order.status)}>{order.status}</Badge>
          <ActionSelect
            action={updateOrderStatus}
            fields={{ id: order.id }}
            name="status"
            value={order.status}
            options={[
              "pending",
              "paid",
              "processing",
              "completed",
              "cancelled",
              "refunded",
            ].map((s) => ({ value: s, label: `Set: ${s}` }))}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-zinc-500">Total ({order.currency})</p>
          <p className="text-lg font-bold text-white">
            {formatMoney(Number(order.total), order.currency)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500">Subtotal (USD)</p>
          <p className="text-lg font-bold text-white">
            {formatMoney(Number(order.subtotal_usd), "USD")}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-zinc-500">Stripe payment</p>
          {order.stripe_payment_intent ? (
            <a
              href={`https://dashboard.stripe.com/payments/${order.stripe_payment_intent}`}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-sm font-medium text-primary-light hover:underline"
            >
              {order.stripe_payment_intent.slice(0, 18)}…
            </a>
          ) : (
            <p className="text-sm text-zinc-500">Not paid</p>
          )}
        </Card>
      </div>

      <h2 className="mt-8 mb-3 font-bold text-white">Items</h2>
      <div className="space-y-4">
        {order.items.map((item) => (
          <Card key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">
                  {item.quantity}× {item.product_name}
                </p>
                {item.variant_name && (
                  <p className="text-sm text-zinc-400">{item.variant_name}</p>
                )}
              </div>
              <p className="font-semibold text-white">
                {formatMoney(item.unit_price * item.quantity, order.currency)}
              </p>
            </div>

            {Object.keys(item.custom_fields ?? {}).length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-sm">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Customer-provided details
                </p>
                {Object.entries(item.custom_fields).map(([k, v]) => (
                  <p key={k} className="font-mono text-zinc-300">
                    <span className="text-zinc-500">{k}:</span> {v}
                  </p>
                ))}
              </div>
            )}

            <div className="mt-4 border-t border-edge pt-4">
              {item.delivered_payload ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                  <p className="mb-1 font-semibold">
                    ✓ Delivered {item.delivered_at ? formatDateTime(item.delivered_at) : ""}
                  </p>
                  <p className="whitespace-pre-wrap font-mono text-xs">
                    {item.delivered_payload}
                  </p>
                </div>
              ) : (
                <DeliverItemForm itemId={item.id} />
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
