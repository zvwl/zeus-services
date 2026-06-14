import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink } from "@/components/ui";
import { ActionButton } from "@/components/admin/ActionControls";
import { deleteGame } from "@/app/admin/actions";
import type { Game } from "@/lib/types";

export const revalidate = 0;

export default async function AdminGamesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("games").select("*").order("sort_order");
  const games = (data as Game[]) ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-white">Games</h1>
        <ButtonLink href="/admin/games/new">
          <Plus className="h-4 w-4" /> New game
        </ButtonLink>
      </div>

      <div className="glass mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Game</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {games.map((g) => (
              <tr key={g.id} className="transition hover:bg-raised/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/games/${g.id}`}
                    className="font-medium text-primary-light hover:underline"
                  >
                    {g.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{g.slug}</td>
                <td className="px-4 py-3 text-zinc-400">{g.sort_order}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <Badge variant={g.is_active ? "success" : "danger"}>
                      {g.is_active ? "active" : "hidden"}
                    </Badge>
                    {g.is_featured && <Badge variant="gold">featured</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <ActionButton
                    action={deleteGame}
                    fields={{ id: g.id }}
                    variant="danger"
                    confirmText={`Delete "${g.name}"? Products under it must be removed first.`}
                  >
                    Delete
                  </ActionButton>
                </td>
              </tr>
            ))}
            {games.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  No games yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
