"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { deleteCategory, upsertCategory } from "@/app/admin/actions";
import { Button, Card } from "@/components/ui";
import type { Category } from "@/lib/types";

function CategoryRow({ category }: { category: Category | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <form
      className="flex flex-wrap items-center gap-2 rounded-xl border border-edge bg-raised/40 p-3"
      action={(formData) => {
        if (category) formData.set("id", category.id);
        startTransition(async () => {
          const res = await upsertCategory(formData);
          setMsg(res.ok ? null : res.message);
          router.refresh();
        });
      }}
    >
      <input
        name="name"
        defaultValue={category?.name ?? ""}
        placeholder="Category name"
        className="input min-w-[140px] flex-1"
        required
      />
      <input
        name="description"
        defaultValue={category?.description ?? ""}
        placeholder="Short description (card subtitle)"
        className="input min-w-[180px] flex-[2]"
      />
      <input
        type="number"
        name="sort_order"
        defaultValue={category?.sort_order ?? 0}
        className="input w-20"
        title="Sort order"
      />
      <textarea
        name="intro"
        defaultValue={category?.intro ?? ""}
        placeholder="Intro (SEO body — markdown, shown under the category heading). Supports ## headings, **bold**, [links](/support). Leave blank to hide."
        className="input min-h-[110px] w-full font-mono text-xs"
      />
      <label className="flex items-center gap-1.5 text-xs text-zinc-400">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={category?.is_active ?? true}
          className="h-3.5 w-3.5 accent-violet-500"
        />
        Active
      </label>
      <Button size="sm" disabled={pending}>
        {pending ? "…" : category ? "Save" : <><Plus className="h-4 w-4" /> Add</>}
      </Button>
      {category && (
        <button
          type="button"
          className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
          aria-label="Delete category"
          onClick={() => {
            if (!window.confirm(`Delete "${category.name}"?`)) return;
            const formData = new FormData();
            formData.set("id", category.id);
            startTransition(async () => {
              const res = await deleteCategory(formData);
              if (!res.ok) setMsg(res.message);
              router.refresh();
            });
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      {msg && <p className="w-full text-xs text-red-400">{msg}</p>}
    </form>
  );
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  return (
    <div className="space-y-3">
      {categories.map((c) => (
        <CategoryRow key={c.id} category={c} />
      ))}
      <Card className="border-dashed">
        <p className="mb-3 text-sm font-semibold text-zinc-400">Add new category</p>
        <CategoryRow category={null} />
      </Card>
    </div>
  );
}
