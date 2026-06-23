import Link from "next/link";
import {
  Crown,
  Gamepad2,
  Gift,
  ShieldCheck,
  Sparkles,
  Timer,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { getCategories, getSettings, setting } from "@/lib/data";
import type {
  Faq,
  Game,
  Giveaway,
  Product,
  Review,
  SiteSection,
} from "@/lib/types";
import { ButtonLink, SectionHeading, Stars } from "@/components/ui";
import { GameCard, ProductCard, ReviewCard } from "@/components/cards";
import { Markdown } from "@/components/Markdown";
import { Countdown } from "@/components/Countdown";

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

async function HeroSection({ section }: { section: SiteSection }) {
  const c = section.content ?? {};
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute right-0 top-40 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-[100px]" />
        <div className="absolute left-10 top-64 h-48 w-48 rounded-full bg-amber-400/10 blur-[90px]" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary-light">
          <Sparkles className="h-4 w-4" />
          {str(c, "badge", "Trusted by thousands of gamers worldwide")}
        </div>
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
          {section.title ?? "Level up for less with"}{" "}
          <span className="text-gradient">
            {str(c, "highlight", "Zeuservices")}
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          {section.subtitle ??
            "Cheap top-ups, professional boosting and premium accounts for your favourite games. Instant delivery, secure payments, 24/7 support."}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <ButtonLink href={str(c, "cta_href", "/games")} size="lg">
            <Gamepad2 className="h-5 w-5" />
            {str(c, "cta_text", "Browse games")}
          </ButtonLink>
          <ButtonLink
            href={str(c, "cta2_href", "/category/topups")}
            variant="outline"
            size="lg"
          >
            <Zap className="h-5 w-5 text-gold" fill="currentColor" />
            {str(c, "cta2_text", "Cheap top-ups")}
          </ButtonLink>
        </div>
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: Zap, text: str(c, "pill1", "Instant delivery") },
            { icon: ShieldCheck, text: str(c, "pill2", "Secure Stripe checkout") },
            { icon: Timer, text: str(c, "pill3", "24/7 live support") },
          ].map((item) => (
            <div
              key={item.text}
              className="glass flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-medium text-zinc-300"
            >
              <item.icon className="h-4 w-4 text-primary-light" />
              {item.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function CategoriesSection({ section }: { section: SiteSection }) {
  const categories = await getCategories();
  if (categories.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <SectionHeading
        eyebrow="What we offer"
        title={section.title ?? "Shop by category"}
        subtitle={section.subtitle}
        center
      />
      <div className="grid gap-5 md:grid-cols-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="group glass relative overflow-hidden p-7 transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow-sm"
          >
            <span className="absolute -right-6 -top-6 text-[90px] opacity-[0.07] transition group-hover:opacity-[0.14]">
              {cat.icon ?? "🎮"}
            </span>
            <span className="text-3xl">{cat.icon ?? "🎮"}</span>
            <h3 className="mt-4 text-xl font-bold text-white group-hover:text-primary-light">
              {cat.name}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {cat.description}
            </p>
            <span className="mt-4 inline-block text-sm font-medium text-primary-light">
              Explore {cat.name.toLowerCase()} →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

async function FeaturedProductsSection({ section }: { section: SiteSection }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, game:games(*), category:categories(*), variants:product_variants(*)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("sort_order")
    .limit(num(section.content, "limit", 8));
  const products = (data as Product[]) ?? [];
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="flex items-end justify-between">
        <SectionHeading
          eyebrow="Hand-picked"
          title={section.title ?? "Featured offers"}
          subtitle={section.subtitle}
        />
        <Link
          href="/games"
          className="mb-10 hidden text-sm font-medium text-primary-light hover:underline sm:block"
        >
          View all →
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

async function GamesSection({ section }: { section: SiteSection }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .limit(num(section.content, "limit", 12));
  const games = (data as Game[]) ?? [];
  if (games.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <SectionHeading
        eyebrow="Supported titles"
        title={section.title ?? "Popular games"}
        subtitle={section.subtitle}
        center
      />
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
        {games.map((g) => (
          <GameCard key={g.id} game={g} />
        ))}
      </div>
    </section>
  );
}

async function StatsSection({ section }: { section: SiteSection }) {
  const c = section.content ?? {};
  let orders = num(c, "orders", 1200);
  let customers = num(c, "customers", 800);
  let avgRating = 4.9;
  if (hasAdminClient()) {
    try {
      const db = createAdminClient();
      const [o, p, r] = await Promise.all([
        db
          .from("orders")
          .select("id", { count: "exact", head: true })
          .in("status", ["paid", "processing", "completed"]),
        db.from("profiles").select("id", { count: "exact", head: true }),
        db.from("reviews").select("rating").eq("is_approved", true),
      ]);
      if (o.count) orders = o.count;
      if (p.count) customers = p.count;
      if (r.data && r.data.length > 0) {
        avgRating =
          Math.round(
            (r.data.reduce((s, x) => s + x.rating, 0) / r.data.length) * 10
          ) / 10;
      }
    } catch {
      // fall back to configured numbers
    }
  }
  const stats = [
    { label: "Orders delivered", value: `${orders.toLocaleString()}+` },
    { label: "Happy customers", value: `${customers.toLocaleString()}+` },
    { label: "Average rating", value: `${avgRating} ★` },
    { label: "Support", value: "24/7" },
  ];
  return (
    <section className="border-y border-edge bg-surface/50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-extrabold text-gradient sm:text-4xl">
              {s.value}
            </p>
            <p className="mt-1 text-sm text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

async function ReviewsSection({ section }: { section: SiteSection }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, profile:profiles(username, avatar_url)")
    .eq("is_approved", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(num(section.content, "limit", 6));
  const reviews = (data as Review[]) ?? [];
  if (reviews.length === 0) return null;
  const avg =
    Math.round(
      (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
    ) / 10;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-10 flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-light">
          Reviews
        </p>
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          {section.title ?? "What gamers say about us"}
        </h2>
        <div className="mt-2 flex items-center gap-2">
          <Stars rating={avg} />
          <span className="text-sm text-zinc-400">
            {avg} / 5 from verified customers
          </span>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
      <div className="mt-8 text-center">
        <ButtonLink href="/reviews" variant="outline">
          Read all reviews
        </ButtonLink>
      </div>
    </section>
  );
}

async function FaqSection({ section }: { section: SiteSection }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("faqs")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .limit(num(section.content, "limit", 6));
  const faqs = (data as Faq[]) ?? [];
  if (faqs.length === 0) return null;
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <SectionHeading
        eyebrow="Got questions?"
        title={section.title ?? "Frequently asked questions"}
        subtitle={section.subtitle}
        center
      />
      <div className="space-y-3">
        {faqs.map((f) => (
          <details key={f.id} className="glass group p-0">
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
        ))}
      </div>
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
      <div className="glass relative overflow-hidden bg-gradient-to-r from-[#5865F2]/20 via-surface to-surface p-10 text-center sm:p-14">
        <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-[#5865F2]/30 blur-[80px]" />
        <h2 className="text-3xl font-bold text-white">
          {section.title ?? "Join our Discord community"}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-zinc-400">
          {section.subtitle ??
            "Get order support, exclusive drops, flash sales and giveaway alerts before anyone else."}
        </p>
        <a
          href={invite}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#5865F2] px-8 py-3 font-semibold text-white transition hover:bg-[#4752c4]"
        >
          Join the server →
        </a>
      </div>
    </section>
  );
}

async function GiveawaySection({ section }: { section: SiteSection }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("giveaways")
    .select("*")
    .eq("is_active", true)
    .gt("ends_at", new Date().toISOString())
    .order("ends_at")
    .limit(1)
    .maybeSingle();
  const giveaway = data as Giveaway | null;
  if (!giveaway) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="glass relative overflow-hidden border-amber-400/30 p-10 sm:p-14">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-400/15 blur-[90px]" />
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-gold">
              <Gift className="h-4 w-4" /> Live giveaway
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white">
              {giveaway.title}
            </h2>
            <p className="mt-2 flex items-center gap-2 text-zinc-400">
              <Crown className="h-4 w-4 text-gold" /> Prize: {giveaway.prize}
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Countdown target={giveaway.ends_at} />
            <ButtonLink href={`/giveaways/${giveaway.slug}`} variant="gold" size="lg">
              Enter free →
            </ButtonLink>
          </div>
        </div>
      </div>
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
