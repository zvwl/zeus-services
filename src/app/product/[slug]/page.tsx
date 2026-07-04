import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, Timer, Truck, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { CoverImage, ProductCard } from "@/components/cards";
import { Badge, SectionHeading, Stars } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { BuyBox } from "@/components/BuyBox";
import { ReviewForm } from "@/components/ReviewForm";
import { ProductReviews } from "@/components/ProductReviews";
import { JsonLd } from "@/components/JsonLd";
import { siteUrl } from "@/lib/utils";
import type { Product, Review } from "@/lib/types";

export const revalidate = 0;

const stripMd = (s: string) =>
  s.replace(/[#*_~>`[\]()]/g, "").replace(/\s+/g, " ").trim();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("name, slug, description, image_url, game:games(name)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) return { title: "Product not found" };
  const p = data as unknown as {
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    game: { name: string } | { name: string }[] | null;
  };
  const gameName = Array.isArray(p.game) ? p.game[0]?.name : p.game?.name;
  const title = `${gameName ? `${gameName} ` : ""}${p.name}`;
  const description = stripMd(
    p.description || `Buy ${p.name} fast and securely at Zeuservices.`
  ).slice(0, 160);
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
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(
      "*, game:games(*), category:categories(*), variants:product_variants(*), fields:product_fields(*), addons:product_addons(*)"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) notFound();
  const product = data as Product;

  const [{ data: reviews }, { count: reviewCount }, { data: related }, user] =
    await Promise.all([
      supabase
        .from("reviews")
        .select("*, profile:profiles(username, avatar_url)")
        .eq("product_id", product.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("product_id", product.id)
        .eq("is_approved", true),
      supabase
        .from("products")
        .select("*, game:games(*), category:categories(*), variants:product_variants(*)")
        .eq("game_id", product.game_id)
        .eq("is_active", true)
        .neq("id", product.id)
        .order("sort_order")
        .limit(4),
      getUser(),
    ]);

  const productReviews = (reviews as Review[]) ?? [];
  const totalReviews = reviewCount ?? productReviews.length;
  const avg =
    productReviews.length > 0
      ? Math.round(
          (productReviews.reduce((s, r) => s + r.rating, 0) /
            productReviews.length) *
            10
        ) / 10
      : null;

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

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.image_url ? { image: product.image_url } : {}),
    ...(product.description
      ? { description: stripMd(product.description).slice(0, 500) }
      : {}),
    ...(product.game?.name
      ? { brand: { "@type": "Brand", name: product.game.name } }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: price.toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${base}/product/${product.slug}`,
    },
    ...(totalReviews > 0 && avg
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avg,
            reviewCount: totalReviews,
          },
        }
      : {}),
  };

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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
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

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <CoverImage
            src={product.image_url}
            alt={product.name}
            fallbackText={product.name}
            className="aspect-[16/10] w-full rounded-2xl border border-edge"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              {
                icon: product.delivery_type === "instant" ? Zap : Truck,
                label:
                  product.delivery_type === "instant"
                    ? "Instant delivery"
                    : "Manual delivery",
              },
              { icon: ShieldCheck, label: "Stripe secured" },
              { icon: Timer, label: "24/7 support" },
            ].map((f) => (
              <div
                key={f.label}
                className="glass flex flex-col items-center gap-1.5 px-2 py-3 text-center"
              >
                <f.icon className="h-4 w-4 text-primary-light" />
                <span className="text-xs text-zinc-400">{f.label}</span>
              </div>
            ))}
          </div>
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
                {avg} ({productReviews.length}{" "}
                {productReviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}

          <div className="mt-6">
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
        <div className="mt-16 max-w-3xl">
          <h2 className="mb-4 text-2xl font-bold text-white">About this offer</h2>
          <Markdown>{product.description}</Markdown>
        </div>
      )}

      <div className="mt-16">
        <h2 className="text-2xl font-bold text-white">
          Customer reviews{totalReviews > 0 ? ` (${totalReviews})` : ""}
        </h2>
        <ProductReviews reviews={productReviews} total={totalReviews} />
        <div className="mt-8 max-w-xl">
          <ReviewForm productId={product.id} signedIn={Boolean(user)} />
        </div>
      </div>

      {related && related.length > 0 && (
        <div className="mt-20">
          <SectionHeading
            title={`More for ${product.game?.name ?? "this game"}`}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(related as Product[]).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
