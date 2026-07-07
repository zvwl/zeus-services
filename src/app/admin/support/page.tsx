import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, statusBadgeVariant } from "@/components/ui";
import { AdminTable } from "@/components/admin/AdminTable";
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
    </div>
  );
}
