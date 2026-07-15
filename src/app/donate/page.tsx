import type { Metadata } from "next";
import Link from "next/link";
import { Coffee } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/fulfill";
import { SectionHeading } from "@/components/ui";
import { DonateForm } from "@/components/DonateForm";
import { JsonLd } from "@/components/JsonLd";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion";
import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import type { Donation } from "@/lib/types";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Support Zeuservices with a donation and get a shout-out on our supporter wall. Every contribution helps us keep prices low.",
  alternates: { canonical: "/donate" },
};
export const revalidate = 0;

const DONATE_FAQS = [
  {
    q: "How does donating work?",
    a: "Pick one of the preset amounts — 3, 5, 10 or 25 in your displayed currency — or type a custom amount between 1 and 1000, then pay through Stripe Checkout like any store order. Your card details never touch our servers; the whole payment happens on Stripe's page.",
  },
  {
    q: "What shows up on the supporter wall?",
    a: "Only what you choose to share: a name (up to 60 characters), a message (up to 280 characters) and the amount. Leave the name blank and you appear as \"Anonymous\". The wall shows the 12 most recent completed donations.",
  },
  {
    q: "What if I change my mind at checkout?",
    a: "Just cancel or close the Stripe page. The pending donation is removed automatically and nothing is charged — no record is left behind and there's nothing to clean up.",
  },
  {
    q: "Is my payment information private?",
    a: "Yes. Payment is processed entirely by Stripe, so we never see or store card numbers. The only things that can ever appear publicly are the name, message and amount you chose to share.",
  },
  {
    q: "Do I get anything for donating?",
    a: "A spot on the supporter wall and our genuine thanks. Donations are completely optional and separate from orders — delivery times and the warranty on every order stay the same whether you tip or not.",
  },
];

const donateFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: DONATE_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default async function DonatePage({
  searchParams,
}: {
  searchParams: Promise<{ thanks?: string; session_id?: string; cancelled?: string }>;
}) {
  const { thanks, session_id: sessionId, cancelled } = await searchParams;

  // Fallback fulfillment: mark a just-paid donation completed even if the
  // Stripe webhook didn't fire (idempotent, guarded by status='pending').
  if (sessionId && hasAdminClient() && stripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        await fulfillCheckoutSession(session);
      }
    } catch {
      // ignore — show whatever state the donor wall is in
    }
  }

  // Back-out cleanup: expire the Stripe session first (so the donor can't
  // navigate back and pay for a donation we're about to delete, which would
  // leave them charged with no DB record), then drop the still-pending row.
  if (cancelled && hasAdminClient()) {
    try {
      const db = createAdminClient();
      const { data: pending } = await db
        .from("donations")
        .select("stripe_session_id")
        .eq("id", cancelled)
        .eq("status", "pending")
        .maybeSingle();
      if (pending?.stripe_session_id && stripeConfigured()) {
        try {
          await getStripe().checkout.sessions.expire(pending.stripe_session_id);
        } catch {
          // already completed/expired
        }
      }
      await db
        .from("donations")
        .delete()
        .eq("id", cancelled)
        .eq("status", "pending");
    } catch {
      // best effort
    }
  }

  const supabase = await createClient();
  // Public donor wall — select only display-safe columns (never user_id /
  // stripe_session_id). This also matches the column-level grant to the anon
  // role in migration 0011.
  const { data } = await supabase
    .from("donations")
    .select("id, name, message, amount, currency, status, created_at")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(12);
  const donations = (data as Donation[]) ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <JsonLd data={donateFaqJsonLd} />
      <Reveal y={14}>
        <SectionHeading
          as="h1"
          eyebrow="Buy us a coffee"
          title="Support Zeuservices"
          subtitle="Love what we do? Tips keep the giveaways flowing and the support team caffeinated."
          center
        />
      </Reveal>

      {thanks && (
        <p className="mx-auto mb-8 max-w-md rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-300">
          Thank you so much for your support! You&apos;re a legend.
        </p>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <Reveal y={16}>
          <DonateForm />
        </Reveal>
        <div>
          <Reveal y={14} delay={0.08}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <Coffee className="h-5 w-5 text-gold" /> Recent supporters
            </h2>
          </Reveal>
          {donations.length === 0 ? (
            <Reveal y={16} delay={0.1}>
              <p className="glass p-8 text-center text-sm text-zinc-500">
                Be the first to buy us a coffee!
              </p>
            </Reveal>
          ) : (
            <RevealGroup className="space-y-3" stagger={0.05} delay={0.1}>
              {donations.map((d) => (
                <RevealItem key={d.id} y={14}>
                  <div className="glass p-4 transition hover:border-gold/30">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">
                        {d.name || "Anonymous"}
                      </p>
                      <span className="font-bold text-gold">
                        {formatMoney(Number(d.amount), d.currency)}
                      </span>
                    </div>
                    {d.message && (
                      <p className="mt-1 text-sm italic text-zinc-400">
                        “{d.message}”
                      </p>
                    )}
                    <p className="mt-1 text-xs text-zinc-600">
                      {formatDate(d.created_at)}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>
      </div>

      <Reveal y={16}>
        <section className="mt-14 max-w-3xl border-t border-edge pt-10">
          <div className="space-y-4 text-sm leading-relaxed text-zinc-400">
            <h2 className="text-xl font-bold text-white">
              How supporting Zeuservices works
            </h2>
            <p>
              Zeuservices runs on small margins by design — prices are set low
              from the start rather than inflated and &ldquo;discounted&rdquo;.
              Tips are how the community keeps the extras running: they fund
              the free{" "}
              <Link href="/giveaways" className="text-primary-light hover:underline">
                giveaways
              </Link>{" "}
              we run for game currency, skins and accounts, help keep support
              staffed around the clock, and let us hold prices where they are
              instead of raising them.
            </p>
            <p>
              Donating takes under a minute: pick an amount, optionally leave a
              name and message for the wall, and pay through Stripe&apos;s
              secure checkout. As soon as the payment completes, your donation
              appears among the recent supporters on this page.
            </p>
          </div>
          <div className="mt-8 space-y-4">
            {DONATE_FAQS.map((f) => (
              <details
                key={f.q}
                className="glass group rounded-xl p-5 open:border-primary/40"
              >
                <summary className="cursor-pointer list-none text-[15px] font-semibold text-white marker:content-none">
                  {f.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </Reveal>
    </div>
  );
}
