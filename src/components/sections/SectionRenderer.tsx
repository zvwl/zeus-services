import Link from "next/link";
import {
  type LucideIcon,
  ArrowRight,
  Coins,
  Crown,
  Gamepad2,
  Gift,
  Headphones,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Zap,
} from "lucide-react";
import {
  getActiveFaqs,
  getActiveGames,
  getApprovedReviews,
  getCategories,
  getFeaturedProducts,
  getLiveGiveaway,
  getReviewStats,
  getSettings,
  setting,
} from "@/lib/data";
import type { SiteSection } from "@/lib/types";
import { Badge, ButtonLink, SectionHeading, Stars } from "@/components/ui";
import { GameCard, ProductCard, ReviewCard } from "@/components/cards";
import { Markdown } from "@/components/Markdown";
import { Countdown } from "@/components/Countdown";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion";
import { HeroVideo } from "@/components/HeroVideo";

function str(content: Record<string, unknown>, key: string, fallback = "") {
  const v = content?.[key];
  return typeof v === "string" && v ? v : fallback;
}
function num(content: Record<string, unknown>, key: string, fallback: number) {
  const v = Number(content?.[key]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export async function SectionRenderer({ section }: { section: SiteSection }) {
  switch (section.kind) {
    case "hero":
      return <HeroSection section={section} />;
    case "categories":
      return <CategoriesSection section={section} />;
    case "featured_products":
      return <FeaturedProductsSection section={section} />;
    case "games":
      return <GamesSection section={section} />;
    case "stats":
      return <StatsSection section={section} />;
    case "reviews":
      return <ReviewsSection section={section} />;
    case "faq":
      return <FaqSection section={section} />;
    case "steps":
      return <StepsSection section={section} />;
    case "cta_banner":
      return <CtaBannerSection section={section} />;
    case "discord":
      return <DiscordSection section={section} />;
    case "giveaway":
      return <GiveawaySection section={section} />;
    case "rich_text":
      return <RichTextSection section={section} />;
    default:
      return null;
  }
}

function HeroSection({ section }: { section: SiteSection }) {
  const c = section.content ?? {};
  return (
    <section className="relative overflow-hidden">
      {/* Higgsfield ambient loop (first frame == last frame, so it cycles
          seamlessly). The poster paints immediately and doubles as the
          reduced-motion / slow-connection fallback. Source/poster are
          admin-overridable from the section content (Admin → Layout). */}
      <HeroVideo
        src={str(c, "video_src", "/media/hero-loop.mp4")}
        poster={str(c, "video_poster", "/media/hero-poster.webp")}
      />
      <div className="art-veil" />
      {/* Hero copy is the LCP element: entrance is CSS-only (animate-fade-up
          runs at first paint, no JS/hydration dependency) — framer Reveal here
          would SSR the headline at opacity:0 until hydration. */}
      <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-center px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
        <div>
          <div className="mb-5 animate-fade-up">
            <Badge variant="primary" className="px-3 py-1 text-sm">
              <Zap className="h-3.5 w-3.5" fill="currentColor" />
              {str(c, "badge", "Instant delivery on top-ups")}
            </Badge>
          </div>
          <h1 className="animate-fade-up text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl">
            {section.title ?? "Level up."}
            <br />
            <span className="text-gradient">
              {str(c, "highlight", "Instantly.")}
            </span>
          </h1>
          <p
            className="mt-5 max-w-xl animate-fade-up text-lg text-zinc-300"
            style={{ animationDelay: "120ms" }}
          >
            {section.subtitle ??
              "Premium game top-ups, rank boosting and accounts — delivered in seconds, paid securely through Stripe, trusted by thousands of gamers."}
          </p>
          <div
            className="mt-8 flex animate-fade-up flex-wrap gap-3"
            style={{ animationDelay: "200ms" }}
          >
            <ButtonLink href={str(c, "cta_href", "/games")} size="lg">
              <Gamepad2 className="h-5 w-5" />
              {str(c, "cta_text", "Browse the shop")}
            </ButtonLink>
            <ButtonLink
              href={str(c, "cta2_href", "/giveaways")}
              variant="outline"
              size="lg"
              className="bg-bg/40 backdrop-blur-sm"
            >
              <Gift className="h-5 w-5" />
              {str(c, "cta2_text", "View giveaways")}
            </ButtonLink>
          </div>
          <div
            className="mt-8 flex animate-fade-up flex-wrap gap-x-7 gap-y-3"
            style={{ animationDelay: "280ms" }}
          >
            {[
              { icon: ShieldCheck, text: str(c, "pill1", "Stripe-secured") },
              { icon: Zap, text: str(c, "pill2", "Instant delivery") },
              { icon: Headphones, text: str(c, "pill3", "24/7 support") },
            ].map((item) => (
              <span
                key={item.text}
                className="flex items-center gap-2 text-sm text-zinc-400"
              >
                <item.icon className="h-4 w-4 text-primary-light" />
                {item.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// The design keys category tiles to Lucide glyphs (Coins / TrendingUp /
// UserCheck). Categories are admin-created with no icon field, so match on
// name/slug keywords and fall back to the gamepad.
const CATEGORY_ICONS: [RegExp, LucideIcon][] = [
  [/top.?up|currenc|coin|credit|point/i, Coins],
  [/boost|rank|level/i, TrendingUp],
  [/account/i, UserCheck],
];

function categoryIcon(cat: { name: string; slug: string }): LucideIcon {
  const hay = `${cat.name} ${cat.slug}`;
  return CATEGORY_ICONS.find(([re]) => re.test(hay))?.[1] ?? Gamepad2;
}

// Higgsfield artwork behind the three canonical category tiles, keyed the same
// way as the icons. Admin-created categories that match none get plain glass.
const CATEGORY_ART: [RegExp, string][] = [
  [/top.?up|currenc|coin|credit|point/i, "/media/cat-topups.webp"],
  [/boost|rank|level/i, "/media/cat-boosting.webp"],
  [/account/i, "/media/cat-accounts.webp"],
];

function categoryArt(cat: { name: string; slug: string }): string | null {
  const hay = `${cat.name} ${cat.slug}`;
  return CATEGORY_ART.find(([re]) => re.test(hay))?.[1] ?? null;
}

async function CategoriesSection({ section }: { section: SiteSection }) {
  const categories = await getCategories();
  if (categories.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      {section.title && (
        <Reveal>
          <SectionHeading
            eyebrow="What we offer"
            title={section.title}
            subtitle={section.subtitle}
          />
        </Reveal>
      )}
      <RevealGroup className="grid gap-5 md:grid-cols-3">
        {categories.map((cat) => {
          const Icon = categoryIcon(cat);
          const art = categoryArt(cat);
          return (
            <RevealItem key={cat.id}>
              <Link
                href={`/category/${cat.slug}`}
                className="group glass relative flex min-h-[230px] flex-col gap-3 overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow-sm"
              >
                {art && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={art}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
                    />
                    <span className="art-veil" />
                  </>
                )}
                <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary-light backdrop-blur-sm">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="relative text-lg font-bold text-white transition group-hover:text-primary-light">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="relative text-sm leading-relaxed text-zinc-400">
                    {cat.description}
                  </p>
                )}
                <span className="relative mt-auto flex items-center gap-1.5 pt-1 text-sm font-medium text-primary-light">
                  Shop {cat.name}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </section>
  );
}

async function FeaturedProductsSection({ section }: { section: SiteSection }) {
  const products = await getFeaturedProducts(num(section.content, "limit", 8));
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Reveal>
        <div className="flex items-end justify-between">
          <SectionHeading
            eyebrow="Featured"
            title={section.title ?? "Popular right now"}
            subtitle={
              section.subtitle ??
              "Hand-picked offers with the fastest delivery and best value."
            }
          />
          <Link
            href="/games"
            className="mb-10 hidden text-sm font-medium text-primary-light hover:underline sm:block"
          >
            View all →
          </Link>
        </div>
      </Reveal>
      <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <RevealItem key={p.id}>
            <ProductCard
              product={p}
              // 1-col below sm — the default 50vw sizes undersizes mobile covers.
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

async function GamesSection({ section }: { section: SiteSection }) {
  const games = await getActiveGames(num(section.content, "limit", 12));
  if (games.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Reveal>
        <SectionHeading
          eyebrow="Browse by game"
          title={section.title ?? "Popular games"}
          subtitle={section.subtitle}
        />
      </Reveal>
      <RevealGroup className="grid grid-cols-2 gap-5 md:grid-cols-3">
        {games.map((g) => (
          <RevealItem key={g.id}>
            <GameCard game={g} />
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

async function StatsSection({ section }: { section: SiteSection }) {
  const c = section.content ?? {};
  // Honest, owner-verified figures only. The rating and review count are real
  // (computed from approved reviews); the rest are true facts about the store,
  // overridable per-field from the section content in Admin → Sections.
  const { avg, count } = await getReviewStats();
  const stats = [
    { label: "Gamers served", value: str(c, "stat1", "Thousands") },
    { label: "Trading since 2024", value: str(c, "stat2", "1+ year") },
    {
      label: "Verified reviews",
      value:
        count > 0
          ? `${avg} / 5 · ${count}`
          : str(c, "stat3", "Growing"),
    },
    { label: "Typical delivery", value: str(c, "stat4", "10 min–2 hrs") },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <RevealGroup className="glass grid grid-cols-2 gap-8 px-6 py-10 lg:grid-cols-4" stagger={0.1}>
        {stats.map((s) => (
          <RevealItem key={s.label} className="text-center" y={16}>
            <p className="text-3xl font-extrabold tracking-tight text-gradient sm:text-4xl">
              {s.value}
            </p>
            <p className="mt-1.5 text-[13px] text-zinc-500">{s.label}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

async function ReviewsSection({ section }: { section: SiteSection }) {
  const [reviews, stats] = await Promise.all([
    getApprovedReviews(num(section.content, "limit", 6)),
    getReviewStats(),
  ]);
  if (reviews.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Reveal>
        <SectionHeading
          eyebrow="Reviews"
          title={section.title ?? "Loved by the community"}
          subtitle={section.subtitle ?? "Every review is from a verified buyer."}
        />
        {stats.count > 0 && (
          <div className="-mt-6 mb-8 flex items-center gap-2 text-sm text-zinc-400">
            <Stars rating={stats.avg} />
            <span className="font-semibold text-white">{stats.avg} / 5</span>
            <span>from {stats.count} verified reviews</span>
          </div>
        )}
      </Reveal>
      <RevealGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <RevealItem key={r.id}>
            <ReviewCard review={r} />
          </RevealItem>
        ))}
      </RevealGroup>
      <Reveal>
        <div className="mt-8 text-center">
          <ButtonLink href="/reviews" variant="outline">
            Read all reviews
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  );
}

async function FaqSection({ section }: { section: SiteSection }) {
  const faqs = await getActiveFaqs(num(section.content, "limit", 6));
  if (faqs.length === 0) return null;
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Reveal>
        <SectionHeading
          eyebrow="Got questions?"
          title={section.title ?? "Frequently asked questions"}
          subtitle={section.subtitle}
          center
        />
      </Reveal>
      <RevealGroup className="space-y-3" stagger={0.06}>
        {faqs.map((f) => (
          <RevealItem key={f.id} y={14}>
          <details className="glass group p-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-white [&::-webkit-details-marker]:hidden">
              {f.question}
              <span className="text-primary-light transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="px-5 pb-5 text-sm leading-relaxed text-zinc-400">
              {f.answer}
            </p>
          </details>
          </RevealItem>
        ))}
      </RevealGroup>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Still stuck?{" "}
        <Link href="/support" className="text-primary-light hover:underline">
          Contact support
        </Link>{" "}
        or check the{" "}
        <Link href="/faq" className="text-primary-light hover:underline">
          full FAQ
        </Link>
        .
      </p>
    </section>
  );
}

async function DiscordSection({ section }: { section: SiteSection }) {
  const settings = await getSettings();
  const invite = setting(settings, "discord_invite");
  if (!invite) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Reveal>
      <div className="glass flex flex-wrap items-center justify-between gap-6 p-8 sm:px-10">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#5865F2]/15 text-[#5865F2]">
            <MessageCircle className="h-7 w-7" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              {section.title ?? "Join our Discord community"}
            </h2>
            <p className="mt-1 text-zinc-500">
              {section.subtitle ??
                "Deals, drops and support — all in one place."}
            </p>
          </div>
        </div>
        <a
          href={invite}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#5865F2] px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-[#4752c4]"
        >
          Join the server
        </a>
      </div>
      </Reveal>
    </section>
  );
}

async function GiveawaySection({ section: _section }: { section: SiteSection }) {
  const giveaway = await getLiveGiveaway();
  if (!giveaway) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Reveal>
      <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-10 shadow-glow-gold sm:p-12">
        {/* Higgsfield gold treasure artwork, veiled so the copy stays legible */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/giveaway-banner.webp"
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
        <div className="art-veil" />
        <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-amber-300">
              <Gift className="h-4 w-4" /> Free giveaway
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gradient-gold">
              {giveaway.title}
            </h2>
            <p className="mt-2 flex items-center gap-2 text-zinc-400">
              <Crown className="h-4 w-4 text-gold" /> Prize: {giveaway.prize}
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Countdown target={giveaway.ends_at} />
            <ButtonLink href={`/giveaways/${giveaway.slug}`} variant="gold" size="lg">
              <Gift className="h-5 w-5" />
              Enter giveaway
            </ButtonLink>
          </div>
        </div>
      </div>
      </Reveal>
    </section>
  );
}

function StepsSection({ section }: { section: SiteSection }) {
  const c = section.content ?? {};
  const defaults: [string, string][] = [
    ["Choose your item", "Pick a top-up, boost or account for your game."],
    ["Pay securely", "Check out with Stripe in your own currency — cards, Apple Pay & Google Pay."],
    ["Fast delivery", "Our team handles your order and delivers to your account, typically within 10 minutes to 2 hours."],
  ];
  const steps = [0, 1, 2].map((i) => ({
    title: str(c, `step${i + 1}_title`, defaults[i][0]),
    text: str(c, `step${i + 1}_text`, defaults[i][1]),
  }));
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Reveal>
        <SectionHeading
          eyebrow="Simple & fast"
          title={section.title ?? "How it works"}
          subtitle={section.subtitle}
          center
        />
      </Reveal>
      <RevealGroup className="grid gap-5 md:grid-cols-3" stagger={0.12}>
        {steps.map((s, i) => (
          <RevealItem key={i}>
            <div className="glass h-full p-7 text-center">
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-xl font-bold text-primary-light">
                {i + 1}
              </span>
              <h3 className="text-lg font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.text}</p>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

function CtaBannerSection({ section }: { section: SiteSection }) {
  const c = section.content ?? {};
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Reveal>
      <div className="glass relative overflow-hidden bg-gradient-to-r from-primary/20 via-surface to-surface p-10 text-center sm:p-14">
        <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 animate-glow-pulse rounded-full bg-primary/30 blur-[80px]" />
        <h2 className="text-3xl font-bold text-white">
          {section.title ?? "Ready to level up?"}
        </h2>
        {section.subtitle && (
          <p className="mx-auto mt-3 max-w-xl text-zinc-400">{section.subtitle}</p>
        )}
        <div className="mt-8">
          <ButtonLink href={str(c, "button_href", "/games")} size="lg">
            {str(c, "button_text", "Get started")}
          </ButtonLink>
        </div>
      </div>
      </Reveal>
    </section>
  );
}

function RichTextSection({ section }: { section: SiteSection }) {
  const body = str(section.content, "body");
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      {section.title && (
        <SectionHeading title={section.title} subtitle={section.subtitle} center />
      )}
      {body && <Markdown>{body}</Markdown>}
    </section>
  );
}
