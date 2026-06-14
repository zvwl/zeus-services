"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertGiveaway } from "@/app/admin/actions";
import { ImageUpload } from "@/components/ImageUpload";
import { Button, Card } from "@/components/ui";
import type { Giveaway } from "@/lib/types";

function toLocalInputValue(iso: string | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function GiveawayForm({ giveaway }: { giveaway: Giveaway | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(giveaway?.image_url ?? null);

  return (
    <form
      action={(formData) => {
        if (giveaway) formData.set("id", giveaway.id);
        formData.set("image_url", imageUrl ?? "");
        startTransition(async () => {
          const res = await upsertGiveaway(formData);
          setMsg({ ok: res.ok, text: res.message });
          if (res.ok && !giveaway) router.push(`/admin/giveaways/${res.id}`);
          else router.refresh();
        });
      }}
    >
      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Title *</label>
            <input
              name="title"
              className="input"
              defaultValue={giveaway?.title ?? ""}
              placeholder="10,000 V-Bucks Giveaway"
              required
            />
          </div>
          <div>
            <label className="label">Prize *</label>
            <input
              name="prize"
              className="input"
              defaultValue={giveaway?.prize ?? ""}
              placeholder="10,000 V-Bucks"
              required
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Ends at *</label>
            <input
              type="datetime-local"
              name="ends_at"
              className="input"
              defaultValue={toLocalInputValue(giveaway?.ends_at)}
              required
            />
          </div>
          <div>
            <label className="label">Slug</label>
            <input
              name="slug"
              className="input"
              defaultValue={giveaway?.slug ?? ""}
              placeholder="auto-generated"
            />
          </div>
        </div>
        <div>
          <label className="label">Description (Markdown)</label>
          <textarea
            name="description"
            className="input min-h-[120px]"
            defaultValue={giveaway?.description ?? ""}
            placeholder="Rules, what's included, how winners are contacted…"
          />
        </div>
        <div>
          <label className="label">Extra entry requirement (optional)</label>
          <input
            name="requirement_text"
            className="input"
            defaultValue={giveaway?.requirement_text ?? ""}
            placeholder="e.g. Join our Discord server"
          />
        </div>
        <ImageUpload
          folder="giveaways"
          value={imageUrl}
          onChange={setImageUrl}
          label="Banner image"
        />
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={giveaway?.is_active ?? true}
            className="h-4 w-4 accent-violet-500"
          />
          Active (open for entries)
        </label>
        {msg && (
          <p
            className={`rounded-xl border px-3 py-2 text-sm ${
              msg.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {msg.text}
          </p>
        )}
        <Button disabled={pending}>
          {pending ? "Saving…" : giveaway ? "Save changes" : "Create giveaway"}
        </Button>
      </Card>
    </form>
  );
}
