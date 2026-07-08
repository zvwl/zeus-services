import type { Category, Game } from "@/lib/types";

/**
 * Curated SEO copy for the game×service landing pages
 * (/games/[slug]/[category]). Each block targets the keyword cluster this
 * combination can actually win (Semrush research, July 2026) — the slugs,
 * titles and FAQ questions mirror real queries, so edit with intent.
 * Unknown combinations fall back to sane generated copy.
 */

export interface LandingFaq {
  q: string;
  a: string;
}

export interface LandingCopy {
  /** SERP title (≤ 60 chars where possible). */
  title: string;
  /** SERP meta description (~150–160 chars). */
  description: string;
  h1: string;
  /** Markdown intro rendered above the product grid. */
  intro: string;
  faqs: LandingFaq[];
}

const CURATED: Record<string, LandingCopy> = {
  "gta-5/accounts": {
    title: "GTA 5 Modded Accounts for Sale — PS5, PS4, Xbox & PC",
    description:
      "Buy GTA 5 modded accounts loaded with cash, high rank and unlocks. Fast, safe delivery on PS5, PS4, Xbox and PC from a UK store trusted by thousands.",
    h1: "GTA 5 Modded Accounts",
    intro: `Skip years of grinding. Our **GTA 5 modded accounts** come preloaded with cash, high rank and the unlocks that matter — ready to drop straight into GTA Online on **PS5, PS4, Xbox or PC**.

Every account is prepared with safe, tested methods and delivered with **full credentials and email access**, so you can make it your own from day one. If anything isn't right, our support team is on Discord and tickets around the clock, and every order is covered by our warranty.

We're a UK-based store selling worldwide — smaller than the big marketplaces, which is exactly why we're cheaper and faster.`,
    faqs: [
      {
        q: "What is a GTA 5 modded account?",
        a: "A modded account is a GTA Online account that already has millions in cash, a high rank and popular unlocks added to it. Instead of grinding for months, you log in and everything is already there.",
      },
      {
        q: "Are GTA modded accounts safe to buy?",
        a: "Yes — our accounts are prepared with safe, tested methods and have been delivered to thousands of players. You receive a standalone account (not linked to your main), with full email access so you can change the password immediately.",
      },
      {
        q: "Which platforms do you support?",
        a: "We sell GTA 5 modded accounts for PS5, PS4, Xbox and PC. Pick your platform on the product page before checkout.",
      },
      {
        q: "How fast is delivery?",
        a: "Most account orders are delivered within minutes to a few hours. You'll get the credentials in your Zeuservices account dashboard and by email as soon as the order completes.",
      },
      {
        q: "Can I use a modded account as my main account?",
        a: "Absolutely. You get full email access with every account, so you can change the credentials and make it permanently yours.",
      },
    ],
  },
  "gta-5/topups": {
    title: "Buy GTA 5 Money — Cash Drops & Money Boosts",
    description:
      "Cheap GTA Online money delivered to your account fast. A fraction of Shark Card prices — pick your amount, check out securely and we handle the rest.",
    h1: "GTA 5 Money & Cash Top-Ups",
    intro: `Get GTA Online money without the grind — and without Shark Card prices. Our **GTA 5 money boosts** deliver cash straight to your account, safely and fast.

Choose the amount you want, check out with Stripe-secured payment, and follow the simple delivery instructions. Most money orders complete the same day, and our team is available around the clock if you have questions.

Compared to Shark Cards you'll typically pay a small fraction of the price for the same wallet balance — that's why players switch and stay.`,
    faqs: [
      {
        q: "How does a GTA money boost work?",
        a: "After checkout you'll receive simple instructions for your platform. Our team then adds the cash to your account using safe, tested methods. You keep your own account, characters and progress.",
      },
      {
        q: "Is this cheaper than buying Shark Cards?",
        a: "Dramatically. A Megalodon Shark Card gives you GTA$8M at full retail price — our money boosts deliver far larger balances for less money.",
      },
      {
        q: "Is it safe for my account?",
        a: "We use safe, tested delivery methods and have completed thousands of orders. Follow the after-delivery guidance (like spending tips) and you're in good hands.",
      },
      {
        q: "How long does delivery take?",
        a: "Most GTA money orders are completed within hours of purchase. Larger packages can take a little longer — the product page shows current delivery times.",
      },
    ],
  },
  "gta-5/boosting": {
    title: "GTA 5 Boosting — Rank Boost & Recovery Services",
    description:
      "Professional GTA 5 boosting: rank boosts, cash recovery services and unlock packages, handled by experienced players. Fast turnaround, fair prices.",
    h1: "GTA 5 Boosting & Recovery",
    intro: `Want your own account levelled up instead of buying a new one? Our **GTA 5 boosting and recovery services** add rank, cash and unlocks directly to your existing account.

Tell us what you want — a specific rank, a cash balance, unlock-all — and experienced staff handle it quickly and discreetly. You'll get progress updates and our warranty covers every order.`,
    faqs: [
      {
        q: "What is a GTA 5 recovery service?",
        a: "A recovery service upgrades your existing GTA Online account — adding cash, rank, stats or unlocks — rather than giving you a new account. You keep your characters and progress.",
      },
      {
        q: "How does a GTA rank boost work?",
        a: "Choose your target rank and follow the delivery instructions after checkout. Our team boosts your account safely and lets you know the moment it's done.",
      },
      {
        q: "Do I need to share my account?",
        a: "For account-side services like recoveries and rank boosts, temporary login access is needed. Change your password before and after — full guidance comes with your order.",
      },
    ],
  },
  "fortnite/accounts": {
    title: "Fortnite Accounts for Sale — OG Skins & Rare Accounts",
    description:
      "Buy Fortnite accounts with OG and rare skins. Full email access, instant credentials and warranty — from a UK store trusted by thousands of gamers.",
    h1: "Fortnite Accounts",
    intro: `Looking for a **Fortnite account with OG skins**? We stock ready-to-play accounts with rare and sought-after cosmetics — from OG-season skins to iconic collabs — each delivered with **full email access** so the account becomes permanently yours.

Every listing shows exactly which skins and cosmetics are included. Delivery is instant for most accounts: credentials appear in your dashboard the moment payment clears, and every order is covered by our warranty.`,
    faqs: [
      {
        q: "Are the Fortnite accounts full-access?",
        a: "Yes. Every account comes with full email access, so you can change the email, password and 2FA and make it permanently yours.",
      },
      {
        q: "What does 'OG account' mean?",
        a: "An OG Fortnite account owns cosmetics from early seasons — battle passes and item-shop skins that haven't been available for years, like Renegade Raider or Season 2–3 exclusives.",
      },
      {
        q: "Is buying a Fortnite account safe?",
        a: "We deliver accounts with their original email access and a warranty. Change the credentials as soon as you receive them and the account is yours — thousands of customers have done exactly that.",
      },
      {
        q: "How fast will I get my account?",
        a: "Most Fortnite accounts are delivered instantly after payment — credentials show up in your Zeuservices dashboard and inbox right away.",
      },
    ],
  },
  "fortnite/topups": {
    title: "Cheap V-Bucks — Fortnite Top-Ups & Gift Cards",
    description:
      "Buy V-Bucks cheaper. Fortnite top-ups and V-Bucks gift cards delivered fast, with secure Stripe checkout and 24/7 support. Every platform supported.",
    h1: "Fortnite V-Bucks Top-Ups",
    intro: `Why pay full price in the item shop? Our **cheap V-Bucks top-ups** get currency onto your Fortnite account for less, on every platform.

Pick a package, check out securely, and follow the short delivery instructions — most V-Bucks orders complete within minutes to a few hours. Support is around the clock if you need a hand.`,
    faqs: [
      {
        q: "How can the V-Bucks be cheaper than Epic's prices?",
        a: "We source top-ups and gift cards at better rates and pass the difference on. Same V-Bucks in your wallet, lower price at checkout.",
      },
      {
        q: "Which platforms are supported?",
        a: "PC, PlayStation, Xbox, Switch and mobile — V-Bucks land in your Epic wallet and are usable anywhere your account plays (console-platform funds follow Epic's own sharing rules).",
      },
      {
        q: "How fast is delivery?",
        a: "Most V-Bucks orders are completed within minutes to a few hours of purchase. The product page shows the current delivery time.",
      },
    ],
  },
  "fortnite/boosting": {
    title: "Fortnite Boosting — Wins, Levels & Battle Pass",
    description:
      "Professional Fortnite boosting: crown wins, account levels and battle-pass progress from experienced players. Discreet, fast and warranty-backed.",
    h1: "Fortnite Boosting",
    intro: `Need wins, levels or battle-pass progress? Our **Fortnite boosting services** are handled by experienced players who deliver quickly and discreetly.

Choose the boost you want, follow the delivery instructions after checkout, and track progress from your dashboard. Every order is covered by our warranty and 24/7 support.`,
    faqs: [
      {
        q: "How does Fortnite boosting work?",
        a: "After checkout, our boosters complete the wins, levels or challenges you ordered — either playing with you or on your account, depending on the service. Details are on each product page.",
      },
      {
        q: "Is boosting discreet?",
        a: "Yes — our staff play at appropriate hours, never chat on your behalf, and treat every account with care. Change your password after delivery for peace of mind.",
      },
    ],
  },
  "rocket-league/topups": {
    title: "Buy Rocket League Credits Cheap — Fast Top-Ups",
    description:
      "Cheap Rocket League credits delivered fast to PS, Xbox, PC or Switch. Secure checkout, 24/7 support and prices below the in-game shop.",
    h1: "Rocket League Credits",
    intro: `Top up **Rocket League credits for less** than the in-game store. Pick your amount, check out securely, and follow the short delivery steps — credits typically land the same day.

Credits work for the item shop, blueprints and trade-ins. We support PlayStation, Xbox, PC and Switch, with 24/7 support and a warranty on every order.`,
    faqs: [
      {
        q: "How do I get the credits?",
        a: "After checkout you'll receive simple delivery instructions for your platform. Most credit orders complete within hours.",
      },
      {
        q: "Are Rocket League credits cross-platform?",
        a: "Credits are tied to the platform where they were granted, but items bought with them travel with your account under Epic's cross-save. Check the product page for platform notes.",
      },
      {
        q: "Why are your credits cheaper?",
        a: "We source at better rates than the in-game shop and pass the savings on — the same credits, just cheaper.",
      },
    ],
  },
  "rocket-league/boosting": {
    title: "Rocket League Boosting — Rank Boost to Any Tier",
    description:
      "Professional Rocket League rank boosting from Champion-level players. Any playlist, discreet and fast, with live progress updates and warranty.",
    h1: "Rocket League Boosting",
    intro: `Climb to the rank you deserve. Our **Rocket League rank boosts** are played by high-level players who take your account (or duo with you) to your target tier — any playlist.

Discreet, fast and warranty-backed, with progress updates along the way. Pick your current and target rank on the product page to see the exact price.`,
    faqs: [
      {
        q: "How does a Rocket League rank boost work?",
        a: "Choose your current and desired rank, then our boosters play until you're there — either on your account (solo boost) or queued with you (duo boost).",
      },
      {
        q: "How long does a boost take?",
        a: "Small climbs often finish the same day; multi-tier boosts typically take a few days. You can watch progress from your dashboard.",
      },
    ],
  },
  "forza-horizon-6/topups": {
    title: "Forza Horizon 6 Money — 1 Billion Credits, Fast",
    description:
      "Buy Forza Horizon 6 credits cheap: 1 billion CR delivered fast, with wheel-spin bundles available. Safe login delivery, warranty and 24/7 support.",
    h1: "Forza Horizon 6 Money & Credits",
    intro: `Skip hundreds of hours of grinding. Our **Forza Horizon 6 money services** put a full **1 billion credits** on your account — enough to buy essentially any car in the game — with optional **wheel spin bundles** on top.

Delivery is handled by experienced staff via temporary login access: check out securely with Stripe, follow the short instructions, and most orders complete the same day. Every order carries our warranty, and support is around the clock.`,
    faqs: [
      {
        q: "How do I receive the credits?",
        a: "After checkout you provide temporary login access via the secure order form. Our team completes the setup on your account — most orders finish the same day. Change your password before and after the service.",
      },
      {
        q: "Is 1 billion credits safe?",
        a: "We use tested delivery methods and offer a free re-setup if anything goes wrong with the service. As with any account service, you accept responsibility for your account when purchasing.",
      },
      {
        q: "Do I need to own the game?",
        a: "Yes — you must own Forza Horizon 6. The game itself is not included with any money or wheel-spin package.",
      },
    ],
  },
  "rocket-league/accounts": {
    title: "Rocket League Accounts for Sale — Ranked & Stacked",
    description:
      "Buy Rocket League accounts — ranked, credit-loaded or item-stacked — with full email access, instant delivery and warranty from a trusted UK store.",
    h1: "Rocket League Accounts",
    intro: `Ready-to-play **Rocket League accounts** — ranked accounts, credit-loaded accounts and item-stacked collections — delivered with **full email access** so the account is permanently yours.

Each listing shows the rank, credits and notable items included. Delivery is instant for most accounts, and every order carries our warranty.`,
    faqs: [
      {
        q: "Do the accounts come with full access?",
        a: "Yes — full email access on every account, so you can change all credentials immediately after delivery.",
      },
      {
        q: "How fast is delivery?",
        a: "Most Rocket League accounts deliver instantly after payment — credentials appear in your dashboard and inbox right away.",
      },
    ],
  },
};

/** Copy for a game×category landing page — curated when we have it, generated otherwise. */
export function landingCopy(game: Game, category: Category): LandingCopy {
  const curated = CURATED[`${game.slug}/${category.slug}`];
  if (curated) return curated;
  const name = `${game.name} ${category.name}`;
  return {
    title: `${name} — Fast & Secure`,
    description: `Cheap ${name.toLowerCase()} with fast, secure delivery, 24/7 support and warranty. Trusted by thousands of gamers worldwide.`,
    h1: name,
    intro:
      category.intro ||
      `Browse our ${category.name.toLowerCase()} for ${game.name} — fair prices, fast delivery and 24/7 support on every order.`,
    faqs: [],
  };
}

/** The category slugs that get a landing page per game (order = display order). */
export const LANDING_CATEGORIES = ["topups", "boosting", "accounts"] as const;
