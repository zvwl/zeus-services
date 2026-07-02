import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PackageCheck } from "lucide-react";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, statusBadgeVariant } from "@/components/ui";
import { OrderItemReview } from "@/components/OrderItemReview";
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
        className="text-sm text-zinc-500 hover:text-primary-light"
      >
        ← Back to orders
      </Link>
      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge pb-4">
          <div>
            <h1 className="text-xl font-extrabold text-white">
              Order {order.reference ?? `#${order.order_number}`}
            </h1>
            <p className="text-xs text-zinc-500">
              Placed {formatDateTime(order.created_at)}
            </p>
          </div>
          <Badge variant={statusBadgeVariant(order.status)}>{order.status}</Badge>
        </div>

        <ul className="divide-y divide-edge">
          {order.items.map((item) => (
            <li key={item.id} className="py-5">
              <div className="flex items-start justify-between gap-4">
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
                <div className="mt-3 rounded-xl bg-raised p-3 text-sm">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
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
                  <p className="mb-1.5 flex items-center gap-1.5 font-semibold">
                    <PackageCheck className="h-4 w-4" /> Delivered{" "}
                    {item.delivered_at ? `· ${formatDateTime(item.delivered_at)}` : ""}
                  </p>
                  <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {item.delivered_payload}
                  </p>
                </div>
              ) : ["paid", "processing"].includes(order.status) ? (
                <p className="mt-3 rounded-xl bg-sky-500/10 p-3 text-sm text-sky-200">
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
      <p className="mt-4 text-center text-xs text-zinc-600">
        Problem with this order?{" "}
        <Link href="/support" className="text-primary-light underline">
          Open a support ticket
        </Link>{" "}
        and quote order {order.reference ?? `#${order.order_number}`}.
      </p>
    </div>
  );
}
