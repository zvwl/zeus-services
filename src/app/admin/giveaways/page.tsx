import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink } from "@/components/ui";
import { ActionButton } from "@/components/admin/ActionControls";
import { deleteGiveaway, pickGiveawayWinner } from "@/app/admin/actions";
import { formatDateTime } from "@/lib/utils";
import type { Giveaway } from "@/lib/types";

export const revalidate = 0;

export default async function AdminGiveawaysPage() {
  const supabase = await createClient();
  const [{ data: giveaways }, { data: entries }] = await Promise.all([
    supabase
      .from("giveaways")
      .select("*, winner:winner_user_id(username)")
      .order("created_at", { ascending: false }),
    supabase.from("giveaway_entries").select("giveaway_id"),
  ]);

  const entryCounts = new Map<string, number>();
  for (const e of entries ?? []) {
    entryCounts.set(e.giveaway_id, (entryCounts.get(e.giveaway_id) ?? 0) + 1);
  }

  const rows = (giveaways as Giveaway[]) ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-white">Giveaways</h1>
        <ButtonLink href="/admin/giveaways/new">
          <Plus className="h-4 w-4" /> New giveaway
        </ButtonLink>
      </div>

      <div className="glass mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Giveaway</th>
              <th className="px-4 py-3">Prize</th>
              <th className="px-4 py-3">Entries</th>
              <th className="px-4 py-3">Ends</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {rows.map((g) => {
              const ended = new Date(g.ends_at).getTime() <= Date.now();
              return (
                <tr key={g.id} className="transition hover:bg-raised/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/giveaways/${g.id}`}
                      className="font-medium text-primary-light hover:underline"
                    >
                      {g.title}
                    </Link>
                    {g.winner?.username && (
                      <p className="text-xs text-gold">🏆 {g.winner.username}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{g.prize}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {entryCounts.get(g.id) ?? 0}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {formatDateTime(g.ends_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        g.winner_user_id
                          ? "gold"
                          : g.is_active && !ended
                            ? "success"
                            : "danger"
                      }
                    >
                      {g.winner_user_id
                        ? "winner drawn"
                        : g.is_active && !ended
                          ? "live"
                          : "ended"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {!g.winner_user_id && (
                        <ActionButton
                          action={pickGiveawayWinner}
                          fields={{ id: g.id }}
                          variant="gold"
                          confirmText="Draw a random winner now? This ends the giveaway."
                        >
                          🎲 Draw winner
                        </ActionButton>
                      )}
                      <ActionButton
                        action={deleteGiveaway}
                        fields={{ id: g.id }}
                        variant="danger"
                        confirmText={`Delete "${g.title}" and all its entries?`}
                      >
                        Delete
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  No giveaways yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
