import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Crown, Trophy, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { Badge, Card } from "@/components/ui";
import { Countdown } from "@/components/Countdown";
import { Markdown } from "@/components/Markdown";
import { GiveawayEntryButton } from "@/components/GiveawayEntryButton";
import { Reveal } from "@/components/motion";
import type { Giveaway } from "@/lib/types";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("giveaways")
    .select("title, slug, description, prize, image_url")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return { title: "Giveaway not found" };
  const title = `${data.title} — Giveaway`;
  const description = (
    data.description ||
    `Enter for free to win ${data.prize}. No purchase necessary — sign in and hit enter.`
  )
    .replace(/[#*_~>`[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/giveaways/${data.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/giveaways/${data.slug}`,
      images: data.image_url ? [{ url: data.image_url }] : undefined,
    },
  };
}

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
    <div>
      {/* Gold hero — the giveaway's own art (or the Higgsfield banner) behind
          a legibility veil */}
      <div className="relative overflow-hidden border-b border-edge">
        {/* Plain img: giveaway art can live on any host, and this is purely
            decorative background art. It's still the LCP element, so fetch it
            at high priority. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={giveaway.image_url || "/media/giveaway-banner.webp"}
          alt=""
          aria-hidden
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="art-veil" />
        <div className="relative mx-auto max-w-4xl px-4 pb-12 pt-16 sm:px-6 sm:pb-14 sm:pt-24">
          <Reveal y={16}>
            <Badge variant={ended ? "danger" : "gold"} className="px-3 py-1">
              {ended ? "Ended" : "Live giveaway"}
            </Badge>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              {giveaway.title}
            </h1>
            <p className="mt-3 flex items-center gap-2 text-lg text-zinc-300">
              <Crown className="h-5 w-5 shrink-0 text-gold" /> Prize:{" "}
              <span className="font-semibold text-gradient-gold">
                {giveaway.prize}
              </span>
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
              <Users className="h-4 w-4" />
              {Number(entryCount ?? 0).toLocaleString()} entries
            </p>
          </Reveal>
          {!ended && (
            <Reveal y={14} delay={0.12}>
              <div className="mt-6">
                <Countdown target={giveaway.ends_at} />
              </div>
            </Reveal>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {winnerName && (
          <Reveal y={16}>
            <Card className="mb-8 border-gold/40 bg-gold/5 text-center shadow-glow-gold">
              <Trophy className="mx-auto h-8 w-8 text-gold" />
              <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-gold">
                Winner
              </p>
              <p className="mt-1 text-lg font-bold text-gold">
                {String(winnerName)}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                Congratulations! Check your account email / Discord DMs to claim.
              </p>
            </Card>
          </Reveal>
        )}

        <div className="grid items-start gap-6 md:grid-cols-3">
          <Reveal y={16} className="md:col-span-2">
            {giveaway.description && <Markdown>{giveaway.description}</Markdown>}
          </Reveal>
          <Reveal y={16} delay={0.08}>
            <Card className="h-fit border-gold/25">
              <h3 className="font-bold text-white">How to enter</h3>
              <ol className="mt-3 space-y-2.5 text-sm text-zinc-400">
                {[
                  "Create a free account or log in",
                  ...(giveaway.requirement_text
                    ? [giveaway.requirement_text]
                    : []),
                  "Hit the enter button below",
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[11px] font-bold text-gold">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
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
          </Reveal>
        </div>
      </div>
    </div>
  );
}
