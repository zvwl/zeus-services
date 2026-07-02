"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, ExternalLink } from "lucide-react";
import { savePage } from "@/app/admin/actions";
import { Button, Card } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import type { SitePage } from "@/lib/types";

function PageEditor({ page }: { page: SitePage }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const [content, setContent] = useState(page.content);

  return (
    <Card>
      <form
        action={(formData) => {
          formData.set("slug", page.slug);
          formData.set("content", content);
          startTransition(async () => {
            const res = await savePage(formData);
            setMsg(res.ok ? null : res.message);
            setSaved(res.ok);
            router.refresh();
          });
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            name="title"
            defaultValue={page.title}
            className="input max-w-xs font-semibold"
            required
          />
          <div className="flex items-center gap-2">
            <a
              href={`/${page.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View live
            </a>
            <button
              type="button"
              onClick={() => setPreview((p) => !p)}
              className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              {preview ? (
                <>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" /> Preview
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4">
          {preview ? (
            <div className="max-h-[32rem] overflow-y-auto rounded-xl border border-edge bg-raised/40 p-5">
              <Markdown>{content}</Markdown>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input min-h-[32rem] w-full font-mono text-xs leading-relaxed"
              spellCheck={false}
              required
            />
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save page"}
          </Button>
          {msg && <p className="text-xs text-red-400">{msg}</p>}
          {saved && !msg && !pending && (
            <p className="text-xs text-emerald-400">Saved — live now.</p>
          )}
        </div>
      </form>
    </Card>
  );
}

export function PagesManager({ pages }: { pages: SitePage[] }) {
  const [active, setActive] = useState(pages[0]?.slug ?? "");
  const current = pages.find((p) => p.slug === active) ?? pages[0];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {pages.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => setActive(p.slug)}
            className={
              p.slug === current?.slug
                ? "rounded-full border border-primary/50 bg-primary/15 px-4 py-1.5 text-sm font-medium text-primary-light"
                : "rounded-full border border-edge bg-raised/50 px-4 py-1.5 text-sm font-medium text-zinc-400 hover:text-white"
            }
          >
            {p.title}
          </button>
        ))}
      </div>
      {current && <PageEditor key={current.slug} page={current} />}
    </div>
  );
}
