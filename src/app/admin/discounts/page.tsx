import { getStripe, stripeConfigured } from "@/lib/stripe";
import { DiscountsClient, type PromoRow } from "@/components/admin/DiscountsClient";

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white">Discount codes</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Stripe promotion codes — customers enter them on the payment page.
          Order totals automatically record the discounted amount.
        </p>
      </div>
      <DiscountsClient codes={rows} stripeOk={stripeOk} />
    </div>
  );
}
