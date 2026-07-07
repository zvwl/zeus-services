import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, PackageCheck } from "lucide-react";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, statusBadgeVariant } from "@/components/ui";
import { OrderItemReview } from "@/components/OrderItemReview";
import { Reveal } from "@/components/motion";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/types";

export const revalidate = 0;

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) notFound();
  const order = data as Order & { items: OrderItem[] };

  return (
    <div className="max-w-3xl">
      <Link
        href="/account/orders"
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl text-sm text-zinc-500 transition hover:text-primary-light"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>
      <Reveal y={16}>
        <Card className="mt-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge pb-4">
            <div>
              {/* h2: the account layout already renders the page h1. */}
              <h2 className="text-xl font-extrabold text-white">
                Order {order.reference ?? `#${order.order_number}`}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Placed {formatDateTime(order.created_at)}
              </p>
            </div>
            <Badge variant={statusBadgeVariant(order.status)}>
              {order.status}
            </Badge>
          </div>

          <ul className="divide-y divide-edge">
            {order.items.map((item) => (
              <li key={item.id} className="py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">
                      {item.quantity}× {item.product_name}
                    </p>
                    {item.variant_name && (
                      <p className="text-sm text-zinc-400">{item.variant_name}</p>
                    )}
                  </div>
                  <p className="shrink-0 font-semibold text-white">
                    {formatMoney(item.unit_price * item.quantity, order.currency)}
                  </p>
                </div>

                {Object.keys(item.custom_fields ?? {}).length > 0 && (
                  <div className="mt-3 space-y-1 rounded-xl border border-edge bg-raised/60 p-3.5 text-sm">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Your details
                    </p>
                    {Object.entries(item.custom_fields).map(([k, v]) => (
                      <p key={k} className="text-zinc-400">
                        <span className="text-zinc-500">{k}:</span>{" "}
                        {k.toLowerCase().includes("password") ? "••••••••" : v}
                      </p>
                    ))}
                  </div>
                )}

                {item.delivered_payload ? (
                  <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                    <p className="mb-2 flex items-center gap-1.5 font-semibold">
                      <PackageCheck className="h-4 w-4 shrink-0" /> Delivered
                      {item.delivered_at
                        ? ` · ${formatDateTime(item.delivered_at)}`
                        : ""}
                    </p>
                    <p className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-bg/40 px-3 py-2.5 font-mono text-xs leading-relaxed">
                      {item.delivered_payload}
                    </p>
                  </div>
                ) : ["paid", "processing"].includes(order.status) ? (
                  <p className="mt-3 flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 p-3.5 text-sm text-sky-200">
                    <Clock className="h-4 w-4 shrink-0" />
                    In progress — our team is working on this item.
                  </p>
                ) : null}

                {order.status === "completed" && item.product_id && (
                  <OrderItemReview
                    productId={item.product_id}
                    productName={item.product_name}
                  />
                )}
              </li>
            ))}
          </ul>

          <div className="space-y-1.5 border-t border-edge pt-4 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal (USD)</span>
              <span>{formatMoney(Number(order.subtotal_usd), "USD")}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-white">
              <span>Total paid ({order.currency})</span>
              <span>{formatMoney(Number(order.total), order.currency)}</span>
            </div>
          </div>
        </Card>
      </Reveal>
      <p className="mt-4 text-center text-xs text-zinc-500">
        Problem with this order?{" "}
        <Link href="/support" className="text-primary-light underline">
          Open a support ticket
        </Link>{" "}
        and quote order {order.reference ?? `#${order.order_number}`}.
      </p>
    </div>
  );
}
