"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertGame } from "@/app/admin/actions";
import { ImageUpload } from "@/components/ImageUpload";
import { Button, Card } from "@/components/ui";
import { slugify } from "@/lib/utils";
import type { Game } from "@/lib/types";

export function GameForm({ game }: { game: Game | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(game?.image_url ?? null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(game?.banner_url ?? null);
  const [name, setName] = useState(game?.name ?? "");

  return (
    <form
      action={(formData) => {
        if (game) formData.set("id", game.id);
        formData.set("image_url", imageUrl ?? "");
        formData.set("banner_url", bannerUrl ?? "");
        startTransition(async () => {
          const res = await upsertGame(formData);
          setMsg({ ok: res.ok, text: res.message });
          if (res.ok && !game) router.push(`/admin/games/${res.id}`);
          else router.refresh();
        });
      }}
    >
      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Name *</label>
            <input
              name="name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fortnite"
              required
            />
          </div>
          <div>
            <label className="label">Slug</label>
            <input
              name="slug"
              className="input"
              defaultValue={game?.slug ?? ""}
              placeholder={slugify(name) || "auto-generated"}
            />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            name="description"
            className="input min-h-[90px]"
            defaultValue={game?.description ?? ""}
            placeholder="Short blurb shown on the game page banner."
          />
        </div>
        <div>
          <label className="label">Intro (SEO body — markdown)</label>
          <textarea
            name="intro"
            className="input min-h-[140px] font-mono text-xs"
            defaultValue={game?.intro ?? ""}
            placeholder="Longer, keyword-rich intro shown under the banner on the game page. Supports ## headings, **bold**, [links](/support). Leave blank to hide."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Meta title (SERP override)</label>
            <input
              name="meta_title"
              className="input"
              defaultValue={game?.meta_title ?? ""}
              maxLength={70}
              placeholder="e.g. GTA 5 Modded Accounts, Money & Boosting — leave blank for default"
            />
          </div>
          <div>
            <label className="label">Meta description (SERP override)</label>
            <textarea
              name="meta_description"
              className="input min-h-[60px]"
              defaultValue={game?.meta_description ?? ""}
              maxLength={170}
              placeholder="~150 characters shown under the title in Google. Leave blank for default."
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUpload
            folder="games"
            value={imageUrl}
            onChange={setImageUrl}
            label="Cover image (cards)"
          />
          <ImageUpload
            folder="games"
            value={bannerUrl}
            onChange={setBannerUrl}
            label="Banner image (game page)"
          />
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={game?.is_active ?? true}
              className="h-4 w-4 accent-violet-500"
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              name="is_featured"
              defaultChecked={game?.is_featured ?? false}
              className="h-4 w-4 accent-violet-500"
            />
            Featured
          </label>
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-400">Sort order</label>
            <input
              type="number"
              name="sort_order"
              defaultValue={game?.sort_order ?? 0}
              className="input w-20 py-1.5"
            />
          </div>
        </div>
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
          {pending ? "Saving…" : game ? "Save changes" : "Create game"}
        </Button>
      </Card>
    </form>
  );
}
