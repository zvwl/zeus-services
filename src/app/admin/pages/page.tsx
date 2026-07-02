import { createClient } from "@/lib/supabase/server";
import { PagesManager } from "@/components/admin/PagesManager";
import type { SitePage } from "@/lib/types";

export const revalidate = 0;

export default async function AdminPagesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("pages").select("*").order("slug");
  const pages = (data as SitePage[]) ?? [];

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-extrabold text-white">Site pages</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Edit the Terms, Privacy and Refund policy pages. Content is markdown —
        headings with ##, **bold**, [links](/support), tables and lists all
        work. Changes go live immediately.
      </p>
      <div className="mt-6">
        {pages.length === 0 ? (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            No editable pages found in this database yet — run migration
            0013_editable_pages.sql in the Supabase SQL editor first.
          </p>
        ) : (
          <PagesManager pages={pages} />
        )}
      </div>
    </div>
  );
}
