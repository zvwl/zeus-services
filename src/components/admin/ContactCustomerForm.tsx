"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Send } from "lucide-react";
import { contactCustomerAboutOrder } from "@/app/admin/actions";
import { Button, Card } from "@/components/ui";

export function ContactCustomerForm({
  orderId,
  orderRef,
  /** True when the order was placed by a guest (orders.user_id is null). */
  isGuest,
  customerEmail,
}: {
  orderId: string;
  orderRef: string;
  isGuest: boolean;
  customerEmail: string | null;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState(`About your order ${orderRef}`);
  const [priority, setPriority] = useState("normal");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  // A guest order has no account to hang a thread on, and an order with no
  // address on file has no route to the customer at all — say so up front
  // rather than letting them write a message that can't be delivered.
  const unreachable = isGuest && !customerEmail;

  return (
    <Card>
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary-light" />
        <h2 className="font-bold text-white">Contact customer</h2>
      </div>

      {unreachable ? (
        <p className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-200">
          This guest order has no email address on file, so there&apos;s no way
          to reach the customer from here.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-zinc-500">
            {isGuest ? (
              <>
                {customerEmail} checked out as a guest, so there&apos;s no
                account to open a ticket on. This sends a plain email and their
                reply goes to the support inbox.
              </>
            ) : (
              <>
                Opens a support ticket with the customer and emails them a link
                to it. Their reply lands in the same thread.
              </>
            )}
          </p>

          <form
            className="mt-4 space-y-3"
            action={() =>
              startTransition(async () => {
                const formData = new FormData();
                formData.set("order_id", orderId);
                formData.set("subject", subject);
                formData.set("priority", priority);
                formData.set("message", message);
                const res = await contactCustomerAboutOrder(formData);
                setResult(res);
                if (res.ok) {
                  setMessage("");
                  router.refresh();
                }
              })
            }
          >
            <div className="flex flex-wrap gap-3">
              <div className="min-w-[220px] flex-1">
                <label className="label">Subject</label>
                <input
                  className="input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={150}
                />
              </div>
              {!isGuest && (
                <div>
                  <label className="label">Priority</label>
                  <select
                    className="input w-auto"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="label">Message</label>
              <textarea
                className="input min-h-[110px]"
                placeholder="What do you need to tell them about this order?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={4000}
              />
            </div>

            {result && (
              <p
                className={`rounded-xl border px-3 py-2 text-sm ${
                  result.ok
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-red-500/30 bg-red-500/10 text-red-300"
                }`}
              >
                {result.message}
              </p>
            )}

            <Button disabled={pending || message.trim().length < 10}>
              <Send className="h-4 w-4" />
              {pending
                ? "Sending…"
                : isGuest
                  ? "Send email"
                  : "Open ticket & notify"}
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}
