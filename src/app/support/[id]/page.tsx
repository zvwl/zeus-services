import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { isStaff } from "@/lib/auth";
import { Badge, statusBadgeVariant } from "@/components/ui";
import { TicketThread } from "@/components/TicketThread";
import type { SupportTicket, TicketMessage } from "@/lib/types";

export const revalidate = 0;

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) redirect(`/login?next=/support/${id}`);

  const supabase = await createClient();
  const { data } = await supabase
    .from("support_tickets")
    .select("*, messages:ticket_messages(*)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const ticket = data as SupportTicket & { messages: TicketMessage[] };
  if (ticket.user_id !== profile.id && !isStaff(profile)) notFound();

  const messages = [...(ticket.messages ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link href="/support" className="text-sm text-zinc-500 hover:text-primary-light">
        ← Back to support
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            #{ticket.ticket_number} — {ticket.subject}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{ticket.category}</p>
        </div>
        <Badge variant={statusBadgeVariant(ticket.status)}>{ticket.status}</Badge>
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
            mine: m.sender_id === profile.id,
          }))}
        />
      </div>
    </div>
  );
}
