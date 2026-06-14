import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { GameCard } from "@/components/cards";
import { EmptyState, SectionHeading } from "@/components/ui";
import { Gamepad2 } from "lucide-react";
import type { Game } from "@/lib/types";

export const metadata: Metadata = { title: "All Games" };
export const revalidate = 0;

export default async function GamesPage() {
  const supabase = await createClient();
  const [{ data: games }, { data: products }] = await Promise.all([
    supabase.from("games").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("products").select("game_id").eq("is_active", true),
  ]);

  const counts = new Map<string, number>();
  for (const p of products ?? []) {
    counts.set(p.game_id, (counts.get(p.game_id) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHeading
        eyebrow="Catalogue"
        title="All games"
        subtitle="Pick your game to see every top-up, boosting service and account we offer for it."
      />
      {!games || games.length === 0 ? (
        <EmptyState
          icon={<Gamepad2 className="h-10 w-10" />}
          title="No games yet"
          description="Check back soon — new titles are added all the time."
        />
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {(games as Game[]).map((g) => (
            <GameCard key={g.id} game={g} productCount={counts.get(g.id) ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}
