import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { Badge, statusBadgeVariant } from "@/components/ui";
import { ActionSelect } from "@/components/admin/ActionControls";
import { TicketThread } from "@/components/TicketThread";
import { updateTicketMeta } from "@/app/admin/actions";
import type { Profile, SupportTicket, TicketMessage } from "@/lib/types";

export const revalidate = 0;

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_tickets")
    .select("*, messages:ticket_messages(*), profile:profiles(username, email)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const ticket = data as SupportTicket & {
    messages: TicketMessage[];
    profile: Profile | null;
  };

  const messages = [...(ticket.messages ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/support"
        className="text-sm text-zinc-500 hover:text-primary-light"
      >
        ← All tickets
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            #{ticket.ticket_number} — {ticket.subject}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {ticket.profile?.username ?? "Unknown"} ({ticket.profile?.email}) ·{" "}
            {ticket.category}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusBadgeVariant(ticket.status)}>{ticket.status}</Badge>
          <ActionSelect
            action={updateTicketMeta}
            fields={{ id: ticket.id }}
            name="priority"
            value={ticket.priority}
            options={[
              { value: "low", label: "Priority: low" },
              { value: "normal", label: "Priority: normal" },
              { value: "high", label: "Priority: high" },
            ]}
          />
          <ActionSelect
            action={updateTicketMeta}
            fields={{ id: ticket.id }}
            name="status"
            value={ticket.status}
            options={[
              { value: "open", label: "Status: open" },
              { value: "answered", label: "Status: answered" },
              { value: "closed", label: "Status: closed" },
            ]}
          />
        </div>
      </div>

      <div className="mt-8">
        <TicketThread
          ticketId={ticket.id}
          status={ticket.status}
          messages={messages.map((m) => ({
            id: m.id,
            isStaff: m.is_staff,
            message: m.message,
            createdAt: m.created_at,
            mine: m.sender_id === profile?.id,
          }))}
        />
      </div>
    </div>
  );
}
