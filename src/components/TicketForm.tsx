"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTicket, type ActionResult } from "@/app/actions";
import { Button } from "@/components/ui";

const CATEGORIES = [
  "Order issue",
  "Delivery question",
  "Refund request",
  "Account & login",
  "Payment problem",
  "Other",
];

export function TicketForm() {
  const router = useRouter();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="glass space-y-4 p-6"
      action={(formData) =>
        startTransition(async () => {
          const res = await createTicket(formData);
          setResult(res);
          if (res.ok) router.refresh();
        })
      }
    >
      <div>
        <label className="label">Subject</label>
        <input
          name="subject"
          className="input"
          placeholder="e.g. Order #1042 not delivered"
          required
          maxLength={150}
        />
      </div>
      <div>
        <label className="label">Category</label>
        <select name="category" className="input">
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Message</label>
        <textarea
          name="message"
          className="input min-h-[130px]"
          placeholder="Describe your issue — include your order number if relevant."
          required
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
      <Button size="lg" className="w-full" disabled={pending}>
        {pending ? "Opening…" : "Open ticket"}
      </Button>
    </form>
  );
}
