"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { deleteFaq, upsertFaq } from "@/app/admin/actions";
import { Button, Card } from "@/components/ui";
import type { Faq } from "@/lib/types";

function FaqRow({ faq }: { faq: Faq | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <form
      className="space-y-2 rounded-xl border border-edge bg-raised/40 p-4"
      action={(formData) => {
        if (faq) formData.set("id", faq.id);
        startTransition(async () => {
          const res = await upsertFaq(formData);
          setMsg(res.ok ? null : res.message);
          router.refresh();
        });
      }}
    >
      <div className="flex flex-wrap gap-2">
        <input
          name="question"
          defaultValue={faq?.question ?? ""}
          placeholder="Question"
          className="input min-w-[200px] flex-[2]"
          required
        />
        <input
          name="category"
          defaultValue={faq?.category ?? "General"}
          placeholder="Category"
          className="input w-36"
        />
        <input
          type="number"
          name="sort_order"
          defaultValue={faq?.sort_order ?? 0}
          className="input w-20"
          title="Sort order"
        />
      </div>
      <textarea
        name="answer"
        defaultValue={faq?.answer ?? ""}
        placeholder="Answer"
        className="input min-h-[70px]"
        required
      />
      <div className="flex items-center gap-3">
        <Button size="sm" disabled={pending}>
          {pending ? "…" : faq ? "Save" : <><Plus className="h-4 w-4" /> Add FAQ</>}
        </Button>
        {faq && (
          <button
            type="button"
            className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
            aria-label="Delete FAQ"
            onClick={() => {
              if (!window.confirm("Delete this FAQ?")) return;
              const formData = new FormData();
              formData.set("id", faq.id);
              startTransition(async () => {
                await deleteFaq(formData);
                router.refresh();
              });
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        {msg && <p className="text-xs text-red-400">{msg}</p>}
      </div>
    </form>
  );
}

export function FaqManager({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="space-y-3">
      {faqs.map((f) => (
        <FaqRow key={f.id} faq={f} />
      ))}
      <Card className="border-dashed">
        <p className="mb-3 text-sm font-semibold text-zinc-400">Add new FAQ</p>
        <FaqRow faq={null} />
      </Card>
    </div>
  );
}
