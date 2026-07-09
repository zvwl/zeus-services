import type { Metadata } from "next";
import Link from "next/link";
import { BadgePercent, Gift, ShieldCheck, Ticket } from "lucide-react";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/motion";

// Codes change rarely; admin actions revalidate this path on every change,
// with a 5-minute safety net.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Discount Codes",
  description:
    "Every active Zeuservices discount code, straight from the source. If a coupon site lists a code that isn't on this page, it's expired or made up.",
  alternates: { canonical: "/discount-codes" },
};

interface PublicCode {
  code: string;
  label: string;
  expires: string | null;
}

async function getPublicCodes(): Promise<PublicCode[]> {
  if (!stripeConfigured()) return [];
  try {
    const stripe = getStripe();
    const list = await stripe.promotionCodes.list({
      active: true,
      limit: 100,
      expand: ["data.coupon"],
    });
    return list.data
      .filter((p) => p.metadata?.public === "true" && p.coupon?.valid)
      .map((p) => ({
        code: p.code,
        label:
          p.coupon.percent_off != null
            ? `${p.coupon.percent_off}% off your order`
            : `${((p.coupon.amount_off ?? 0) / 100).toFixed(2)} ${(
                p.coupon.currency ?? "usd"
              ).toUpperCase()} off your order`,
        expires: p.expires_at
          ? new Date(p.expires_at * 1000).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : null,
      }));
  } catch {
    return [];
  }
}

const STEPS = [
  { title: "Add to cart", text: "Pick your top-up, boost or account and head to checkout." },
  { title: "Enter the code", text: "On the secure Stripe payment page, click “Add promotion code” and type it in." },
  { title: "Pay less", text: "The discount applies instantly — the total updates before you pay." },
] as const;

export default async function DiscountCodesPage() {
  const codes = await getPublicCodes();

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <Reveal y={14}>
        <SectionHeading
          as="h1"
          eyebrow="Save more"
          title="Zeuservices discount codes"
          subtitle="This page is the single source of truth for our promo codes — updated automatically, straight from our payment system."
        />
      </Reveal>

      {codes.length > 0 ? (
        <div className="mb-10 space-y-3">
          {codes.map((c) => (
            <Reveal key={c.code} y={12}>
              <div className="glass flex flex-wrap items-center gap-4 p-5">
                <BadgePercent className="h-6 w-6 shrink-0 text-primary-light" />
                <code className="rounded-lg bg-raised px-3 py-1.5 font-mono text-lg font-bold tracking-wider text-white">
                  {c.code}
                </code>
                <span className="text-sm text-zinc-300">{c.label}</span>
                {c.expires && (
                  <span className="ml-auto text-xs text-zinc-500">
                    valid until {c.expires}
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      ) : (
        <Reveal y={12}>
          <div className="glass mb-10 flex flex-wrap items-center gap-4 p-6">
            <Gift className="h-6 w-6 shrink-0 text-primary-light" />
            <div className="min-w-0 flex-1 text-sm leading-relaxed text-zinc-400">
              <p className="font-semibold text-zinc-200">
                No public codes are running right now.
              </p>
              <p className="mt-1">
                Our prices are set low from the start rather than inflated and
                &ldquo;discounted&rdquo;. For genuinely free stuff, check the
                current{" "}
                <Link href="/giveaways" className="text-primary-light hover:underline">
                  giveaways
                </Link>{" "}
                — no purchase needed — or join the Discord where new codes drop
                first.
              </p>
            </div>
          </div>
        </Reveal>
      )}

      <Reveal y={14}>
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="glass p-5">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary-light">
                Step {i + 1}
              </p>
              <p className="font-semibold text-white">{s.title}</p>
              <p className="mt-1 text-sm text-zinc-400">{s.text}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal y={14}>
        <div className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <ShieldCheck className="h-5 w-5 text-primary-light" />
            A note on coupon sites
          </h2>
          <p>
            Third-party coupon sites list &ldquo;Zeuservices codes&rdquo; they
            invent or never verify — that&apos;s how that industry works. Every
            code we stand behind appears on this page, automatically, the
            moment it goes live. If it isn&apos;t here, it&apos;s expired or
            fake.
          </p>
          <p>
            Codes apply on top of prices that already undercut marketplace
            rates — see{" "}
            <Link href="/games/gta-5/accounts" className="text-primary-light hover:underline">
              GTA 5 modded accounts
            </Link>
            ,{" "}
            <Link href="/games/fortnite/topups" className="text-primary-light hover:underline">
              V-Bucks top-ups
            </Link>{" "}
            and{" "}
            <Link href="/games/forza-horizon-6/topups" className="text-primary-light hover:underline">
              Forza Horizon 6 credits
            </Link>
            .
          </p>
          <h2 className="flex items-center gap-2 pt-2 text-xl font-bold text-white">
            <Ticket className="h-5 w-5 text-primary-light" />
            Where do new codes get announced?
          </h2>
          <p>
            The announcement bar at the top of the store, our Discord, and this
            page — always at the same time. Creator codes given to partnered
            YouTubers/streamers work at checkout too, even when they&apos;re
            not listed publicly here.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
