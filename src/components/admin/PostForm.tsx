"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertPost } from "@/app/admin/actions";
import { ImageUpload } from "@/components/ImageUpload";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { Button, Card } from "@/components/ui";
import type { BlogPost } from "@/lib/types";

export function PostForm({ post }: { post: BlogPost | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(post?.image_url ?? null);

  return (
    <form
      action={(formData) => {
        if (post) formData.set("id", post.id);
        formData.set("image_url", imageUrl ?? "");
        startTransition(async () => {
          const res = await upsertPost(formData);
          setMsg({ ok: res.ok, text: res.message });
          if (res.ok && !post) router.push(`/admin/blog/${res.id}`);
          else router.refresh();
        });
      }}
    >
      <Card className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input
            name="title"
            className="input"
            defaultValue={post?.title ?? ""}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Slug</label>
            <input
              name="slug"
              className="input"
              defaultValue={post?.slug ?? ""}
              placeholder="auto-generated"
            />
          </div>
          <div>
            <label className="label">Tags (comma separated)</label>
            <input
              name="tags"
              className="input"
              defaultValue={post?.tags?.join(", ") ?? ""}
              placeholder="news, fortnite, guide"
            />
          </div>
        </div>
        <div>
          <label className="label">Excerpt</label>
          <input
            name="excerpt"
            className="input"
            defaultValue={post?.excerpt ?? ""}
            placeholder="One-line summary shown on the blog page"
          />
        </div>
        <div>
          <label className="label">Content *</label>
          <MarkdownEditor
            name="content"
            defaultValue={post?.content ?? ""}
            required
            folder="blog"
          />
          <p className="mt-1 text-xs text-zinc-600">
            Use the toolbar to format text and insert images — no Markdown
            knowledge needed. The preview shows exactly how the post will look.
          </p>
        </div>
        <ImageUpload
          folder="blog"
          value={imageUrl}
          onChange={setImageUrl}
          label="Cover image"
        />
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={post?.is_published ?? false}
            className="h-4 w-4 accent-violet-500"
          />
          Published
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
          {pending ? "Saving…" : post ? "Save changes" : "Create post"}
        </Button>
      </Card>
    </form>
  );
}
