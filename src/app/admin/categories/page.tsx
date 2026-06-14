import { createClient } from "@/lib/supabase/server";
import { CategoryManager } from "@/components/admin/CategoryManager";
import type { Category } from "@/lib/types";

export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-white">Categories</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Categories group products across all games (Top-Ups, Boosting,
        Accounts…). Add as many as you need — they appear in the navbar
        automatically.
      </p>
      <div className="mt-6">
        <CategoryManager categories={(data as Category[]) ?? []} />
      </div>
    </div>
  );
}
