import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, statusBadgeVariant } from "@/components/ui";
import { AdminTable } from "@/components/admin/AdminTable";
import { formatMoney } from "@/lib/currency";
import { formatDateTime, cn, sanitizeSearchTerm } from "@/lib/utils";
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
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const filter = FILTERS.includes(status ?? "") ? status! : "all";
  const search = (q ?? "").trim();
  const isOrderNumber = /^#?\d+$/.test(search);

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter !== "all") query = query.eq("status", filter);
  if (search) {
    if (isOrderNumber) {
      query = query.eq("order_number", Number(search.replace(/^#/, "")));
    } else {
      const safe = sanitizeSearchTerm(search);
      if (safe) {
        query = query.or(`email.ilike.%${safe}%,reference.ilike.%${safe}%`);
      }
    }
  }
  const { data } = await query;
  const orders = (data as (Order & { items: OrderItem[] })[]) ?? [];

  const filterHref = (f: string) => {
    const params = new URLSearchParams();
    if (f !== "all") params.set("status", f);
    if (search) params.set("q", search);
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Orders</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Search, filter and open orders to deliver items or issue refunds.
          </p>
        </div>
        <form action="/admin/orders" className="w-full sm:w-72">
          {filter !== "all" && (
            <input type="hidden" name="status" value={filter} />
          )}
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Order ref, # or email…"
            className="input"
          />
        </form>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={filterHref(f)}
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

      <div className="mt-6">
        <AdminTable
          minWidth={720}
          empty={
            search || filter !== "all"
              ? "No orders match this filter or search."
              : "No orders yet — they'll appear here as soon as customers buy."
          }
          columns={[
            { header: "Order" },
            { header: "Customer" },
            { header: "Items" },
            { header: "Total" },
            { header: "Status" },
            { header: "Date" },
          ]}
          rows={orders.map((o) => ({
            key: o.id,
            cells: [
              <Link
                key="ref"
                href={`/admin/orders/${o.id}`}
                className="font-semibold text-primary-light hover:underline"
              >
                {o.reference ?? `#${o.order_number}`}
              </Link>,
              <span key="email" className="break-all text-zinc-300">
                {o.email ?? "guest"}
              </span>,
              <span key="items" className="block max-w-[260px] truncate text-zinc-400">
                {o.items?.map((i) => `${i.quantity}× ${i.product_name}`).join(", ")}
              </span>,
              <span key="total" className="font-semibold text-white">
                {formatMoney(Number(o.total), o.currency)}
              </span>,
              <Badge key="status" variant={statusBadgeVariant(o.status)}>
                {o.status}
              </Badge>,
              <span key="date" className="text-xs text-zinc-500">
                {formatDateTime(o.created_at)}
              </span>,
            ],
          }))}
        />
      </div>
    </div>
  );
}
