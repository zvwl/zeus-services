import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, statusBadgeVariant } from "@/components/ui";
import { AdminTable } from "@/components/admin/AdminTable";
import { cn, formatDateTime } from "@/lib/utils";
import type { SupportTicket } from "@/lib/types";

export const revalidate = 0;

// "active" (needs attention: open + answered) is the default work queue view.
const FILTERS = ["active", "open", "answered", "closed", "all"];
const PAGE_SIZE = 50;

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page: pageParam } = await searchParams;
  const filter = FILTERS.includes(status ?? "") ? status! : "active";
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("support_tickets")
    .select("*, profile:profiles(username, email)", { count: "exact" });
  if (filter === "active") {
    // status desc = open before answered (the only two values here), so
    // tickets awaiting a first staff reply always lead the queue.
    query = query
      .neq("status", "closed")
      .order("status", { ascending: false })
      .order("updated_at", { ascending: false });
  } else {
    if (filter !== "all") query = query.eq("status", filter);
    query = query.order("updated_at", { ascending: false });
  }
  const { data, count } = await query.range(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE - 1
  );
  let tickets = (data as SupportTicket[]) ?? [];
  // High priority floats to the top within each status group of the page.
  const prioRank = { high: 0, normal: 1, low: 2 } as const;
  if (filter === "active") {
    tickets = [...tickets].sort(
      (a, b) =>
        (a.status === b.status
          ? (prioRank[a.priority as keyof typeof prioRank] ?? 3) -
            (prioRank[b.priority as keyof typeof prioRank] ?? 3)
          : 0) || 0
    );
  }
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-white">Support tickets</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Open a ticket to reply and set its status or priority.
      </p>
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

      <div className="mt-6">
        <AdminTable
          minWidth={680}
          empty={
            filter !== "all"
              ? `No ${filter} tickets right now.`
              : "No tickets yet — customer questions will land here."
          }
          columns={[
            { header: "Ticket" },
            { header: "Customer" },
            { header: "Category" },
            { header: "Priority" },
            { header: "Status" },
            { header: "Updated" },
          ]}
          rows={tickets.map((t) => ({
            key: t.id,
            cells: [
              <Link
                key="subject"
                href={`/admin/support/${t.id}`}
                className="font-medium text-primary-light hover:underline"
              >
                #{t.ticket_number} — {t.subject}
              </Link>,
              <span key="customer" className="break-all text-zinc-400">
                {t.profile?.username ?? t.profile?.email ?? "—"}
              </span>,
              <span key="category" className="text-zinc-400">
                {t.category}
              </span>,
              <Badge
                key="priority"
                variant={
                  t.priority === "high"
                    ? "danger"
                    : t.priority === "low"
                      ? "default"
                      : "info"
                }
              >
                {t.priority}
              </Badge>,
              <Badge key="status" variant={statusBadgeVariant(t.status)}>
                {t.status}
              </Badge>,
              <span key="updated" className="text-xs text-zinc-500">
                {formatDateTime(t.updated_at)}
              </span>,
            ],
          }))}
        />
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-zinc-400">
          <span>
            Page {page} of {totalPages} · {count ?? 0} tickets
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/support?status=${filter}&page=${page - 1}`}
                className="rounded-lg border border-edge px-3 py-1.5 transition hover:text-white"
              >
                ← Newer
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/support?status=${filter}&page=${page + 1}`}
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
