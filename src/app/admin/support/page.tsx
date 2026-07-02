import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, statusBadgeVariant } from "@/components/ui";
import { cn, formatDateTime } from "@/lib/utils";
import type { SupportTicket } from "@/lib/types";

export const revalidate = 0;

const FILTERS = ["all", "open", "answered", "closed"];

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = FILTERS.includes(status ?? "") ? status! : "all";

  const supabase = await createClient();
  let query = supabase
    .from("support_tickets")
    .select("*, profile:profiles(username, email)")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (filter !== "all") query = query.eq("status", filter);
  const { data } = await query;
  const tickets = (data as SupportTicket[]) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white">Support tickets</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/support" : `/admin/support?status=${f}`}
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
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {tickets.map((t) => (
              <tr key={t.id} className="transition hover:bg-raised/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/support/${t.id}`}
                    className="font-medium text-primary-light hover:underline"
                  >
                    #{t.ticket_number} — {t.subject}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {t.profile?.username ?? t.profile?.email ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-400">{t.category}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      t.priority === "high"
                        ? "danger"
                        : t.priority === "low"
                          ? "default"
                          : "info"
                    }
                  >
                    {t.priority}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadgeVariant(t.status)}>{t.status}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {formatDateTime(t.updated_at)}
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  No tickets here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
