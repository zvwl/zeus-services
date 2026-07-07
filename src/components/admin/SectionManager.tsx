"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Eye,
  EyeOff,
  FileText,
  FolderTree,
  Gamepad2,
  Gift,
  GripVertical,
  HelpCircle,
  ListOrdered,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Trash2,
  type LucideIcon,
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
  icon: LucideIcon;
  description: string;
  /** Help text for the Title field, or undefined if this kind has no title. */
  title?: string;
  /** Help text for the Subtitle field, or undefined if no subtitle. */
  subtitle?: string;
  fields: SectionField[];
}

// One friendly form per section kind. Order here = order in the "Add" dropdown.
// Placeholders/help mirror the REAL defaults in SectionRenderer — keep in sync.
const SECTIONS: Record<string, SectionDef> = {
  hero: {
    label: "Hero banner",
    icon: Sparkles,
    description:
      "The big opening banner: headline, two buttons and trust pills. A looping background video plays behind it — the built-in Zeus lightning loop by default, or your own file via the video fields below. Leave any field empty to use the default shown in grey.",
    title: "First line of the headline. Default: “Level up.”",
    subtitle:
      "Supporting sentence under the headline. Default: “Premium game top-ups, rank boosting and accounts — delivered in seconds, paid securely through Stripe, trusted by thousands of gamers.”",
    fields: [
      { key: "highlight", label: "Highlighted words", type: "text", placeholder: "Instantly.", help: "Second line of the headline, shown in the violet gradient." },
      { key: "badge", label: "Top badge text", type: "text", placeholder: "Instant delivery on top-ups", help: "Small pill shown above the headline." },
      { key: "cta_text", label: "Primary button label", type: "text", placeholder: "Browse the shop" },
      { key: "cta_href", label: "Primary button link", type: "url", placeholder: "/games" },
      { key: "cta2_text", label: "Secondary button label", type: "text", placeholder: "View giveaways" },
      { key: "cta2_href", label: "Secondary button link", type: "url", placeholder: "/giveaways" },
      { key: "pill1", label: "Trust pill 1", type: "text", placeholder: "Stripe-secured" },
      { key: "pill2", label: "Trust pill 2", type: "text", placeholder: "Instant delivery" },
      { key: "pill3", label: "Trust pill 3", type: "text", placeholder: "24/7 support" },
      { key: "video_src", label: "Background video", type: "url", placeholder: "/media/hero-loop.mp4", help: "Background video file (MP4, seamless loop). Leave blank for the built-in Zeus lightning loop." },
      { key: "video_poster", label: "Video poster image", type: "url", placeholder: "/media/hero-poster.webp", help: "Poster image shown before the video loads and for reduced-motion visitors." },
    ],
  },
  categories: {
    label: "Category cards",
    icon: FolderTree,
    description:
      "One card for each active category (managed under Categories). Cards, icons and artwork are automatic.",
    title:
      "Heading above the cards, e.g. “Shop by category”. Leave empty to show the cards with no heading.",
    subtitle: "Optional line under the heading.",
    fields: [],
  },
  featured_products: {
    label: "Featured products",
    icon: Star,
    description:
      "Grid of products you've ticked as “Featured on homepage” in the product editor.",
    title: "Default: “Popular right now”.",
    subtitle:
      "Default: “Hand-picked offers with the fastest delivery and best value.”",
    fields: [
      { key: "limit", label: "Max products shown", type: "number", placeholder: "8" },
    ],
  },
  games: {
    label: "Games grid",
    icon: Gamepad2,
    description: "Grid of your active games with their cover art.",
    title: "Default: “Popular games”.",
    subtitle: "Optional.",
    fields: [
      { key: "limit", label: "Max games shown", type: "number", placeholder: "12" },
    ],
  },
  steps: {
    label: "How it works",
    icon: ListOrdered,
    description: "Three numbered steps explaining how buying works.",
    title: "Default: “How it works”.",
    subtitle: "Optional.",
    fields: [
      { key: "step1_title", label: "Step 1 title", type: "text", placeholder: "Choose your item" },
      { key: "step1_text", label: "Step 1 text", type: "textarea", placeholder: "Pick a top-up, boost or account for your game." },
      { key: "step2_title", label: "Step 2 title", type: "text", placeholder: "Pay securely" },
      { key: "step2_text", label: "Step 2 text", type: "textarea", placeholder: "Check out with Stripe in your own currency — cards, Apple Pay & Google Pay." },
      { key: "step3_title", label: "Step 3 title", type: "text", placeholder: "Fast delivery" },
      { key: "step3_text", label: "Step 3 text", type: "textarea", placeholder: "Our team handles your order and delivers to your account, typically within 10 minutes to 2 hours." },
    ],
  },
  reviews: {
    label: "Reviews",
    icon: MessagesSquare,
    description:
      "Approved customer reviews in a grid, with a link to the full reviews page.",
    title: "Default: “Loved by the community”.",
    subtitle: "Default: “Every review is from a verified buyer.”",
    fields: [
      { key: "limit", label: "Max reviews shown", type: "number", placeholder: "6" },
    ],
  },
  stats: {
    label: "Stats bar",
    icon: BarChart3,
    description:
      "A glass bar with four big figures. The reviews figure updates itself from real approved reviews — the fields below only override the text shown.",
    fields: [
      { key: "stat1", label: "Gamers served", type: "text", placeholder: "Thousands" },
      { key: "stat2", label: "Trading since", type: "text", placeholder: "1+ year" },
      { key: "stat3", label: "Reviews fallback", type: "text", placeholder: "Growing", help: "Only shown until you have approved reviews — then the live average rating and count take over." },
      { key: "stat4", label: "Typical delivery", type: "text", placeholder: "10 min–2 hrs" },
    ],
  },
  faq: {
    label: "FAQ accordion",
    icon: HelpCircle,
    description: "Expandable questions and answers (managed under FAQs).",
    title: "Default: “Frequently asked questions”.",
    subtitle: "Optional.",
    fields: [
      { key: "limit", label: "Max questions shown", type: "number", placeholder: "6" },
    ],
  },
  cta_banner: {
    label: "Call-to-action banner",
    icon: Megaphone,
    description: "A bold glowing banner with a heading, a line of text and one button.",
    title: "Heading shown in the banner. Default: “Ready to level up?”.",
    subtitle: "Text under the heading (empty = hidden).",
    fields: [
      { key: "button_text", label: "Button label", type: "text", placeholder: "Get started" },
      { key: "button_href", label: "Button link", type: "url", placeholder: "/games" },
    ],
  },
  discord: {
    label: "Discord CTA",
    icon: MessageCircle,
    description:
      "Invite banner using the Discord link from Settings. Hidden automatically if no Discord invite is set.",
    title: "Default: “Join our Discord community”.",
    subtitle: "Default: “Deals, drops and support — all in one place.”",
    fields: [],
  },
  giveaway: {
    label: "Giveaway banner",
    icon: Gift,
    description:
      "Automatically shows the next live giveaway with a countdown and entry button — no setup needed. Hidden when there's no live giveaway.",
    fields: [],
  },
  rich_text: {
    label: "Rich text",
    icon: FileText,
    description: "A free-form block of your own text — supports Markdown formatting.",
    title: "Optional heading.",
    subtitle: "Optional.",
    fields: [
      { key: "body", label: "Body (Markdown)", type: "textarea", placeholder: "## Welcome\nWrite anything in **Markdown**." },
    ],
  },
};

function defFor(kind: string): SectionDef {
  return (
    SECTIONS[kind] ?? {
      label: kind,
      icon: FileText,
      description: "",
      fields: [],
    }
  );
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

function SectionRow({
  section,
  index,
  count,
}: {
  section: SiteSection;
  index: number;
  count: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const def = defFor(section.kind);
  const content = section.content ?? {};
  const Icon = def.icon;

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
    <div
      className={`glass p-4 transition hover:border-primary/40 ${
        section.is_active ? "" : "opacity-70"
      }`}
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Reorder controls with a grip for drag-feel */}
        <div className="flex items-center gap-1">
          <GripVertical className="h-4 w-4 cursor-grab text-zinc-700" aria-hidden />
          <div className="flex flex-col">
            <button
              className="rounded p-1 text-zinc-500 hover:bg-raised hover:text-white disabled:opacity-30"
              disabled={pending || index === 0}
              onClick={() => run(moveSection, { id: section.id, dir: "up" })}
              aria-label="Move up"
              title="Move up"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              className="rounded p-1 text-zinc-500 hover:bg-raised hover:text-white disabled:opacity-30"
              disabled={pending || index === count - 1}
              onClick={() => run(moveSection, { id: section.id, dir: "down" })}
              aria-label="Move down"
              title="Move down"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-light">
          <Icon className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold tabular-nums text-zinc-600">
              {index + 1}.
            </span>
            <Badge variant="primary">{def.label}</Badge>
            {section.is_active ? (
              <Badge variant="success">live</Badge>
            ) : (
              <Badge variant="default">
                <EyeOff className="h-3 w-3" /> hidden
              </Badge>
            )}
          </div>
          <p className="mt-1 truncate text-sm font-medium text-white">
            {section.title || (
              <span className="text-zinc-600">(uses the default title)</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            className="rounded-lg p-2 text-zinc-400 hover:bg-raised hover:text-white"
            disabled={pending}
            onClick={() => run(toggleSection, { id: section.id })}
            aria-label={section.is_active ? "Hide section" : "Show section"}
            title={section.is_active ? "Hide from the homepage" : "Show on the homepage"}
          >
            {section.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button
            className={`rounded-lg p-2 hover:bg-raised hover:text-white ${
              editing ? "bg-raised text-white" : "text-zinc-400"
            }`}
            onClick={() => setEditing((v) => !v)}
            aria-label="Edit section"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
            disabled={pending}
            onClick={() => {
              if (window.confirm("Delete this section from the homepage?")) {
                run(deleteSection, { id: section.id });
              }
            }}
            aria-label="Delete section"
            title="Delete"
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
          <p className="text-xs leading-relaxed text-zinc-500">{def.description}</p>
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
          <div className="flex items-center gap-3">
            <Button size="sm" disabled={pending}>
              {pending ? "Saving…" : "Save section"}
            </Button>
            <span className="text-xs text-zinc-600">
              Empty fields fall back to the defaults shown in grey.
            </span>
          </div>
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
      {sections.map((s, i) => (
        <SectionRow key={s.id} section={s} index={i} count={sections.length} />
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
            <label className="label">Section type</label>
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
            <Plus className="h-4 w-4" /> {pending ? "Adding…" : "Add section"}
          </Button>
        </form>
        <p className="mt-2 text-xs leading-relaxed text-zinc-600">
          {defFor(kind).description} New sections are added to the bottom — use
          the arrows to move them.
        </p>
        {msg && <p className="mt-2 text-xs text-red-400">{msg}</p>}
      </Card>
    </div>
  );
}
