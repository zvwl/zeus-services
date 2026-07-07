"use client";

import { useMemo, useRef, useState } from "react";
import {
  Bold,
  Code,
  Eye,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  PenLine,
  TextQuote,
} from "lucide-react";
import { Markdown } from "@/components/Markdown";
import { Spinner } from "@/components/ui";
import { cn, readingTime } from "@/lib/utils";

/**
 * Notion-lite markdown editor for admin forms.
 *
 * - Formatting toolbar that wraps / prefixes the current selection.
 * - Insert-image via the existing /api/upload endpoint.
 * - Live preview (side-by-side on desktop, Write/Preview tabs on mobile).
 * - Content stays plain markdown: renders a real <textarea name={name}> so the
 *   surrounding form submits it exactly like the old raw textarea did.
 *
 * Edits go through document.execCommand("insertText") where supported so
 * Ctrl+Z / Cmd+Z undo keeps working; falls back to setRangeText.
 */
export function MarkdownEditor({
  name,
  defaultValue = "",
  required,
  folder = "blog",
  placeholder = "Write your post in Markdown — or just start typing and use the toolbar.",
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  /** Storage folder for uploaded images (matches ImageUpload). */
  folder?: string;
  placeholder?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const words = useMemo(
    () => (value.trim() ? value.trim().split(/\s+/).length : 0),
    [value]
  );
  // Shared helper so the estimate here matches the public blog post page.
  const readingMins = readingTime(value);

  /** Replace [start, end) with text, keeping native undo history when possible. */
  function replaceRange(
    start: number,
    end: number,
    text: string,
    selectStart?: number,
    selectEnd?: number
  ) {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(start, end);
    let inserted = false;
    try {
      // Deprecated but still the only undo-friendly way to edit a textarea.
      inserted = document.execCommand("insertText", false, text);
    } catch {
      inserted = false;
    }
    if (!inserted || el.value.slice(start, start + text.length) !== text) {
      el.setRangeText(text, start, end, "end");
    }
    const selFrom = selectStart ?? start + text.length;
    el.setSelectionRange(selFrom, selectEnd ?? selFrom);
    setValue(el.value);
  }

  /** Wrap the selection with before/after (e.g. **bold**). */
  function wrapSelection(before: string, after: string, sample: string) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = el.value.slice(start, end) || sample;
    replaceRange(
      start,
      end,
      `${before}${selected}${after}`,
      start + before.length,
      start + before.length + selected.length
    );
  }

  /** Prefix every line in the selection (headings, lists, quotes). */
  function prefixLines(prefix: string | ((lineIndex: number) => string)) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd } = el;
    // Expand to whole lines.
    const start = el.value.lastIndexOf("\n", selectionStart - 1) + 1;
    const endIdx = el.value.indexOf("\n", selectionEnd);
    const end = endIdx === -1 ? el.value.length : endIdx;
    const block = el.value.slice(start, end);
    const next = block
      .split("\n")
      .map((line, i) => {
        const p = typeof prefix === "function" ? prefix(i) : prefix;
        // Don't stack the same prefix twice.
        return line.startsWith(p) ? line : `${p}${line}`;
      })
      .join("\n");
    replaceRange(start, end, next, start, start + next.length);
  }

  function insertLink() {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = el.value.slice(start, end);
    const label = selected || "link text";
    const text = `[${label}](https://)`;
    // Leave the URL selected so the author can type over it right away.
    const urlStart = start + label.length + 3;
    replaceRange(start, end, text, urlStart, urlStart + "https://".length);
  }

  async function handleImage(file: File) {
    setUploadError(null);
    if (file.size > 4 * 1024 * 1024) {
      setUploadError("Max image size is 4 MB.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "zeus-assets");
      fd.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Upload failed");
      const el = textareaRef.current;
      const alt = file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
      const current = el ? el.value : value;
      const pos = el ? el.selectionStart : current.length;
      const needsNewline = pos > 0 && current[pos - 1] !== "\n";
      replaceRange(pos, el?.selectionEnd ?? pos, `${needsNewline ? "\n" : ""}![${alt}](${json.url})\n`);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const tools: {
    icon: typeof Bold;
    label: string;
    run: () => void;
  }[] = [
    { icon: Bold, label: "Bold", run: () => wrapSelection("**", "**", "bold text") },
    { icon: Italic, label: "Italic", run: () => wrapSelection("*", "*", "italic text") },
    { icon: Heading2, label: "Heading", run: () => prefixLines("## ") },
    { icon: Heading3, label: "Subheading", run: () => prefixLines("### ") },
    { icon: List, label: "Bulleted list", run: () => prefixLines("- ") },
    { icon: ListOrdered, label: "Numbered list", run: () => prefixLines((i) => `${i + 1}. `) },
    { icon: TextQuote, label: "Quote", run: () => prefixLines("> ") },
    { icon: Link2, label: "Link", run: insertLink },
    { icon: Code, label: "Inline code", run: () => wrapSelection("`", "`", "code") },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-raised/30">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-edge bg-raised/60 px-2 py-1.5">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={t.run}
            title={t.label}
            aria-label={t.label}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-surface hover:text-white"
          >
            <t.icon className="h-4 w-4" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title="Insert image"
          aria-label="Insert image"
          className="rounded-lg p-2 text-zinc-400 transition hover:bg-surface hover:text-white disabled:opacity-50"
        >
          {uploading ? <Spinner className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImage(f);
            e.target.value = "";
          }}
        />

        {/* Mobile write/preview toggle */}
        <div className="ml-auto flex gap-0.5 lg:hidden">
          {(
            [
              { key: "write", label: "Write", icon: PenLine },
              { key: "preview", label: "Preview", icon: Eye },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                tab === t.key
                  ? "bg-primary/15 text-primary-light"
                  : "text-zinc-500 hover:text-white"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
        <span className="ml-auto hidden text-[11px] text-zinc-600 lg:block">
          Markdown · live preview
        </span>
      </div>

      {/* Editor + preview */}
      <div className="relative grid lg:grid-cols-2">
        {/* On the mobile Preview tab the (possibly required) textarea must stay
            rendered and focusable — display:none/visibility:hidden would make
            the browser silently block submit ("not focusable" control) with no
            visible feedback. Collapse it visually instead; onInvalid below
            still flips back to Write so the user sees what to fill in. */}
        <div
          className={cn(
            tab === "write"
              ? "block"
              : "pointer-events-none absolute h-px w-px overflow-hidden opacity-0",
            "lg:pointer-events-auto lg:static lg:block lg:h-auto lg:w-auto lg:overflow-visible lg:opacity-100"
          )}
        >
          <textarea
            ref={textareaRef}
            name={name}
            required={required}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            // If the browser blocks submit because this is empty while the
            // mobile Preview tab hides it, jump back to Write so the user
            // sees what needs filling in.
            onInvalid={() => setTab("write")}
            placeholder={placeholder}
            spellCheck
            className="block min-h-[400px] w-full resize-y border-0 bg-transparent px-4 py-3 text-sm leading-relaxed text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-0"
          />
        </div>
        <div
          className={cn(
            tab === "preview" ? "block" : "hidden",
            "max-h-[600px] min-h-[400px] overflow-y-auto border-edge px-4 py-3 lg:block lg:border-l"
          )}
        >
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-sm text-zinc-600">
              Nothing to preview yet — start writing on the left.
            </p>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-edge bg-raised/60 px-4 py-2 text-[11px] text-zinc-500">
        <span>
          {words.toLocaleString()} {words === 1 ? "word" : "words"}
        </span>
        {words > 0 && <span>≈ {readingMins} min read</span>}
        {uploadError && <span className="text-red-400">{uploadError}</span>}
      </div>
    </div>
  );
}
