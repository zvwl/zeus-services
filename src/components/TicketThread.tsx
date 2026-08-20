"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
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
  amStaff,
}: {
  ticketId: string;
  status: string;
  messages: ThreadMessage[];
  /** Used to decide which side of the thread a live message renders on. */
  currentUserId: string | null;
  /** Whether the viewer is acting as support here — same rule as replyToTicket:
   *  staff capability AND not the ticket's owner. Labels our typing events. */
  amStaff: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [live, setLive] = useState<ThreadMessage[]>([]);
  const [peerTyping, setPeerTyping] = useState<{ isStaff: boolean } | null>(null);
  const typingChannel = useRef<RealtimeChannel | null>(null);
  const lastAnnounced = useRef(0);
  const peerClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Typing indicators ride a SEPARATE private channel, `ticket:<uuid>`, matching
  // the policies in 0025. Client broadcast is ephemeral — Realtime authorizes by
  // querying realtime.messages and rolling back, never inserting — so this works
  // despite the dead partitions that killed broadcast-from-database.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const channel = supabase.channel(`ticket:${ticketId}`, {
      // self:false so our own keystrokes don't echo back as "they're typing".
      config: { private: true, broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "typing" }, ({ payload }) => {
      if (cancelled) return;
      setPeerTyping({
        isStaff: Boolean((payload as { isStaff?: boolean })?.isStaff),
      });
      if (peerClearTimer.current) clearTimeout(peerClearTimer.current);
      // Self-clearing. A "stopped" event can be lost to a closed tab or a
      // dropped connection, so the indicator must never depend on receiving one.
      peerClearTimer.current = setTimeout(() => setPeerTyping(null), 4000);
    });

    channel.on("broadcast", { event: "stopped" }, () => {
      if (cancelled) return;
      if (peerClearTimer.current) clearTimeout(peerClearTimer.current);
      setPeerTyping(null);
    });

    void supabase.realtime.setAuth().then(() => {
      if (!cancelled) channel.subscribe();
    });
    typingChannel.current = channel;

    return () => {
      cancelled = true;
      if (peerClearTimer.current) clearTimeout(peerClearTimer.current);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      typingChannel.current = null;
      void supabase.removeChannel(channel);
    };
  }, [ticketId]);

  function announceStopped() {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    lastAnnounced.current = 0;
    void typingChannel.current?.send({
      type: "broadcast",
      event: "stopped",
      payload: {},
    });
  }

  function handleTyping(value: string) {
    setText(value);
    const channel = typingChannel.current;
    if (!channel) return;

    if (value.length === 0) {
      announceStopped();
      return;
    }

    // One event per 1.5s keeps the peer's 4s indicator alive without
    // broadcasting on every keystroke.
    const now = Date.now();
    if (now - lastAnnounced.current > 1500) {
      lastAnnounced.current = now;
      void channel.send({
        type: "broadcast",
        event: "typing",
        payload: { isStaff: amStaff },
      });
    }

    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(announceStopped, 2500);
  }

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

      {peerTyping && (
        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" />
          </span>
          {peerTyping.isStaff
            ? "Zeuservices Support is typing…"
            : "Customer is typing…"}
        </div>
      )}

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
                announceStopped();
                router.refresh();
              }
            })
          }
        >
          <textarea
            className="input min-h-[100px]"
            placeholder="Write a reply…"
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            onBlur={announceStopped}
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
