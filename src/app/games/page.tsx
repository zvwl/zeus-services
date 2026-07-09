import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getActiveGamesWithCounts } from "@/lib/data";
import { GameCard } from "@/components/cards";
import { Badge, EmptyState } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/motion";
import { siteUrl } from "@/lib/utils";
import { Gamepad2, Headphones, ShieldCheck, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "All Games",
  description:
    "Browse every supported game — cheap top-ups, professional boosting and premium accounts with fast, secure delivery.",
  alternates: { canonical: "/games" },
};

const TRUST = [
  { icon: Zap, label: "Instant top-ups" },
  { icon: ShieldCheck, label: "Stripe-secured" },
  { icon: Headphones, label: "24/7 support" },
] as const;

export default async function GamesPage() {
  const { games, counts } = await getActiveGamesWithCounts();

  const base = siteUrl();
  const gameList = games;
  const itemListJsonLd =
    gameList.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Games at Zeuservices",
          numberOfItems: gameList.length,
          itemListElement: gameList.map((g, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: g.name,
            url: `${base}/games/${g.slug}`,
          })),
        }
      : null;

  return (
    <div>
      {itemListJsonLd && <JsonLd data={itemListJsonLd} />}

      {/* Cinematic hub hero — Higgsfield ultra-wide art behind a legibility veil */}
      <div className="relative overflow-hidden border-b border-edge">
        <Image
          src="/media/games-hub.webp"
          alt=""
          aria-hidden
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="art-veil" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-24">
          {/* CSS fade-up (starts at first paint) instead of framer <Reveal>,
              so the hero copy — an LCP candidate — never SSRs at opacity:0
              waiting for hydration. */}
          <div>
            <p className="animate-fade-up mb-2 text-sm font-semibold uppercase tracking-widest text-primary-light">
              Catalogue
            </p>
            <h1
              className="animate-fade-up text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
              style={{ animationDelay: "60ms" }}
            >
              All <span className="text-gradient">games</span>
            </h1>
            <p
              className="animate-fade-up mt-3 max-w-2xl text-zinc-300"
              style={{ animationDelay: "120ms" }}
            >
              Pick your game to see every top-up, boosting service and account
              we offer for it.
            </p>
          </div>
          <Reveal y={14} delay={0.12}>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              {games.length > 0 && (
                <Badge variant="primary" className="px-3 py-1">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  {games.length} {games.length === 1 ? "game" : "games"} supported
                </Badge>
              )}
              {TRUST.map((t) => (
                <span
                  key={t.label}
                  className="inline-flex items-center gap-1.5 text-sm text-zinc-300"
                >
                  <t.icon className="h-4 w-4 text-primary-light" />
                  {t.label}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {games.length === 0 ? (
          <EmptyState
            icon={<Gamepad2 className="h-10 w-10" />}
            title="No games yet"
            description="Check back soon — new titles are added all the time."
          />
        ) : (
          // CSS-only stagger — paints at first paint instead of waiting for
          // framer hydration; disabled under prefers-reduced-motion.
          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {games.map((g, i) => (
              <div
                key={g.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <GameCard
                  game={g}
                  productCount={counts[g.id] ?? 0}
                  // The first row of covers is still high-priority for LCP.
                  priority={i < 4}
                />
              </div>
            ))}
          </div>
        )}

        {/* Crawlable hub copy — the grid alone left this page thin (Semrush
            issue 117) on a URL that should rank for generic store terms. */}
        <Reveal y={16}>
          <div className="mt-14 max-w-3xl space-y-4 border-t border-edge pt-10 text-sm leading-relaxed text-zinc-400">
            <h2 className="text-xl font-bold text-white">
              One store for every game you play
            </h2>
            <p>
              Zeuservices covers three things for every supported title:{" "}
              <Link href="/category/topups" className="text-primary-light hover:underline">
                top-ups
              </Link>{" "}
              (in-game currency like GTA$ money, V-Bucks and Forza credits for
              less than official store prices),{" "}
              <Link href="/category/boosting" className="text-primary-light hover:underline">
                boosting
              </Link>{" "}
              (ranks, levels, unlocks and account services performed on the
              account you already own), and{" "}
              <Link href="/category/accounts" className="text-primary-light hover:underline">
                accounts
              </Link>{" "}
              (ready-to-play accounts delivered with full email access so they
              become permanently yours).
            </p>
            <p>
              Whichever game you pick — from{" "}
              <Link href="/games/gta-5" className="text-primary-light hover:underline">
                GTA 5 modded accounts and money boosts
              </Link>{" "}
              to{" "}
              <Link href="/games/fortnite" className="text-primary-light hover:underline">
                cheap Fortnite V-Bucks
              </Link>{" "}
              and{" "}
              <Link
                href="/games/forza-horizon-6"
                className="text-primary-light hover:underline"
              >
                Forza Horizon 6 credits
              </Link>{" "}
              — the ordering flow is the same: Stripe-secured checkout, live
              order tracking in your dashboard, delivery typically within
              minutes to a few hours, and a warranty behind every order. New
              titles are added based on what the community asks for, so if your
              game isn't here yet, tell us on Discord.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
