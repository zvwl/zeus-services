"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { closeTicket, replyToTicket, type ActionResult } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { cn, formatDateTime } from "@/lib/utils";

interface ThreadMessage {
  id: string;
  isStaff: boolean;
  message: string;
  createdAt: string;
  mine: boolean;
}

/** Shape of the zeus.ticket_messages row Realtime hands back on INSERT. */
interface TicketMessageRow {
  id: string;
  sender_id: string | null;
  is_staff: boolean;
  message: string;
  created_at: string;
}

export function TicketThread({
  ticketId,
  status,
  messages,
  currentUserId,
}: {
  ticketId: string;
  status: string;
  messages: ThreadMessage[];
  /** Used to decide which side of the thread a live message renders on. */
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [live, setLive] = useState<ThreadMessage[]>([]);

  // Messages that arrived over the socket since this page was rendered. Both
  // sides of the thread subscribe, so a reply shows up without a reload.
  //
  // Postgres Changes rather than Broadcast: `realtime.messages` has no
  // partition covering the current date on either project, and realtime.send()
  // swallows the resulting failure, so a broadcast trigger silently delivers
  // nothing. See supabase/migrations/0024_ticket_realtime.sql.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const channel = supabase.channel(`ticket-messages-${ticketId}`).on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "zeus",
        table: "ticket_messages",
        filter: `ticket_id=eq.${ticketId}`,
      },
      (payload) => {
        if (cancelled) return;
        const row = payload.new as TicketMessageRow;
        setLive((prev) =>
          prev.some((m) => m.id === row.id)
            ? prev
            : [
                ...prev,
                {
                  id: row.id,
                  isStaff: row.is_staff,
                  message: row.message,
                  createdAt: row.created_at,
                  mine:
                    currentUserId !== null && row.sender_id === currentUserId,
                },
              ]
        );
      }
    );

    // Realtime evaluates this table's RLS per subscriber, so the socket has to
    // carry the session token — without setAuth the channel connects happily
    // and then receives nothing at all.
    void supabase.realtime.setAuth().then(() => {
      if (!cancelled) channel.subscribe();
    });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [ticketId, currentUserId]);

  // Server-rendered history wins on id collisions -- after router.refresh() the
  // same message arrives both ways. Re-sorted by time so a live message can't
  // jump ahead of one that was already on the page.
  const allMessages = useMemo(() => {
    const seen = new Set(messages.map((m) => m.id));
    return [...messages, ...live.filter((m) => !seen.has(m.id))].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages, live]);

  return (
    <div>
      <div className="space-y-4">
        {allMessages.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.mine ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3",
                m.isStaff
                  ? "rounded-bl-md border border-primary/30 bg-primary/10"
                  : m.mine
                    ? "rounded-br-md border border-edge bg-raised"
                    : "rounded-bl-md border border-edge bg-raised"
              )}
            >
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
                {m.isStaff ? (
                  <>
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/25">
                      <Zap
                        className="h-2.5 w-2.5 text-primary-light"
                        fill="currentColor"
                      />
                    </span>
                    <span className="text-primary-light">Zeuservices Support</span>
                  </>
                ) : (
                  <span className="text-zinc-400">{m.mine ? "You" : "Customer"}</span>
                )}
              </p>
              <p className="whitespace-pre-wrap text-sm text-zinc-200">{m.message}</p>
              <p className="mt-1.5 text-right text-[10px] text-zinc-600">
                {formatDateTime(m.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {status === "closed" ? (
        <p className="mt-8 rounded-xl border border-edge bg-raised p-4 text-center text-sm text-zinc-500">
          This ticket is closed. Open a new one if you still need help.
        </p>
      ) : (
        <form
          className="mt-8 space-y-3"
          action={() =>
            startTransition(async () => {
              const formData = new FormData();
              formData.set("ticket_id", ticketId);
              formData.set("message", text);
              const res = await replyToTicket(formData);
              setResult(res);
              if (res.ok) {
                setText("");
                router.refresh();
              }
            })
          }
        >
          <textarea
            className="input min-h-[100px]"
            placeholder="Write a reply…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={4000}
          />
          {result && !result.ok && (
            <p className="text-sm text-red-400">{result.message}</p>
          )}
          <div className="flex items-center justify-between">
            <Button disabled={pending || text.trim().length === 0}>
              {pending ? "Sending…" : "Send reply"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const formData = new FormData();
                  formData.set("ticket_id", ticketId);
                  await closeTicket(formData);
                  router.refresh();
                })
              }
            >
              Close ticket
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
