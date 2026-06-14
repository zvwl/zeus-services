"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  deleteSection,
  moveSection,
  toggleSection,
  upsertSection,
} from "@/app/admin/actions";
import { Badge, Button, Card } from "@/components/ui";
import type { SiteSection } from "@/lib/types";

const KIND_INFO: Record<string, { label: string; hint: string }> = {
  hero: {
    label: "Hero banner",
    hint: 'Content keys: "highlight", "badge", "cta_text", "cta_href", "cta2_text", "cta2_href", "pill1-3"',
  },
  categories: { label: "Category cards", hint: "Shows all active categories." },
  featured_products: {
    label: "Featured products",
    hint: 'Shows products marked featured. Content: {"limit": 8}',
  },
  games: { label: "Games grid", hint: 'Content: {"limit": 12}' },
  stats: {
    label: "Stats bar",
    hint: "Live order/customer/rating counters.",
  },
  reviews: { label: "Reviews", hint: 'Approved reviews. Content: {"limit": 6}' },
  faq: { label: "FAQ accordion", hint: 'Content: {"limit": 6}' },
  discord: { label: "Discord CTA", hint: "Uses the invite link from Settings." },
  giveaway: { label: "Giveaway banner", hint: "Shows the next active giveaway." },
  rich_text: {
    label: "Rich text",
    hint: 'Custom Markdown block. Content: {"body": "## Your markdown"}',
  },
};

function SectionRow({ section }: { section: SiteSection }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const info = KIND_INFO[section.kind] ?? { label: section.kind, hint: "" };

  function run(action: (fd: FormData) => Promise<{ ok: boolean; message: string }>, fields: Record<string, string>) {
    const formData = new FormData();
    for (const [k, v] of Object.entries(fields)) formData.set(k, v);
    startTransition(async () => {
      const res = await action(formData);
      if (!res.ok) window.alert(res.message);
      router.refresh();
    });
  }

  return (
    <div className="glass p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1">
          <button
            className="rounded p-1 text-zinc-500 hover:bg-raised hover:text-white disabled:opacity-30"
            disabled={pending}
            onClick={() => run(moveSection, { id: section.id, dir: "up" })}
            aria-label="Move up"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1 text-zinc-500 hover:bg-raised hover:text-white disabled:opacity-30"
            disabled={pending}
            onClick={() => run(moveSection, { id: section.id, dir: "down" })}
            aria-label="Move down"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">{info.label}</Badge>
            {!section.is_active && <Badge variant="danger">hidden</Badge>}
          </div>
          <p className="mt-1 truncate text-sm font-medium text-white">
            {section.title || <span className="text-zinc-600">(default title)</span>}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="rounded-lg p-2 text-zinc-400 hover:bg-raised hover:text-white"
            disabled={pending}
            onClick={() => run(toggleSection, { id: section.id })}
            aria-label="Toggle visibility"
            title={section.is_active ? "Hide" : "Show"}
          >
            {section.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button
            className="rounded-lg p-2 text-zinc-400 hover:bg-raised hover:text-white"
            onClick={() => setEditing((v) => !v)}
            aria-label="Edit section"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
            disabled={pending}
            onClick={() => {
              if (window.confirm("Delete this section?")) {
                run(deleteSection, { id: section.id });
              }
            }}
            aria-label="Delete section"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {editing && (
        <form
          className="mt-4 space-y-3 border-t border-edge pt-4"
          action={(formData) => {
            formData.set("id", section.id);
            formData.set("kind", section.kind);
            startTransition(async () => {
              const res = await upsertSection(formData);
              setMsg(res.ok ? null : res.message);
              if (res.ok) setEditing(false);
              router.refresh();
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Title</label>
              <input name="title" className="input" defaultValue={section.title ?? ""} />
            </div>
            <div>
              <label className="label">Subtitle</label>
              <input
                name="subtitle"
                className="input"
                defaultValue={section.subtitle ?? ""}
              />
            </div>
          </div>
          <div>
            <label className="label">Content (JSON)</label>
            <textarea
              name="content"
              className="input min-h-[90px] font-mono text-xs"
              defaultValue={JSON.stringify(section.content ?? {}, null, 2)}
            />
            <p className="mt-1 text-xs text-zinc-600">{info.hint}</p>
          </div>
          {msg && <p className="text-xs text-red-400">{msg}</p>}
          <Button size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save section"}
          </Button>
        </form>
      )}
    </div>
  );
}

export function SectionManager({ sections }: { sections: SiteSection[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {sections.map((s) => (
        <SectionRow key={s.id} section={s} />
      ))}

      <Card className="border-dashed">
        <p className="mb-3 text-sm font-semibold text-zinc-400">Add section</p>
        <form
          className="flex flex-wrap items-end gap-3"
          action={(formData) =>
            startTransition(async () => {
              const res = await upsertSection(formData);
              setMsg(res.ok ? null : res.message);
              router.refresh();
            })
          }
        >
          <div className="min-w-[180px]">
            <label className="label">Type</label>
            <select name="kind" className="input">
              {Object.entries(KIND_INFO).map(([kind, info]) => (
                <option key={kind} value={kind}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="label">Title (optional)</label>
            <input name="title" className="input" placeholder="Uses a sensible default" />
          </div>
          <Button disabled={pending}>
            <Plus className="h-4 w-4" /> {pending ? "Adding…" : "Add"}
          </Button>
          {msg && <p className="w-full text-xs text-red-400">{msg}</p>}
        </form>
      </Card>
    </div>
  );
}
