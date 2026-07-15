import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Headphones, ShieldCheck, Truck, Zap } from "lucide-react";
import { getProductPageData, type SlimReview } from "@/lib/data";
import { getUser } from "@/lib/auth";
import { CoverImage, ProductCard } from "@/components/cards";
import { Badge, SectionHeading, Stars } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { BuyBox } from "@/components/BuyBox";
import { ReviewForm } from "@/components/ReviewForm";
import { ProductReviews } from "@/components/ProductReviews";
import { JsonLd } from "@/components/JsonLd";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion";
import { metaText, siteUrl } from "@/lib/utils";
import { LANDING_CATEGORIES } from "@/lib/landing";
import type { Review } from "@/lib/types";

// The page renders dynamically (getUser for the review form), but every
// catalog/review query below goes through the tag-invalidated cache in
// lib/data.ts, so crawls and anonymous hits no longer pay per-request DB reads.

const stripMd = (s: string) =>
  s.replace(/[#*_~>`[\]()]/g, "").replace(/\s+/g, " ").trim();

/**
 * Rating summary panel: big average, stars, and a 5→1 distribution of the
 * loaded reviews (the list is capped server-side, so percentages reflect the
 * most recent reviews).
 */
function ReviewSummary({
  avg,
  total,
  reviews,
}: {
  avg: number;
  total: number;
  reviews: Review[];
}) {
  return (
    <div className="glass p-6">
      <p className="text-5xl font-extrabold leading-none text-white">{avg}</p>
      <Stars rating={avg} className="mt-2.5" />
      <p className="mb-4 mt-2 text-[13px] text-zinc-500">
        {total} verified {total === 1 ? "review" : "reviews"}
      </p>
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = reviews.filter((r) => r.rating === star).length;
          const pct = Math.round((count / reviews.length) * 100);
          return (
            <div key={star} className="flex items-center gap-2">
              <span className="w-3 text-xs text-zinc-500">{star}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-raised">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs text-zinc-500">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Same cached unit the page body uses — no extra query.
  const data = await getProductPageData(slug);
  // Real 404 status for unknown slugs — the page body's notFound() fires too
  // late once the streamed shell has already sent a 200 (soft-404).
  if (!data) notFound();
  const p = data.product;
  // Only prefix the game name when the product name doesn't already carry it
  // ("Fortnite V-Bucks" must not become "Fortnite Fortnite V-Bucks").
  const gamePrefix =
    p.game?.name && !p.name.toLowerCase().includes(p.game.name.toLowerCase())
      ? `${p.game.name} `
      : "";
  const title = p.meta_title || `${gamePrefix}${p.name}`;
  const description = metaText(
    p.meta_description ||
      stripMd(p.description || `Buy ${p.name} fast and securely at Zeuservices.`)
  );
  return {
    title,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/product/${p.slug}`,
      images: p.image_url ? [{ url: p.image_url }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [data, user] = await Promise.all([getProductPageData(slug), getUser()]);
  if (!data) notFound();
  const { product, reviews: productReviews, ratings, related } = data;

  // Average over EVERY approved rating (not just the 30 shown) so the visible
  // score, the review count and the JSON-LD aggregateRating all agree.
  const totalReviews = ratings.length;
  const avg =
    totalReviews > 0
      ? Math.round((ratings.reduce((s, r) => s + r, 0) / totalReviews) * 10) /
        10
      : null;

  // Only the fields ReviewCard renders cross into the "use client" grid — the
  // raw rows carry UUIDs and moderation flags that would ship per card in the
  // RSC flight payload.
  const reviewCards: SlimReview[] = productReviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    content: r.content,
    created_at: r.created_at,
    admin_reply: r.admin_reply,
    author_name: r.author_name,
    author_avatar: r.author_avatar,
    profile: r.profile ?? null,
  }));

  const variants = (product.variants ?? [])
    .filter((v) => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
  const fields = (product.fields ?? []).sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const addons = (product.addons ?? [])
    .filter((a) => a.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const base = siteUrl();
  const isCustom =
    product.pricing_mode === "custom" && product.custom_price_per_unit != null;
  const activePrices = variants.map((v) => Number(v.price));
  // "from" price for structured data. Custom-amount products have base_price 0,
  // so derive their minimum purchasable price instead of advertising $0.00.
  const price = activePrices.length
    ? Math.min(...activePrices)
    : isCustom
      ? Number(product.custom_price_per_unit) *
        Math.max(1, Number(product.custom_min ?? 1))
      : Number(product.base_price);
  const inStock = variants.length
    ? variants.some((v) => v.stock === null || v.stock > 0)
    : product.stock === null || product.stock > 0;

  // Shared Offer plumbing; multi-variant products advertise the real price
  // range via AggregateOffer instead of asserting the "from" price as THE price.
  const offerCommon = {
    priceCurrency: "USD",
    itemCondition: "https://schema.org/NewCondition",
    availability: inStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    url: `${base}/product/${product.slug}`,
    seller: { "@type": "Organization", name: "Zeuservices", url: base },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "GB",
      returnPolicyCategory:
        "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 0,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
      merchantReturnLink: `${base}/refunds`,
    },
  };
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const offers =
    activePrices.length > 1
      ? {
          "@type": "AggregateOffer",
          lowPrice: Math.min(...activePrices).toFixed(2),
          highPrice: Math.max(...activePrices).toFixed(2),
          offerCount: activePrices.length,
          ...offerCommon,
        }
      : {
          "@type": "Offer",
          price: price.toFixed(2),
          priceValidUntil,
          ...offerCommon,
        };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.image_url ? { image: product.image_url } : {}),
    ...(product.description
      ? { description: stripMd(product.description).slice(0, 300) }
      : {}),
    ...(product.game?.name
      ? { brand: { "@type": "Brand", name: product.game.name } }
      : {}),
    offers,
    ...(totalReviews > 0 && avg
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avg,
            reviewCount: totalReviews,
          },
          // Individual review snippets (top 5 most recent) — the data is
          // already fetched and rendered on the page, so mark it up too.
          review: productReviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
            author: {
              "@type": "Person",
              name: r.profile?.username ?? r.author_name ?? "Verified buyer",
            },
            datePublished: r.created_at?.slice(0, 10),
            ...(r.content ? { reviewBody: r.content.slice(0, 200) } : {}),
          })),
        }
      : {}),
  };

  // Deep link to the game×category SEO landing page (when one exists) — these
  // money pages otherwise sit one referring page away from orphan status.
  const landingHref =
    product.game &&
    product.category &&
    (LANDING_CATEGORIES as readonly string[]).includes(product.category.slug)
      ? `/games/${product.game.slug}/${product.category.slug}`
      : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      ...(product.category
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: product.category.name,
              item: `${base}/category/${product.category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.category ? 3 : 2,
        name: product.name,
        item: `${base}/product/${product.slug}`,
      },
    ],
  };

  return (
    // Bottom padding on mobile keeps content clear of the BuyBox sticky bar.
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-12 sm:px-6 lg:pb-12">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {/* Breadcrumbs */}
      <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <Link href="/" className="hover:text-primary-light">Home</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link
              href={`/category/${product.category.slug}`}
              className="hover:text-primary-light"
            >
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        {product.game && (
          <>
            <Link
              href={`/games/${product.game.slug}`}
              className="hover:text-primary-light"
            >
              {product.game.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-zinc-300">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <CoverImage
            src={product.image_url}
            alt={product.name}
            fallbackText={product.name}
            className="aspect-[16/10] w-full rounded-2xl border border-edge"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <RevealGroup className="mt-5 flex flex-wrap gap-2.5" stagger={0.06}>
            {[
              {
                icon: product.delivery_type === "instant" ? Zap : Truck,
                label:
                  product.delivery_type === "instant"
                    ? "Instant delivery"
                    : "Manual delivery",
              },
              { icon: ShieldCheck, label: "Stripe-secured" },
              { icon: Headphones, label: "24/7 support" },
            ].map((f) => (
              <RevealItem key={f.label} y={12}>
                <div className="glass flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] text-zinc-300">
                  <f.icon className="h-4 w-4 text-primary-light" />
                  {f.label}
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {product.game && <Badge>{product.game.name}</Badge>}
            {product.category && (
              <Badge variant="primary">{product.category.name}</Badge>
            )}
            {product.delivery_type === "instant" && (
              <Badge variant="gold">
                <Zap className="h-3 w-3" fill="currentColor" /> Instant
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            {product.name}
          </h1>
          {avg !== null && (
            <div className="mt-2 flex items-center gap-2">
              <Stars rating={avg} />
              <span className="text-sm text-zinc-400">
                {avg} ({totalReviews}{" "}
                {totalReviews === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}

          <div className="mt-6 lg:sticky lg:top-24">
            <BuyBox
              product={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                imageUrl: product.image_url,
                gameName: product.game?.name ?? null,
                basePrice: Number(product.base_price),
                compareAtPrice: product.compare_at_price
                  ? Number(product.compare_at_price)
                  : null,
                stock: product.stock,
                deliveryType: product.delivery_type,
                pricingMode: product.pricing_mode === "custom" ? "custom" : "fixed",
                customUnitLabel: product.custom_unit_label,
                customPricePerUnit:
                  product.custom_price_per_unit != null
                    ? Number(product.custom_price_per_unit)
                    : null,
                customMin:
                  product.custom_min != null ? Number(product.custom_min) : null,
                customMax:
                  product.custom_max != null ? Number(product.custom_max) : null,
                customStep:
                  product.custom_step != null ? Number(product.custom_step) : null,
              }}
              variants={variants.map((v) => ({
                id: v.id,
                name: v.name,
                price: Number(v.price),
                compareAtPrice: v.compare_at_price
                  ? Number(v.compare_at_price)
                  : null,
                stock: v.stock,
              }))}
              fields={fields.map((f) => ({
                id: f.id,
                label: f.label,
                fieldType: f.field_type,
                placeholder: f.placeholder,
                options: f.options ?? [],
                required: f.required,
              }))}
              addons={addons.map((a) => ({
                id: a.id,
                name: a.name,
                description: a.description,
                price: Number(a.price),
              }))}
            />
          </div>
        </div>
      </div>

      {product.description && (
        <Reveal y={18}>
          <div className="mt-16 max-w-3xl">
            <h2 className="mb-4 text-2xl font-bold text-white">About this offer</h2>
            <Markdown>{product.description}</Markdown>
          </div>
        </Reveal>
      )}

      {landingHref && (
        <p className="mt-8 text-sm text-zinc-400">
          Looking for more options? Browse all{" "}
          <Link
            href={landingHref}
            className="font-semibold text-primary-light transition hover:underline"
          >
            {product.game!.name} {product.category!.name.toLowerCase()}
          </Link>
          .
        </p>
      )}

      <div className="mt-16">
        <Reveal y={14}>
          <h2 className="text-2xl font-bold text-white">
            Customer reviews{totalReviews > 0 ? ` (${totalReviews})` : ""}
          </h2>
        </Reveal>
        {avg !== null && productReviews.length > 0 ? (
          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[300px_1fr]">
            <Reveal y={16}>
              <ReviewSummary
                avg={avg}
                total={totalReviews}
                reviews={productReviews}
              />
            </Reveal>
            <ProductReviews reviews={reviewCards} total={totalReviews} />
          </div>
        ) : (
          <ProductReviews reviews={reviewCards} total={totalReviews} />
        )}
        <Reveal y={16}>
          <div className="mt-8 max-w-xl">
            <ReviewForm productId={product.id} signedIn={Boolean(user)} />
          </div>
        </Reveal>
      </div>

      {related && related.length > 0 && (
        <div className="mt-20">
          <Reveal y={14}>
            <SectionHeading
              title={`More for ${product.game?.name ?? "this game"}`}
            />
          </Reveal>
          <RevealGroup
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            stagger={0.06}
          >
            {related.map((p) => (
              <RevealItem key={p.id}>
                <ProductCard product={p} />
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      )}
    </div>
  );
}
