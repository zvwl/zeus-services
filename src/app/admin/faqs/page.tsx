import { createClient } from "@/lib/supabase/server";
import { FaqManager } from "@/components/admin/FaqManager";
import type { Faq } from "@/lib/types";

export const revalidate = 0;

export default async function AdminFaqsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("faqs").select("*").order("sort_order");

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-white">FAQs</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Shown on the FAQ page and (optionally) the homepage FAQ section.
      </p>
      <div className="mt-6">
        <FaqManager faqs={(data as Faq[]) ?? []} />
      </div>
    </div>
  );
}
