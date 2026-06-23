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

type FieldType = "text" | "url" | "number" | "textarea";

interface SectionField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
}

interface SectionDef {
  label: string;
  description: string;
  /** Help text for the Title field, or undefined if this kind has no title. */
  title?: string;
  /** Help text for the Subtitle field, or undefined if no subtitle. */
  subtitle?: string;
  fields: SectionField[];
}

// One friendly form per section kind. Order here = order in the "Add" dropdown.
const SECTIONS: Record<string, SectionDef> = {
  hero: {
    label: "Hero banner",
    description: "Big headline, call-to-action buttons and trust pills at the top.",
    title: "First part of the headline, before the highlighted words. Default: “Level up for less with”.",
    subtitle: "Supporting line under the headline.",
    fields: [
      { key: "highlight", label: "Highlighted words", type: "text", placeholder: "Zeuservices", help: "Shown in the gradient colour at the end of the headline." },
      { key: "badge", label: "Top badge text", type: "text", placeholder: "Trusted by thousands of gamers worldwide" },
      { key: "cta_text", label: "Primary button label", type: "text", placeholder: "Browse games" },
      { key: "cta_href", label: "Primary button link", type: "url", placeholder: "/games" },
      { key: "cta2_text", label: "Secondary button label", type: "text", placeholder: "Cheap top-ups" },
      { key: "cta2_href", label: "Secondary button link", type: "url", placeholder: "/category/topups" },
      { key: "pill1", label: "Trust pill 1", type: "text", placeholder: "Instant delivery" },
      { key: "pill2", label: "Trust pill 2", type: "text", placeholder: "Secure Stripe checkout" },
      { key: "pill3", label: "Trust pill 3", type: "text", placeholder: "24/7 live support" },
    ],
  },
  categories: {
    label: "Category cards",
    description: "A card for each active category (managed under Categories).",
    title: "Section heading. Default: “Shop by category”.",
    subtitle: "Optional line under the heading.",
    fields: [],
  },
  featured_products: {
    label: "Featured products",
    description: "Grid of products you've marked as Featured.",
    title: "Default: “Featured offers”.",
    subtitle: "Optional.",
    fields: [{ key: "limit", label: "Max products", type: "number", placeholder: "8" }],
  },
  games: {
    label: "Games grid",
    description: "Grid of your active games.",
    title: "Default: “Popular games”.",
    subtitle: "Optional.",
    fields: [{ key: "limit", label: "Max games", type: "number", placeholder: "12" }],
  },
  steps: {
    label: "How it works",
    description: "Three numbered steps explaining your process.",
    title: "Default: “How it works”.",
    subtitle: "Optional.",
    fields: [
      { key: "step1_title", label: "Step 1 title", type: "text", placeholder: "Choose your item" },
      { key: "step1_text", label: "Step 1 text", type: "textarea", placeholder: "Pick a top-up, boost or account." },
      { key: "step2_title", label: "Step 2 title", type: "text", placeholder: "Pay securely" },
      { key: "step2_text", label: "Step 2 text", type: "textarea", placeholder: "Check out with Stripe in your currency." },
      { key: "step3_title", label: "Step 3 title", type: "text", placeholder: "Instant delivery" },
      { key: "step3_text", label: "Step 3 text", type: "textarea", placeholder: "Instant items arrive right away." },
    ],
  },
  reviews: {
    label: "Reviews",
    description: "Approved customer reviews with the average rating.",
    title: "Default: “What gamers say about us”.",
    fields: [{ key: "limit", label: "Max reviews", type: "number", placeholder: "6" }],
  },
  stats: {
    label: "Stats bar",
    description: "Live order / customer / rating counters. The numbers below are only a fallback shown if live counts can't be loaded.",
    fields: [
      { key: "orders", label: "Fallback orders", type: "number", placeholder: "1200" },
      { key: "customers", label: "Fallback customers", type: "number", placeholder: "800" },
    ],
  },
  faq: {
    label: "FAQ accordion",
    description: "Expandable FAQ entries (managed under FAQs).",
    title: "Default: “Frequently asked questions”.",
    subtitle: "Optional.",
    fields: [{ key: "limit", label: "Max questions", type: "number", placeholder: "6" }],
  },
  cta_banner: {
    label: "Call-to-action banner",
    description: "A bold banner with a heading, text and a button.",
    title: "Heading shown in the banner. Default: “Ready to level up?”.",
    subtitle: "Text under the heading.",
    fields: [
      { key: "button_text", label: "Button label", type: "text", placeholder: "Get started" },
      { key: "button_href", label: "Button link", type: "url", placeholder: "/games" },
    ],
  },
  discord: {
    label: "Discord CTA",
    description: "Invite banner using your Discord link from Settings.",
    title: "Default: “Join our Discord community”.",
    subtitle: "Optional.",
    fields: [],
  },
  giveaway: {
    label: "Giveaway banner",
    description: "Automatically shows the next active giveaway with a countdown — no setup needed.",
    fields: [],
  },
  rich_text: {
    label: "Rich text",
    description: "A free-form Markdown block.",
    title: "Optional heading.",
    subtitle: "Optional.",
    fields: [
      { key: "body", label: "Body (Markdown)", type: "textarea", placeholder: "## Welcome\nWrite anything in **Markdown**." },
    ],
  },
};

function defFor(kind: string): SectionDef {
  return SECTIONS[kind] ?? { label: kind, description: "", fields: [] };
}

function Field({
  field,
  defaultValue,
}: {
  field: SectionField;
  defaultValue: unknown;
}) {
  const dv =
    defaultValue === undefined || defaultValue === null ? "" : String(defaultValue);
  return (
    <div>
      <label className="label">{field.label}</label>
      {field.type === "textarea" ? (
        <textarea
          name={`content_${field.key}`}
          className="input min-h-[70px]"
          defaultValue={dv}
          placeholder={field.placeholder}
        />
      ) : (
        <input
          name={`content_${field.key}`}
          type={field.type === "number" ? "number" : "text"}
          className="input"
          defaultValue={dv}
          placeholder={field.placeholder}
        />
      )}
      {field.help && <p className="mt-1 text-xs text-zinc-600">{field.help}</p>}
    </div>
  );
}

function SectionRow({ section }: { section: SiteSection }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const def = defFor(section.kind);
  const content = section.content ?? {};

  function run(
    action: (fd: FormData) => Promise<{ ok: boolean; message: string }>,
    fields: Record<string, string>
  ) {
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
            <Badge variant="primary">{def.label}</Badge>
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
            // Collect the friendly fields into the JSON content blob.
            const obj: Record<string, unknown> = {};
            for (const f of def.fields) {
              const raw = String(formData.get(`content_${f.key}`) ?? "").trim();
              formData.delete(`content_${f.key}`);
              if (raw === "") continue;
              obj[f.key] = f.type === "number" ? Number(raw) : raw;
            }
            formData.set("content", JSON.stringify(obj));
            startTransition(async () => {
              const res = await upsertSection(formData);
              setMsg(res.ok ? null : res.message);
              if (res.ok) setEditing(false);
              router.refresh();
            });
          }}
        >
          <p className="text-xs text-zinc-500">{def.description}</p>
          {(def.title !== undefined || def.subtitle !== undefined) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {def.title !== undefined && (
                <div>
                  <label className="label">Title</label>
                  <input name="title" className="input" defaultValue={section.title ?? ""} />
                  <p className="mt-1 text-xs text-zinc-600">{def.title}</p>
                </div>
              )}
              {def.subtitle !== undefined && (
                <div>
                  <label className="label">Subtitle</label>
                  <input
                    name="subtitle"
                    className="input"
                    defaultValue={section.subtitle ?? ""}
                  />
                  <p className="mt-1 text-xs text-zinc-600">{def.subtitle}</p>
                </div>
              )}
            </div>
          )}
          {def.fields.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {def.fields.map((f) => (
                <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                  <Field field={f} defaultValue={content[f.key]} />
                </div>
              ))}
            </div>
          )}
          {def.fields.length === 0 &&
            def.title === undefined &&
            def.subtitle === undefined && (
              <p className="text-sm text-zinc-500">
                This section has nothing to configure — it updates automatically.
              </p>
            )}
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
  const [kind, setKind] = useState("hero");

  return (
    <div className="space-y-3">
      {sections.map((s) => (
        <SectionRow key={s.id} section={s} />
      ))}

      <Card className="border-dashed">
        <p className="mb-3 text-sm font-semibold text-zinc-400">Add a section</p>
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
          <div className="min-w-[200px]">
            <label className="label">Type</label>
            <select
              name="kind"
              className="input"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {Object.entries(SECTIONS).map(([k, def]) => (
                <option key={k} value={k}>
                  {def.label}
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
        </form>
        <p className="mt-2 text-xs text-zinc-600">{defFor(kind).description}</p>
        {msg && <p className="mt-2 text-xs text-red-400">{msg}</p>}
      </Card>
    </div>
  );
}
