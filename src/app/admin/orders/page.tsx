import Link from "next/link";
import { Download } from "lucide-react";
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

// Date-range chips: label → days back (null = all time).
const RANGES: { key: string; label: string; days: number | null }[] = [
  { key: "all", label: "All time", days: null },
  { key: "today", label: "Today", days: 1 },
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
];

const PAGE_SIZE = 50;
const REVENUE_STATUSES = ["paid", "processing", "completed"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; range?: string; page?: string }>;
}) {
  const { status, q, range: rangeRaw, page: pageRaw } = await searchParams;
  const filter = FILTERS.includes(status ?? "") ? status! : "all";
  const range = RANGES.find((r) => r.key === rangeRaw) ?? RANGES[0];
  const page = Math.max(1, Number(pageRaw) || 1);
  const search = (q ?? "").trim();
  const isOrderNumber = /^#?\d+$/.test(search);

  const supabase = await createClient();
  // Shared filter plumbing for the page query, the aggregate and the CSV export.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFilters = (query: any) => {
    if (filter !== "all") query = query.eq("status", filter);
    if (range.days) {
      query = query.gte(
        "created_at",
        new Date(Date.now() - range.days * 86_400_000).toISOString()
      );
    }
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
    return query;
  };

  // Page of rows + a slim aggregate over the WHOLE filtered set, so the summary
  // bar reflects the filter rather than just the visible page.
  const [{ data, count }, { data: aggRows }] = await Promise.all([
    applyFilters(
      supabase
        .from("orders")
        .select("*, items:order_items(*)", { count: "exact" })
    )
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    applyFilters(supabase.from("orders").select("subtotal_usd, status")),
  ]);
  const orders = (data as (Order & { items: OrderItem[] })[]) ?? [];
  const total = count ?? orders.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const revenueUsd = ((aggRows as { subtotal_usd: number; status: string }[]) ?? [])
    .filter((r) => REVENUE_STATUSES.includes(r.status))
    .reduce((s, r) => s + Number(r.subtotal_usd), 0);

  const buildHref = (overrides: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (range.key !== "all") params.set("range", range.key);
    if (search) params.set("q", search);
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };
  const exportHref = buildHref({}).replace("/admin/orders", "/admin/orders/export");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Orders</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Search, filter and open orders to deliver items or issue refunds.
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <form action="/admin/orders" className="w-full sm:w-72">
            {filter !== "all" && (
              <input type="hidden" name="status" value={filter} />
            )}
            {range.key !== "all" && (
              <input type="hidden" name="range" value={range.key} />
            )}
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Order ref, # or email…"
              className="input"
            />
          </form>
          <a
            href={exportHref}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-edge bg-raised/50 px-3.5 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-primary/50 hover:text-white"
            title="Download the current filter as CSV"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </a>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={buildHref({ status: f === "all" ? null : f, page: null })}
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
        <span aria-hidden className="mx-1 h-4 w-px bg-edge" />
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={buildHref({ range: r.key === "all" ? null : r.key, page: null })}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
              range.key === r.key
                ? "border-primary/50 bg-primary/15 text-primary-light"
                : "border-edge bg-raised/50 text-zinc-400 hover:text-white"
            )}
          >
            {r.label}
          </Link>
        ))}
      </div>

      {/* Summary of the whole filtered set (not just this page) */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="glass rounded-xl px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Orders</p>
          <p className="mt-0.5 text-xl font-extrabold text-white">{total}</p>
        </div>
        <div className="glass rounded-xl px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Revenue (paid · USD)
          </p>
          <p className="mt-0.5 text-xl font-extrabold text-white">
            {formatMoney(revenueUsd, "USD")}
          </p>
        </div>
        <div className="glass rounded-xl px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Avg order (USD)
          </p>
          <p className="mt-0.5 text-xl font-extrabold text-white">
            {formatMoney(
              revenueUsd /
                Math.max(
                  1,
                  ((aggRows as { status: string }[]) ?? []).filter((r) =>
                    REVENUE_STATUSES.includes(r.status)
                  ).length
                ),
              "USD"
            )}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <AdminTable
          minWidth={720}
          empty={
            search || filter !== "all" || range.key !== "all"
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

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
          <span>
            Page {page} of {totalPages} · {total} orders
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ page: page - 1 === 1 ? null : String(page - 1) })}
                className="rounded-lg border border-edge px-3 py-1.5 transition hover:text-white"
              >
                ← Newer
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ page: String(page + 1) })}
                className="rounded-lg border border-edge px-3 py-1.5 transition hover:text-white"
              >
                Older →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
