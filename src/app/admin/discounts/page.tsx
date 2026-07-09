import { getStripe, stripeConfigured } from "@/lib/stripe";
import { actionDb } from "@/lib/supabase/admin";
import {
  DiscountsClient,
  type PromoRow,
  type SaleGame,
  type SaleProduct,
} from "@/components/admin/DiscountsClient";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  let rows: PromoRow[] = [];
  let stripeOk = stripeConfigured();

  if (stripeOk) {
    try {
      const stripe = getStripe();
      const list = await stripe.promotionCodes.list({
        limit: 100,
        expand: ["data.coupon"],
      });
      rows = list.data.map((p) => ({
        id: p.id,
        code: p.code,
        active: p.active,
        percentOff: p.coupon?.percent_off ?? null,
        amountOff: p.coupon?.amount_off ?? null,
        currency: p.coupon?.currency ?? null,
        timesRedeemed: p.times_redeemed,
        maxRedemptions: p.max_redemptions ?? null,
        expiresAt: p.expires_at ? new Date(p.expires_at * 1000).toISOString() : null,
        isPublic: p.metadata?.public === "true",
        couponValid: p.coupon?.valid ?? false,
      }));
    } catch {
      stripeOk = false;
    }
  }

  // Catalog scope options for product/game sales.
  const db = await actionDb();
  const [{ data: gameRows }, { data: productRows }] = await Promise.all([
    db.from("games").select("id, name").eq("is_active", true).order("sort_order"),
    db
      .from("products")
      .select("id, name, game_id, base_price, compare_at_price, pricing_mode")
      .eq("is_active", true)
      .order("sort_order"),
  ]);
  const games: SaleGame[] = (gameRows ?? []).map((g) => ({
    id: g.id,
    name: g.name,
  }));
  const products: SaleProduct[] = (productRows ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    gameId: p.game_id,
    basePrice: Number(p.base_price),
    compareAtPrice: p.compare_at_price != null ? Number(p.compare_at_price) : null,
    isCustom: p.pricing_mode === "custom",
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">Discount codes & sales</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Promo codes apply store-wide at the Stripe payment page. For a
          discount on specific products or a whole game, run a sale — the
          storefront shows the strikethrough &ldquo;was&rdquo; price
          automatically.
        </p>
      </div>
      <DiscountsClient
        codes={rows}
        stripeOk={stripeOk}
        games={games}
        products={products}
      />
    </div>
  );
}
