import type { Metadata } from "next";
import { getActiveGamesWithCounts } from "@/lib/data";
import { GameCard } from "@/components/cards";
import { EmptyState, SectionHeading } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { siteUrl } from "@/lib/utils";
import { Gamepad2 } from "lucide-react";

export const metadata: Metadata = {
  title: "All Games",
  description:
    "Browse every supported game — cheap top-ups, professional boosting and premium accounts with fast, secure delivery.",
  alternates: { canonical: "/games" },
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
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      {itemListJsonLd && <JsonLd data={itemListJsonLd} />}
      <SectionHeading
        as="h1"
        eyebrow="Catalogue"
        title="All games"
        subtitle="Pick your game to see every top-up, boosting service and account we offer for it."
      />
      {games.length === 0 ? (
        <EmptyState
          icon={<Gamepad2 className="h-10 w-10" />}
          title="No games yet"
          description="Check back soon — new titles are added all the time."
        />
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {games.map((g, i) => (
            <GameCard
              key={g.id}
              game={g}
              productCount={counts[g.id] ?? 0}
              // The first row of covers is this page's LCP element.
              priority={i < 4}
            />
          ))}
        </div>
      )}
    </div>
  );
}
