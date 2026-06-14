import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, statusBadgeVariant } from "@/components/ui";
import { formatMoney } from "@/lib/currency";
import { formatDateTime, cn } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/types";

export const revalidate = 0;

const FILTERS = [
  "all",
  "pending",
  "paid",
  "processing",
  "completed",
  "cancelled",
  "refunded",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = FILTERS.includes(status ?? "") ? status! : "all";

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter !== "all") query = query.eq("status", filter);
  const { data } = await query;
  const orders = (data as (Order & { items: OrderItem[] })[]) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white">Orders</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/orders" : `/admin/orders?status=${f}`}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition",
              filter === f
                ? "border-primary/50 bg-primary/15 text-primary-light"
                : "border-edge bg-raised/50 text-zinc-400 hover:text-white"
            )}
          >
            {f}
          </Link>
        ))}
      </div>

      <div className="glass mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {orders.map((o) => (
              <tr key={o.id} className="transition hover:bg-raised/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-semibold text-primary-light hover:underline"
                  >
                    #{o.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-300">{o.email ?? "guest"}</td>
                <td className="max-w-[260px] truncate px-4 py-3 text-zinc-400">
                  {o.items?.map((i) => `${i.quantity}× ${i.product_name}`).join(", ")}
                </td>
                <td className="px-4 py-3 font-semibold text-white">
                  {formatMoney(Number(o.total), o.currency)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadgeVariant(o.status)}>{o.status}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {formatDateTime(o.created_at)}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
