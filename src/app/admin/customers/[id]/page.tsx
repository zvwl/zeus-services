import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile, isAdmin } from "@/lib/auth";
import { Badge, Card, statusBadgeVariant } from "@/components/ui";
import { ActionButton } from "@/components/admin/ActionControls";
import { toggleBan } from "@/app/admin/actions";
import { formatMoney } from "@/lib/currency";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Order, OrderItem, Profile } from "@/lib/types";

export const revalidate = 0;

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const me = await getProfile();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();
  const customer = profile as Profile;

  const { data: orderData } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("user_id", id)
    .order("created_at", { ascending: false });
  const orders = (orderData as (Order & { items: OrderItem[] })[]) ?? [];

  const paid = orders.filter((o) =>
    ["paid", "processing", "completed"].includes(o.status)
  );
  const lifetimeUsd = paid.reduce((s, o) => s + Number(o.subtotal_usd), 0);

  const detail = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-4 border-b border-edge py-2 text-sm last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-medium text-zinc-200">{value}</span>
    </div>
  );

  return (
    <div className="max-w-5xl">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            {customer.username ?? "—"}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-zinc-500">
            <Mail className="h-3.5 w-3.5" /> {customer.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {customer.is_banned ? (
            <Badge variant="danger">banned</Badge>
          ) : (
            <Badge variant="success">active</Badge>
          )}
          <Badge variant={customer.role === "customer" ? "default" : "gold"}>
            {customer.role.replace("_", " ")}
          </Badge>
          {isAdmin(me) && me?.id !== customer.id && (
            <ActionButton
              action={toggleBan}
              fields={{ user_id: customer.id }}
              variant={customer.is_banned ? "success" : "danger"}
              confirmText={
                customer.is_banned
                  ? `Unban ${customer.username ?? customer.email}?`
                  : `Ban ${customer.username ?? customer.email}? They won't be able to purchase.`
              }
            >
              {customer.is_banned ? "Unban" : "Ban"}
            </ActionButton>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-bold text-white">Details</h2>
            {detail("User ID", <span className="font-mono text-xs">{customer.id.slice(0, 8)}…</span>)}
            {detail("Joined", formatDate(customer.created_at))}
            {detail("Preferred currency", customer.preferred_currency)}
            {detail(
              "Discord",
              customer.discord_id ? (
                <span className="text-emerald-300">
                  ✓ {customer.discord_username ?? "linked"}
                </span>
              ) : (
                <span className="text-zinc-600">not linked</span>
              )
            )}
          </Card>
          <Card>
            <h2 className="mb-3 font-bold text-white">Lifetime value</h2>
            {detail("Paid orders", String(paid.length))}
            {detail("Total orders", String(orders.length))}
            {detail("Spent (USD)", formatMoney(lifetimeUsd, "USD"))}
          </Card>
        </div>

        <div>
          <h2 className="mb-3 font-bold text-white">Orders</h2>
          {orders.length === 0 ? (
            <Card className="flex items-center gap-3 text-sm text-zinc-500">
              <ShieldAlert className="h-5 w-5" /> No orders yet.
            </Card>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="glass block p-4 transition hover:border-primary/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-white">
                      {o.reference ?? `#${o.order_number}`}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">
                        {formatMoney(Number(o.total), o.currency)}
                      </span>
                      <Badge variant={statusBadgeVariant(o.status)}>
                        {o.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {formatDateTime(o.created_at)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {o.items
                      ?.map(
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
          )}
        </div>
      </div>
    </div>
  );
}
