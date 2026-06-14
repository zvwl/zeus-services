import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GiveawayForm } from "@/components/admin/GiveawayForm";
import type { Giveaway } from "@/lib/types";

export const revalidate = 0;

export default async function AdminGiveawayEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let giveaway: Giveaway | null = null;
  if (id !== "new") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("giveaways")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!data) notFound();
    giveaway = data as Giveaway;
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/giveaways"
        className="text-sm text-zinc-500 hover:text-primary-light"
      >
        ← All giveaways
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold text-white">
        {giveaway ? `Edit: ${giveaway.title}` : "New giveaway"}
      </h1>
      <div className="mt-6">
        <GiveawayForm giveaway={giveaway} />
      </div>
    </div>
  );
}
