import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GameForm } from "@/components/admin/GameForm";
import type { Game } from "@/lib/types";

export const revalidate = 0;

export default async function AdminGameEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let game: Game | null = null;
  if (id !== "new") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("games")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!data) notFound();
    game = data as Game;
  }

  return (
    <div className="max-w-2xl">
      <Link href="/admin/games" className="text-sm text-zinc-500 hover:text-primary-light">
        ← All games
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold text-white">
        {game ? `Edit: ${game.name}` : "New game"}
      </h1>
      <div className="mt-6">
        <GameForm game={game} />
      </div>
    </div>
  );
}
