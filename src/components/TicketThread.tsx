"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { closeTicket, replyToTicket, type ActionResult } from "@/app/actions";
import { Button } from "@/components/ui";
import { cn, formatDateTime } from "@/lib/utils";

interface ThreadMessage {
  id: string;
  isStaff: boolean;
  message: string;
  createdAt: string;
  mine: boolean;
}

export function TicketThread({
  ticketId,
  status,
  messages,
}: {
  ticketId: string;
  status: string;
  messages: ThreadMessage[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <div className="space-y-4">
        {messages.map((m) => (
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
