import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  ChevronRight,
  Gift,
  LifeBuoy,
  Package,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { getProfile, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { attachGuestOrders } from "@/lib/orders";
import { Badge, Card, statusBadgeVariant } from "@/components/ui";
import { RevealGroup, RevealItem } from "@/components/motion";
import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const revalidate = 0;

const quickLinks = [
  {
    href: "/account/security",
    label: "Secure your account with 2FA",
    icon: ShieldCheck,
  },
  { href: "/support", label: "Open a support ticket", icon: LifeBuoy },
  { href: "/giveaways", label: "Enter live giveaways", icon: Gift },
];

export default async function AccountPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) redirect("/login?next=/account");

  // Claim any guest orders placed with this email (covers password logins,
  // which don't pass through /auth/callback). Idempotent + best effort.
  await attachGuestOrders(user.id, user.email);

  const supabase = await createClient();
  // count: "exact" on the recent-orders query returns the TOTAL matching rows
  // (ignoring the limit), so no separate head-only count query is needed.
  const [{ data: orders, count: orderCount }, { data: paidOrders }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      // Lifetime spend must sum ALL paid orders, not just the 5 most recent.
      supabase
        .from("orders")
        .select("subtotal_usd")
        .eq("user_id", user.id)
        .in("status", ["paid", "processing", "completed"]),
    ]);

  const recentOrders = (orders as Order[]) ?? [];
  const totalSpentUsd = (paidOrders ?? []).reduce(
    (s, o) => s + Number(o.subtotal_usd),
    0
  );

  return (
    <RevealGroup className="grid gap-5 lg:grid-cols-3" stagger={0.07}>
      <RevealItem className="lg:col-span-2" y={18}>
        <Card className="h-full">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 rounded-2xl border border-edge object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-2xl font-bold text-primary-light">
                {(profile.username ?? profile.email ?? "U")[0]?.toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-white">
                {profile.username ?? "Unnamed"}
              </p>
              <p className="truncate text-sm text-zinc-500">{profile.email}</p>
              <p className="mt-1 text-xs text-zinc-500">
                Member since {formatDate(profile.created_at)}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.role !== "customer" && (
              <Badge variant="gold">{profile.role.replace("_", " ")}</Badge>
            )}
            <Badge variant={user.email_confirmed_at ? "success" : "warning"}>
              {user.email_confirmed_at ? "✓ Email verified" : "Email unverified"}
            </Badge>
            {profile.discord_id && <Badge variant="info">Discord linked</Badge>}
          </div>
        </Card>
      </RevealItem>

      <RevealItem y={18}>
        <Card className="flex h-full flex-col justify-center gap-1 p-4">
          {quickLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium text-zinc-300 transition hover:bg-raised hover:text-white"
            >
              <l.icon className="h-4 w-4 shrink-0 text-primary-light" />
              <span className="flex-1">{l.label}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" />
            </Link>
          ))}
        </Card>
      </RevealItem>

      <RevealItem className="lg:col-span-3" y={18}>
        <div className="grid grid-cols-2 gap-5">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-zinc-500">
              <Wallet className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wider">
                Lifetime spent
              </p>
            </div>
            <p className="text-gradient mt-2 text-2xl font-extrabold sm:text-3xl">
              {formatMoney(totalSpentUsd, "USD")}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Across all completed orders
            </p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-zinc-500">
              <Package className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wider">
                Orders placed
              </p>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
              {orderCount ?? recentOrders.length}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              <Link
                href="/account/orders"
                className="text-primary-light hover:underline"
              >
                View order history
              </Link>
            </p>
          </Card>
        </div>
      </RevealItem>

      <RevealItem className="lg:col-span-3" y={18}>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-white">Recent orders</h2>
            <Link
              href="/account/orders"
              className="text-sm text-primary-light hover:underline"
            >
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              No orders yet —{" "}
              <Link href="/games" className="text-primary-light underline">
                browse the store
              </Link>
              .
            </p>
          ) : (
            <div className="divide-y divide-edge">
              {recentOrders.map((o) => (
                <Link
                  key={o.id}
                  href={`/account/orders/${o.id}`}
                  className="group flex min-h-[56px] items-center justify-between gap-4 py-3 transition hover:bg-raised/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {o.reference ?? `#${o.order_number}`}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(o.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                    <span className="font-semibold text-white">
                      {formatMoney(Number(o.total), o.currency)}
                    </span>
                    <Badge variant={statusBadgeVariant(o.status)}>
                      {o.status}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-zinc-600 transition group-hover:text-primary-light" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </RevealItem>
    </RevealGroup>
  );
}
