import { notFound } from "next/navigation";
import { Crown, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { CoverImage } from "@/components/cards";
import { Badge, Card } from "@/components/ui";
import { Countdown } from "@/components/Countdown";
import { Markdown } from "@/components/Markdown";
import { GiveawayEntryButton } from "@/components/GiveawayEntryButton";
import type { Giveaway } from "@/lib/types";

export const revalidate = 0;

export default async function GiveawayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("giveaways")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) notFound();
  const giveaway = data as Giveaway;

  const user = await getUser();
  const [{ data: entryCount }, { data: winnerName }, entered] = await Promise.all([
    supabase.rpc("giveaway_entry_count", { gid: giveaway.id }),
    supabase.rpc("giveaway_winner_name", { gid: giveaway.id }),
    user
      ? supabase
          .from("giveaway_entries")
          .select("id")
          .eq("giveaway_id", giveaway.id)
          .eq("user_id", user.id)
          .maybeSingle()
          .then((r) => Boolean(r.data))
      : Promise.resolve(false),
  ]);

  const ended =
    !giveaway.is_active || new Date(giveaway.ends_at).getTime() <= Date.now();

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <CoverImage
        src={giveaway.image_url}
        alt={giveaway.title}
        fallbackText={`🎁 ${giveaway.title}`}
        className="aspect-[16/7] w-full rounded-2xl border border-edge"
      />
      <div className="mt-8 flex flex-wrap items-start justify-between gap-6">
        <div>
          <Badge variant={ended ? "danger" : "gold"}>
            {ended ? "Ended" : "Live giveaway"}
          </Badge>
          <h1 className="mt-3 text-4xl font-extrabold text-white">
            {giveaway.title}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-lg text-zinc-300">
            <Crown className="h-5 w-5 text-gold" /> Prize:{" "}
            <span className="font-semibold text-gold">{giveaway.prize}</span>
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
            <Users className="h-4 w-4" />
            {Number(entryCount ?? 0).toLocaleString()} entries
          </p>
        </div>
        {!ended && <Countdown target={giveaway.ends_at} />}
      </div>

      {winnerName && (
        <Card className="mt-8 border-gold/40 bg-gold/5 text-center">
          <p className="text-2xl">🏆</p>
          <p className="mt-1 font-bold text-gold">Winner: {String(winnerName)}</p>
          <p className="mt-1 text-sm text-zinc-400">
            Congratulations! Check your account email / Discord DMs to claim.
          </p>
        </Card>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {giveaway.description && <Markdown>{giveaway.description}</Markdown>}
        </div>
        <Card className="h-fit">
          <h3 className="font-bold text-white">How to enter</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
            <li>Create a free account or log in</li>
            {giveaway.requirement_text && <li>{giveaway.requirement_text}</li>}
            <li>Hit the enter button below</li>
          </ol>
          <div className="mt-5">
            <GiveawayEntryButton
              giveawayId={giveaway.id}
              ended={ended}
              entered={entered}
              signedIn={Boolean(user)}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
