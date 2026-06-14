import Link from "next/link";
import Image from "next/image";
import { Zap } from "lucide-react";
import { Badge, Stars } from "@/components/ui";
import { Price } from "@/components/Price";
import { formatDate } from "@/lib/utils";
import type { Game, Product, Review } from "@/lib/types";

const GRADIENTS = [
  "from-violet-600 to-fuchsia-600",
  "from-blue-600 to-cyan-500",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-indigo-600 to-purple-600",
];

function gradientFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function CoverImage({
  src,
  alt,
  fallbackText,
  className = "",
}: {
  src: string | null;
  alt: string;
  fallbackText: string;
  className?: string;
}) {
  if (src) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
    );
  }
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${gradientFor(
        fallbackText
      )} ${className}`}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_50%)]" />
      <span className="px-4 text-center text-2xl font-extrabold tracking-tight text-white/95 drop-shadow">
        {fallbackText}
      </span>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const minVariant = product.variants
    ?.filter((v) => v.is_active)
    .sort((a, b) => Number(a.price) - Number(b.price))[0];
  const priceUsd = minVariant ? Number(minVariant.price) : Number(product.base_price);
  const soldOut =
    product.stock !== null &&
    product.stock <= 0 &&
    !product.variants?.some((v) => v.is_active && (v.stock === null || v.stock > 0));

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group glass overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow-sm"
    >
      <CoverImage
        src={product.image_url}
        alt={product.name}
        fallbackText={product.name}
        className="aspect-[16/10] w-full"
      />
      <div className="p-4">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
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
        <h3 className="font-semibold text-white transition group-hover:text-primary-light">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <Price
            usd={priceUsd}
            compareUsd={
              product.compare_at_price ? Number(product.compare_at_price) : null
            }
            from={Boolean(minVariant)}
            className="text-lg font-bold text-white"
          />
          {soldOut ? (
            <Badge variant="danger">Sold out</Badge>
          ) : (
            <span className="text-xs font-medium text-primary-light opacity-0 transition group-hover:opacity-100">
              View →
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function GameCard({
  game,
  productCount,
}: {
  game: Game;
  productCount?: number;
}) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group glass overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow-sm"
    >
      <CoverImage
        src={game.image_url}
        alt={game.name}
        fallbackText={game.name}
        className="aspect-[4/3] w-full"
      />
      <div className="flex items-center justify-between p-4">
        <div>
          <h3 className="font-semibold text-white transition group-hover:text-primary-light">
            {game.name}
          </h3>
          {typeof productCount === "number" && (
            <p className="mt-0.5 text-xs text-zinc-500">
              {productCount} {productCount === 1 ? "offer" : "offers"}
            </p>
          )}
        </div>
        <span className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-primary-light">
          →
        </span>
      </div>
    </Link>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  const name = review.profile?.username ?? review.author_name ?? "Customer";
  return (
    <div className="glass flex h-full flex-col p-5">
      <div className="flex items-center justify-between">
        <Stars rating={review.rating} />
        <span className="text-xs text-zinc-600">{formatDate(review.created_at)}</span>
      </div>
      {review.title && (
        <h4 className="mt-3 font-semibold text-white">{review.title}</h4>
      )}
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
        “{review.content}”
      </p>
      <div className="mt-4 flex items-center gap-2 border-t border-edge pt-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary-light">
          {name[0]?.toUpperCase()}
        </span>
        <span className="text-sm font-medium text-zinc-300">{name}</span>
        <Badge variant="success" className="ml-auto">
          ✓ Verified
        </Badge>
      </div>
      {review.admin_reply && (
        <div className="mt-3 rounded-xl bg-primary/10 p-3 text-xs text-zinc-400">
          <span className="font-semibold text-primary-light">Zeus Services replied: </span>
          {review.admin_reply}
        </div>
      )}
    </div>
  );
}
