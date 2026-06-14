import { createClient } from "@/lib/supabase/server";
import { SectionManager } from "@/components/admin/SectionManager";
import type { SiteSection } from "@/lib/types";

export const revalidate = 0;

export default async function AdminSectionsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_sections")
    .select("*")
    .order("sort_order");

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-white">Homepage layout</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Build the homepage from blocks: reorder, toggle, retitle, or add new
        sections. Changes go live instantly.
      </p>
      <div className="mt-6">
        <SectionManager sections={(data as SiteSection[]) ?? []} />
      </div>
    </div>
  );
}
