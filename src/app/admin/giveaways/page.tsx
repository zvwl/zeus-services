import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink } from "@/components/ui";
import { ActionButton } from "@/components/admin/ActionControls";
import { AdminTable } from "@/components/admin/AdminTable";
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
        <div>
          <h1 className="text-2xl font-extrabold text-white">Giveaways</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Run prize draws, watch entries come in and draw a fair random winner.
          </p>
        </div>
        <ButtonLink href="/admin/giveaways/new">
          <Plus className="h-4 w-4" /> New giveaway
        </ButtonLink>
      </div>

      <div className="mt-6">
        <AdminTable
          minWidth={720}
          empty="No giveaways yet — create one to drive signups and Discord joins."
          columns={[
            { header: "Giveaway" },
            { header: "Prize" },
            { header: "Entries" },
            { header: "Ends" },
            { header: "Status" },
            { header: "" },
          ]}
          rows={rows.map((g) => {
            const ended = new Date(g.ends_at).getTime() <= Date.now();
            return {
              key: g.id,
              cells: [
                <span key="title" className="block">
                  <Link
                    href={`/admin/giveaways/${g.id}`}
                    className="font-medium text-primary-light hover:underline"
                  >
                    {g.title}
                  </Link>
                  {g.winner?.username && (
                    <span className="block text-xs text-gold">
                      Winner: {g.winner.username}
                    </span>
                  )}
                </span>,
                <span key="prize" className="text-zinc-400">
                  {g.prize}
                </span>,
                <span key="entries" className="text-zinc-300">
                  {entryCounts.get(g.id) ?? 0}
                </span>,
                <span key="ends" className="text-xs text-zinc-500">
                  {formatDateTime(g.ends_at)}
                </span>,
                <Badge
                  key="status"
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
                </Badge>,
                <span key="actions" className="inline-flex justify-end gap-2">
                  {!g.winner_user_id && (
                    <ActionButton
                      action={pickGiveawayWinner}
                      fields={{ id: g.id }}
                      variant="gold"
                      confirmText="Draw a random winner now? This ends the giveaway."
                    >
                      Draw winner
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
                </span>,
              ],
            };
          })}
        />
      </div>
    </div>
  );
}
