import Link from "next/link";
import type { Metadata } from "next";
import { Crown, Gift, PartyPopper, Timer } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { CoverImage } from "@/components/cards";
import { Badge, EmptyState } from "@/components/ui";
import { HeroVideo } from "@/components/HeroVideo";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion";
import { formatDate } from "@/lib/utils";
import type { Giveaway } from "@/lib/types";

export const metadata: Metadata = {
  title: "Giveaways",
  description:
    "Enter free giveaways for game top-ups, premium accounts and more. No purchase necessary.",
  alternates: { canonical: "/giveaways" },
};
export const revalidate = 0;

export default async function GiveawaysPage() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("giveaways")
    .select("*")
    .order("ends_at", { ascending: false });

  const all = (data as Giveaway[]) ?? [];
  const now = Date.now();
  const active = all.filter(
    (g) => g.is_active && new Date(g.ends_at).getTime() > now
  );
  const ended = all.filter(
    (g) => !g.is_active || new Date(g.ends_at).getTime() <= now
  );

  return (
    <div>
      {/* Gold hero — seamless Higgsfield loop behind a legibility veil */}
      <div className="relative overflow-hidden border-b border-edge">
        <HeroVideo
          src="/media/giveaway-loop.mp4"
          poster="/media/giveaway-banner.webp"
        />
        <div className="art-veil" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
          <Reveal y={16}>
            <Badge variant="gold" className="px-3 py-1 text-sm">
              <PartyPopper className="h-3.5 w-3.5" /> Always free to enter
            </Badge>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Free <span className="text-gradient-gold">giveaways</span>
            </h1>
            <p className="mt-3 max-w-2xl text-zinc-300">
              We regularly give away game currency, skins and accounts to our
              community. No purchase necessary — sign in and hit enter.
            </p>
          </Reveal>
          {active.length > 0 && (
            <Reveal y={14} delay={0.12}>
              <p className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-amber-200">
                <Gift className="h-4 w-4" />
                {active.length} {active.length === 1 ? "giveaway" : "giveaways"}{" "}
                live right now
              </p>
            </Reveal>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {active.length === 0 && ended.length === 0 ? (
          <EmptyState
            icon={<Gift className="h-10 w-10" />}
            title="No giveaways right now"
            description="Join our Discord to be the first to know when a new one drops."
          />
        ) : (
          <>
            {active.length > 0 && (
              <RevealGroup
                className="mb-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                stagger={0.07}
              >
                {active.map((g) => (
                  <RevealItem key={g.id} className="h-full">
                    <Link
                      href={`/giveaways/${g.slug}`}
                      className="group glass flex h-full flex-col overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-glow-gold"
                    >
                      <CoverImage
                        src={g.image_url}
                        alt={g.title}
                        fallbackText={g.title}
                        className="aspect-[16/9] w-full"
                      />
                      <div className="flex flex-1 flex-col p-5">
                        <div>
                          <Badge variant="gold">
                            <Timer className="h-3 w-3" /> Ends {formatDate(g.ends_at)}
                          </Badge>
                        </div>
                        <h2 className="mt-3 text-lg font-bold text-white transition group-hover:text-gold">
                          {g.title}
                        </h2>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
                          <Crown className="h-4 w-4 shrink-0 text-gold" /> {g.prize}
                        </p>
                        <span className="mt-auto pt-4 text-xs font-semibold text-amber-300 opacity-0 transition group-hover:opacity-100">
                          Enter now →
                        </span>
                      </div>
                    </Link>
                  </RevealItem>
                ))}
              </RevealGroup>
            )}

            {ended.length > 0 && (
              <>
                <Reveal y={14}>
                  <h2 className="mb-5 text-xl font-bold text-zinc-400">
                    Past giveaways
                  </h2>
                </Reveal>
                <RevealGroup
                  className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                  stagger={0.05}
                >
                  {ended.map((g) => (
                    <RevealItem key={g.id} className="h-full">
                      <div className="glass h-full p-5 opacity-70">
                        <Badge variant="danger">Ended</Badge>
                        <h3 className="mt-3 font-bold text-white">{g.title}</h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          Prize: {g.prize}
                        </p>
                        {g.winner_user_id && (
                          <p className="mt-2 flex items-center gap-1.5 text-sm text-gold">
                            <Crown className="h-3.5 w-3.5" /> Winner drawn
                          </p>
                        )}
                      </div>
                    </RevealItem>
                  ))}
                </RevealGroup>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
