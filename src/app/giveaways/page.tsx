import Link from "next/link";
import type { Metadata } from "next";
import { Crown, Gift, Timer } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CoverImage } from "@/components/cards";
import { Badge, EmptyState, SectionHeading } from "@/components/ui";
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
  const supabase = await createClient();
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
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHeading
        eyebrow="Free stuff"
        title="Giveaways"
        subtitle="We regularly give away game currency, skins and accounts to our community. Entering is always free."
      />

      {active.length === 0 && ended.length === 0 ? (
        <EmptyState
          icon={<Gift className="h-10 w-10" />}
          title="No giveaways right now"
          description="Join our Discord to be the first to know when a new one drops."
        />
      ) : (
        <>
          {active.length > 0 && (
            <div className="mb-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {active.map((g) => (
                <Link
                  key={g.id}
                  href={`/giveaways/${g.slug}`}
                  className="group glass overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-glow-gold"
                >
                  <CoverImage
                    src={g.image_url}
                    alt={g.title}
                    fallbackText={`🎁 ${g.title}`}
                    className="aspect-[16/9] w-full"
                  />
                  <div className="p-5">
                    <Badge variant="gold">
                      <Timer className="h-3 w-3" /> Ends {formatDate(g.ends_at)}
                    </Badge>
                    <h2 className="mt-3 text-lg font-bold text-white group-hover:text-gold">
                      {g.title}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
                      <Crown className="h-4 w-4 text-gold" /> {g.prize}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {ended.length > 0 && (
            <>
              <h2 className="mb-5 text-xl font-bold text-zinc-400">
                Past giveaways
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ended.map((g) => (
                  <div key={g.id} className="glass p-5 opacity-70">
                    <Badge variant="danger">Ended</Badge>
                    <h3 className="mt-3 font-bold text-white">{g.title}</h3>
                    <p className="mt-1 text-sm text-zinc-500">
                      Prize: {g.prize}
                    </p>
                    {g.winner_user_id && (
                      <p className="mt-2 text-sm text-gold">🏆 Winner drawn</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
