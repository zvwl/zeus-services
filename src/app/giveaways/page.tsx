import Link from "next/link";
import type { Metadata } from "next";
import { Crown, Gift, PartyPopper, Timer } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { CoverImage } from "@/components/cards";
import { Badge, EmptyState } from "@/components/ui";
import { HeroVideo } from "@/components/HeroVideo";
import { JsonLd } from "@/components/JsonLd";
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

const GIVEAWAY_FAQS = [
  {
    q: "How do I enter a giveaway?",
    a: "Create a free account or log in, open the giveaway and hit the enter button — that's it. Entry is completely free, no purchase needed. Some giveaways list one extra step (like joining the Discord) in the how-to-enter box on their page.",
  },
  {
    q: "How many times can I enter?",
    a: "Once per account per giveaway. Duplicate entries are blocked automatically, so one click puts you in the draw until it closes — there's nothing to gain from pressing the button twice.",
  },
  {
    q: "How is the winner chosen?",
    a: "Every giveaway runs to a fixed end date with a live countdown on its page. After entries close, we draw a winner from all entries and announce them on that same page, so check back once it ends.",
  },
  {
    q: "How do I get my prize if I win?",
    a: "After the giveaway ends, the winner is drawn from all entries and announced on the giveaway page. We contact the winner via their account email and Discord DMs to arrange prize delivery — so keep an eye on both after the countdown ends.",
  },
  {
    q: "Is there really no catch?",
    a: "No catch. Giveaways are funded by the store and by community donations — they're how we give back. You never have to buy anything to enter or to claim a prize.",
  },
];

const giveawayFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: GIVEAWAY_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

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
      <JsonLd data={giveawayFaqJsonLd} />

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
              // CSS-only entrance (not framer <Reveal>): the first row of
              // covers is the LCP candidate, so it must never SSR at opacity:0
              // waiting for hydration.
              <div className="mb-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {active.map((g, i) => (
                  <div
                    key={g.id}
                    className="animate-fade-up h-full"
                    // First row (3 cards at lg) gets 0ms so the LCP image is
                    // never delayed.
                    style={{
                      animationDelay: `${i < 3 ? 0 : Math.min(i, 8) * 60}ms`,
                    }}
                  >
                    <Link
                      href={`/giveaways/${g.slug}`}
                      className="group glass flex h-full flex-col overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-glow-gold"
                    >
                      <CoverImage
                        src={g.image_url}
                        alt={g.title}
                        fallbackText={g.title}
                        className="aspect-[16/9] w-full"
                        // First row is the LCP element; the grid is 1-col
                        // below md, so the default 50vw sizes would undersize
                        // the mobile LCP image.
                        priority={i < 3}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
                  </div>
                ))}
              </div>
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

        {/* Crawlable copy — rendered in both the empty and populated states,
            so the page never goes thin between giveaways. */}
        <Reveal y={16}>
          <section className="mt-14 max-w-3xl border-t border-edge pt-10">
            <div className="space-y-4 text-sm leading-relaxed text-zinc-400">
              <h2 className="text-xl font-bold text-white">
                How our giveaways work
              </h2>
              <p>
                Every giveaway here is free to enter: sign in, open the
                giveaway and hit enter — that&apos;s the whole process. Each
                account gets exactly one entry per giveaway, so the draw is
                just as fair whether you found us on day one or an hour before
                it closes.
              </p>
              <p>
                Prizes come straight off the store shelves — the same{" "}
                <Link
                  href="/games/fortnite/topups"
                  className="text-primary-light hover:underline"
                >
                  Fortnite V-Bucks
                </Link>
                ,{" "}
                <Link
                  href="/games/gta-5/topups"
                  className="text-primary-light hover:underline"
                >
                  GTA Online money
                </Link>
                ,{" "}
                <Link
                  href="/games/gta-5/accounts"
                  className="text-primary-light hover:underline"
                >
                  modded accounts
                </Link>{" "}
                and{" "}
                <Link
                  href="/games/forza-horizon-6/topups"
                  className="text-primary-light hover:underline"
                >
                  Forza Horizon 6 credits
                </Link>{" "}
                we sell every day, plus skins and other one-offs. If you win,
                we arrange delivery with you directly — so keep an eye on your
                account email and Discord DMs.
              </p>
              <p>
                Each giveaway runs to a fixed end date with a live countdown.
                After entries close, we draw a winner from all entries and
                announce them right on the giveaway page — then reach out via
                your account email and Discord DMs to sort delivery. New giveaways
                are announced on Discord first, so join if you want the
                earliest entry.
              </p>
            </div>
            <div className="mt-8 space-y-4">
              {GIVEAWAY_FAQS.map((f) => (
                <details
                  key={f.q}
                  className="glass group rounded-xl p-5 open:border-primary/40"
                >
                  <summary className="cursor-pointer list-none text-[15px] font-semibold text-white marker:content-none">
                    {f.q}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
