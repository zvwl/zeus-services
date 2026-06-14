import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, EmptyState, statusBadgeVariant } from "@/components/ui";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/types";

export const revalidate = 0;

export default async function OrdersPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account/orders");

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orders = (data as (Order & { items: OrderItem[] })[]) ?? [];

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-10 w-10" />}
        title="No orders yet"
        description="Your purchases will show up here with live delivery status."
      />
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <Link
          key={o.id}
          href={`/account/orders/${o.id}`}
          className="glass block p-5 transition hover:border-primary/40"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-white">Order #{o.order_number}</p>
              <p className="text-xs text-zinc-500">{formatDateTime(o.created_at)}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-white">
                {formatMoney(Number(o.total), o.currency)}
              </span>
              <Badge variant={statusBadgeVariant(o.status)}>{o.status}</Badge>
            </div>
          </div>
          <p className="mt-3 text-sm text-zinc-400">
            {o.items
              .map(
                (i) =>
                  `${i.quantity}× ${i.product_name}${
                    i.variant_name ? ` (${i.variant_name})` : ""
                  }`
              )
              .join(" · ")}
          </p>
        </Link>
      ))}
    </div>
  );
}
