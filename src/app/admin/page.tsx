import Link from "next/link";
import {
  Coffee,
  LifeBuoy,
  Package,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, statusBadgeVariant } from "@/components/ui";
import { RevenueChart } from "@/components/admin/Charts";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/utils";
import type { AuditLog, Order } from "@/lib/types";

export const revalidate = 0;

const PAID = ["paid", "processing", "completed"];

export default async function AdminDashboard() {
  const supabase = await createClient();
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();

  const [
    { data: recentOrders },
    { data: orders30 },
    { count: customerCount },
    { count: newCustomers30 },
    { count: openTickets },
    { count: pendingReviews },
    { data: donations },
    { data: auditLogs },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*, items:order_items(product_name, quantity)")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("orders")
      .select("created_at, subtotal_usd, status")
      .gte("created_at", since30),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since30),
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .in("status", ["open"]),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("is_approved", false),
    supabase.from("donations").select("amount, currency").eq("status", "completed"),
    supabase
      .from("audit_logs")
      .select("*, actor:profiles(username)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const paid30 = (orders30 ?? []).filter((o) => PAID.includes(o.status));
  const revenue30 = paid30.reduce((s, o) => s + Number(o.subtotal_usd), 0);

  // Build a 30-day revenue series.
  const series: { date: string; revenue: number; orders: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000);
    const key = day.toISOString().slice(0, 10);
    const dayOrders = paid30.filter((o) => o.created_at.slice(0, 10) === key);
    series.push({
      date: day.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      revenue: Math.round(dayOrders.reduce((s, o) => s + Number(o.subtotal_usd), 0) * 100) / 100,
      orders: dayOrders.length,
    });
  }

  const stats = [
    {
      label: "Revenue (30d)",
      value: formatMoney(revenue30, "USD"),
      icon: TrendingUp,
      tint: "text-emerald-300",
    },
    {
      label: "Paid orders (30d)",
      value: paid30.length.toLocaleString(),
      icon: Package,
      tint: "text-primary-light",
    },
    {
      label: "Customers",
      value: `${(customerCount ?? 0).toLocaleString()} (+${newCustomers30 ?? 0})`,
      icon: Users,
      tint: "text-sky-300",
    },
    {
      label: "Open tickets",
      value: (openTickets ?? 0).toLocaleString(),
      icon: LifeBuoy,
      tint: "text-amber-300",
    },
    {
      label: "Pending reviews",
      value: (pendingReviews ?? 0).toLocaleString(),
      icon: Star,
      tint: "text-fuchsia-300",
    },
    {
      label: "Donations",
      value: formatMoney(
        (donations ?? []).reduce((s, d) => s + Number(d.amount), 0),
        "USD"
      ),
      icon: Coffee,
      tint: "text-gold",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white">Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Store performance at a glance.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <s.icon className={`h-4 w-4 ${s.tint}`} />
            <p className="mt-2 truncate text-lg font-extrabold text-white">{s.value}</p>
            <p className="text-xs text-zinc-500">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 font-bold text-white">Revenue — last 30 days (USD)</h2>
        <RevenueChart data={series} />
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-white">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-primary-light hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-edge">
            {((recentOrders as (Order & { items: { product_name: string; quantity: number }[] })[]) ?? []).map(
              (o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-raised/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {o.reference ?? `#${o.order_number}`} · {o.email ?? "guest"}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {o.items?.map((i) => `${i.quantity}× ${i.product_name}`).join(", ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-white">
                      {formatMoney(Number(o.total), o.currency)}
                    </span>
                    <Badge variant={statusBadgeVariant(o.status)}>{o.status}</Badge>
                  </div>
                </Link>
              )
            )}
            {(recentOrders ?? []).length === 0 && (
              <p className="py-6 text-center text-sm text-zinc-500">No orders yet.</p>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-bold text-white">Recent admin activity</h2>
          <div className="divide-y divide-edge">
            {((auditLogs as AuditLog[]) ?? []).map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-300">
                    <span className="font-semibold text-primary-light">
                      {log.actor?.username ?? "system"}
                    </span>{" "}
                    → {log.action}
                  </p>
                  <p className="text-xs text-zinc-600">{log.entity}</p>
                </div>
                <span className="shrink-0 text-xs text-zinc-600">
                  {formatDateTime(log.created_at)}
                </span>
              </div>
            ))}
            {(auditLogs ?? []).length === 0 && (
              <p className="py-6 text-center text-sm text-zinc-500">No activity yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
