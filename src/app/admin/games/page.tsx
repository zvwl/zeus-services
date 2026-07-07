import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink } from "@/components/ui";
import { ActionButton } from "@/components/admin/ActionControls";
import { AdminTable } from "@/components/admin/AdminTable";
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
        <div>
          <h1 className="text-2xl font-extrabold text-white">Games</h1>
          <p className="mt-1 text-sm text-zinc-500">
            The games your products are grouped under on the storefront.
          </p>
        </div>
        <ButtonLink href="/admin/games/new">
          <Plus className="h-4 w-4" /> New game
        </ButtonLink>
      </div>

      <div className="mt-6">
        <AdminTable
          minWidth={560}
          empty="No games yet — add the games you sell items for."
          columns={[
            { header: "Game" },
            { header: "Slug" },
            { header: "Order" },
            { header: "Status" },
            { header: "" },
          ]}
          rows={games.map((g) => ({
            key: g.id,
            cells: [
              <Link
                key="name"
                href={`/admin/games/${g.id}`}
                className="font-medium text-primary-light hover:underline"
              >
                {g.name}
              </Link>,
              <span key="slug" className="font-mono text-xs text-zinc-500">
                {g.slug}
              </span>,
              <span key="order" className="text-zinc-400">
                {g.sort_order}
              </span>,
              <span key="status" className="inline-flex gap-1.5">
                <Badge variant={g.is_active ? "success" : "danger"}>
                  {g.is_active ? "active" : "hidden"}
                </Badge>
                {g.is_featured && <Badge variant="gold">featured</Badge>}
              </span>,
              <ActionButton
                key="delete"
                action={deleteGame}
                fields={{ id: g.id }}
                variant="danger"
                confirmText={`Delete "${g.name}"? Products under it must be removed first.`}
              >
                Delete
              </ActionButton>,
            ],
          }))}
        />
      </div>
    </div>
  );
}
