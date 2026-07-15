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

const HUB_FAQS = [
  {
    q: "How fast are orders delivered across games?",
    a: "Most orders complete within minutes to a few hours; instant-delivery items send credentials the moment payment clears. Each product page shows its current delivery window, and your dashboard tracks every order live until it lands.",
  },
  {
    q: "What's the difference between a top-up, a boost and an account?",
    a: "A top-up adds in-game currency to the account you already own. A boost is a service performed for you — ranks, levels, unlocks — again on your own account. An account is a separate ready-made account delivered with full email access, so you can change the credentials and keep it permanently.",
  },
  {
    q: "Is it safe to buy here?",
    a: "Payments run entirely through Stripe, so your card details never touch our servers. Every order carries our warranty, support is available around the clock on Discord and via tickets, and our reviews page collects verified feedback from completed orders.",
  },
  {
    q: "My game isn't listed — can you still help?",
    a: "Possibly. New titles are added based on what the community asks for, so tell us on Discord — if there's enough demand for a game, we stock it.",
  },
  {
    q: "Which platforms do you support?",
    a: "It depends on the product, not the game. Currency top-ups usually work across PC and consoles, while accounts and some boosts are platform-specific. Where a service is platform-specific, the product page or its options say so — and if you're unsure, ask on Discord or open a ticket and support will confirm before you buy.",
  },
];

const hubFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HUB_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

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
      <JsonLd data={hubFaqJsonLd} />

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
              <Link
                href="/games/gta-5/accounts"
                className="text-primary-light hover:underline"
              >
                GTA 5 modded accounts
              </Link>{" "}
              and{" "}
              <Link
                href="/games/gta-5/topups"
                className="text-primary-light hover:underline"
              >
                money boosts
              </Link>{" "}
              to{" "}
              <Link
                href="/games/fortnite/topups"
                className="text-primary-light hover:underline"
              >
                cheap Fortnite V-Bucks
              </Link>{" "}
              and{" "}
              <Link
                href="/games/forza-horizon-6/topups"
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
            <p>
              Platform coverage varies by product rather than by game: currency
              like V-Bucks lands on whatever platform your account plays on,
              while modded accounts and some boosts are prepared per platform.
              Where a service is platform-specific, the product page or its
              options say so — and if anything is unclear, support on Discord
              or via tickets will confirm before you buy.
            </p>
            <p>
              The full flow from this page: pick your game, choose between
              top-ups, boosting and accounts, then pick the exact product. Pay
              by card through Stripe, watch the order move through your
              dashboard, and delivery arrives there and in your inbox. The{" "}
              <Link href="/reviews" className="text-primary-light hover:underline">
                reviews page
              </Link>{" "}
              collects verified feedback from orders that went through exactly
              that flow, and any active{" "}
              <Link
                href="/discount-codes"
                className="text-primary-light hover:underline"
              >
                discount codes
              </Link>{" "}
              apply on top at the Stripe payment page.
            </p>
          </div>
        </Reveal>

        <section className="mt-14 max-w-3xl">
          <Reveal y={14}>
            <h2 className="mb-6 text-2xl font-bold text-white">
              Buying from Zeuservices — FAQ
            </h2>
          </Reveal>
          <div className="space-y-4">
            {HUB_FAQS.map((f) => (
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
      </div>
    </div>
  );
}
