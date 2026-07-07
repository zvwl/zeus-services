import type { Metadata } from "next";
import { Markdown } from "@/components/Markdown";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/motion";
import { getPage, getSettings, setting } from "@/lib/data";
import { siteUrl } from "@/lib/utils";

export const revalidate = 3600;

const DEFAULT_TITLE = "About Zeuservices";

// Fallback copy if the DB row is missing — the live text is editable in
// Admin → Pages (zeus.pages, slug "about").
const ABOUT = `
Zeuservices is a game-services store: cheap top-ups, professional boosting and ready-to-play accounts for the games people actually play. We are run by a private individual based in the United Kingdom, we sell worldwide, and we have served thousands of gamers over more than a year of trading.

## What we sell

- **GTA 5 & GTA Online** — cash drops, rank and unlock boosting, and modded accounts.
- **Fortnite** — V-Bucks top-ups.
- **Rocket League** — Credits top-ups.

GTA 6 services are planned for launch, currently slated for November 2026.

## Why we are cheaper

Our prices are lower because we make purchases in regions and currencies where game pricing is lower, and pass the savings on to you. That is the whole model.

## How we deliver

Most orders are delivered by our experienced staff accessing your account with the authorisation you give by placing the order. We only ever access an account with permission, never touch anything unrelated to the order, and recommend changing your password afterwards. Delivery typically takes 10 minutes to 2 hours, tracked live from your account.

## Payments, refunds and cover

Checkout runs through Stripe; your card details never touch our servers. Full refund any time before delivery starts; delivered digital orders are not refundable. Accounts include 7 days of cover instead. See our [refund policy](/refunds).

Questions? Open a [support ticket](/support) or join our [Discord](https://discord.gg/uGDuujHsBW). Zeuservices is not affiliated with any game publisher.
`;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("about");
  return {
    title: page?.title ?? DEFAULT_TITLE,
    description:
      "About Zeuservices — a UK-based game-services store selling cheap GTA, Fortnite and Rocket League top-ups, boosting and accounts worldwide. How we work, why we're cheaper, and how we deliver.",
    alternates: { canonical: "/about" },
    openGraph: {
      type: "website",
      title: page?.title ?? DEFAULT_TITLE,
      url: "/about",
    },
  };
}

export default async function AboutPage() {
  const [page, settings] = await Promise.all([getPage("about"), getSettings()]);
  const siteName = setting(settings, "site_name", "Zeuservices");
  const base = siteUrl();

  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${siteName}`,
    url: `${base}/about`,
    mainEntity: {
      "@type": "Organization",
      name: siteName,
      url: base,
      areaServed: "Worldwide",
      foundingLocation: { "@type": "Country", name: "United Kingdom" },
    },
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <JsonLd data={aboutJsonLd} />
      <Reveal y={14}>
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-light">
          Who we are
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          {page?.title ?? DEFAULT_TITLE}
        </h1>
      </Reveal>
      <Reveal y={16} delay={0.08}>
        <div className="mt-8">
          <Markdown>{page?.content ?? ABOUT}</Markdown>
        </div>
      </Reveal>
    </div>
  );
}
