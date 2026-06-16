import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getProfile, getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, statusBadgeVariant } from "@/components/ui";
import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const revalidate = 0;

export default async function AccountPage() {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  if (!user || !profile) redirect("/login?next=/account");

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentOrders = (orders as Order[]) ?? [];
  const totalSpentUsd = recentOrders
    .filter((o) => ["paid", "processing", "completed"].includes(o.status))
    .reduce((s, o) => s + Number(o.subtotal_usd), 0);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 rounded-2xl object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-xl font-bold text-primary-light">
              {(profile.username ?? profile.email ?? "U")[0]?.toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-bold text-white">
              {profile.username ?? "Unnamed"}
            </p>
            <p className="truncate text-sm text-zinc-500">{profile.email}</p>
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
        <p className="mt-4 text-xs text-zinc-600">
          Member since {formatDate(profile.created_at)}
        </p>
      </Card>

      <Card className="flex flex-col justify-center">
        <p className="text-sm text-zinc-500">Lifetime spent</p>
        <p className="mt-1 text-3xl font-extrabold text-gradient">
          {formatMoney(totalSpentUsd, "USD")}
        </p>
        <p className="mt-2 text-xs text-zinc-600">
          Across {recentOrders.length}+ recent orders
        </p>
      </Card>

      <Card className="flex flex-col justify-center gap-3">
        <Link
          href="/account/security"
          className="text-sm text-primary-light hover:underline"
        >
          → Secure your account with 2FA
        </Link>
        <Link href="/support" className="text-sm text-primary-light hover:underline">
          → Open a support ticket
        </Link>
        <Link href="/giveaways" className="text-sm text-primary-light hover:underline">
          → Enter live giveaways
        </Link>
      </Card>

      <Card className="lg:col-span-3">
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
          <p className="py-6 text-center text-sm text-zinc-500">
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
                className="flex items-center justify-between gap-4 py-3 transition hover:bg-raised/40"
              >
                <div>
                  <p className="font-medium text-white">
                    {o.reference ?? `#${o.order_number}`}
                  </p>
                  <p className="text-xs text-zinc-500">{formatDate(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-white">
                    {formatMoney(Number(o.total), o.currency)}
                  </span>
                  <Badge variant={statusBadgeVariant(o.status)}>{o.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
