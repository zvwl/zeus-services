import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { can, getProfile } from "@/lib/auth";
import { Badge } from "@/components/ui";
import { ActionButton } from "@/components/admin/ActionControls";
import { AdminTable } from "@/components/admin/AdminTable";
import { toggleBan } from "@/app/admin/actions";
import { formatMoney } from "@/lib/currency";
import { cn, formatDate, sanitizeSearchTerm } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export const revalidate = 0;

const CUSTOMER_FILTERS = ["all", "customers", "staff", "banned"];

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q, filter: filterRaw } = await searchParams;
  const query = (q ?? "").trim();
  const filter = CUSTOMER_FILTERS.includes(filterRaw ?? "") ? filterRaw! : "all";
  const supabase = await createClient();
  const me = await getProfile();

  let profileQuery = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter === "customers") profileQuery = profileQuery.eq("role", "customer");
  else if (filter === "staff")
    profileQuery = profileQuery.in("role", ["support", "admin", "super_admin"]);
  else if (filter === "banned")
    profileQuery = profileQuery.eq("is_banned", true);
  const safe = sanitizeSearchTerm(query);
  if (safe) {
    profileQuery = profileQuery.or(
      `email.ilike.%${safe}%,username.ilike.%${safe}%`
    );
  }
  const [{ data: profiles }, { data: orders }] = await Promise.all([
    profileQuery,
    supabase
      .from("orders")
      .select("user_id, subtotal_usd, status")
      .in("status", ["paid", "processing", "completed"]),
  ]);

  const spendByUser = new Map<string, { count: number; total: number }>();
  for (const o of orders ?? []) {
    if (!o.user_id) continue;
    const entry = spendByUser.get(o.user_id) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += Number(o.subtotal_usd);
    spendByUser.set(o.user_id, entry);
  }

  const customers = (profiles as Profile[]) ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Customers</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Every registered account — open one for order history and details.
          </p>
        </div>
        <form action="/admin/customers" className="w-full sm:w-72">
          {filter !== "all" && (
            <input type="hidden" name="filter" value={filter} />
          )}
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search email or username…"
            className="input"
          />
        </form>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {CUSTOMER_FILTERS.map((f) => {
          const params = new URLSearchParams();
          if (f !== "all") params.set("filter", f);
          if (query) params.set("q", query);
          const qs = params.toString();
          return (
            <Link
              key={f}
              href={qs ? `/admin/customers?${qs}` : "/admin/customers"}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition",
                filter === f
                  ? "border-primary/50 bg-primary/15 text-primary-light"
                  : "border-edge bg-raised/50 text-zinc-400 hover:text-white"
              )}
            >
              {f}
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        <AdminTable
          minWidth={760}
          empty={
            query || filter !== "all"
              ? "No users match this filter or search."
              : "No users yet."
          }
          columns={[
            { header: "User" },
            { header: "Role" },
            { header: "Orders" },
            { header: "Spent (USD)" },
            { header: "Joined" },
            { header: "Status" },
            { header: "" },
          ]}
          rows={customers.map((p) => {
            const spend = spendByUser.get(p.id);
            return {
              key: p.id,
              cells: [
                <Link key="user" href={`/admin/customers/${p.id}`} className="group block">
                  <span className="block font-medium text-white group-hover:text-primary-light">
                    {p.username ?? "—"}
                  </span>
                  <span className="block break-all text-xs text-zinc-500">{p.email}</span>
                </Link>,
                <Badge key="role" variant={p.role === "customer" ? "default" : "gold"}>
                  {p.role.replace("_", " ")}
                </Badge>,
                <span key="orders" className="text-zinc-300">
                  {spend?.count ?? 0}
                </span>,
                <span key="spent" className="font-semibold text-white">
                  {formatMoney(spend?.total ?? 0, "USD")}
                </span>,
                <span key="joined" className="text-xs text-zinc-500">
                  {formatDate(p.created_at)}
                </span>,
                p.is_banned ? (
                  <Badge key="status" variant="danger">
                    banned
                  </Badge>
                ) : (
                  <Badge key="status" variant="success">
                    active
                  </Badge>
                ),
                can(me, "manage_customers") && p.id !== me?.id ? (
                  <ActionButton
                    key="ban"
                    action={toggleBan}
                    fields={{ user_id: p.id }}
                    variant={p.is_banned ? "success" : "danger"}
                    confirmText={
                      p.is_banned
                        ? `Unban ${p.username ?? p.email}?`
                        : `Ban ${p.username ?? p.email}? They won't be able to purchase.`
                    }
                  >
                    {p.is_banned ? "Unban" : "Ban"}
                  </ActionButton>
                ) : null,
              ],
            };
          })}
        />
      </div>
    </div>
  );
}
