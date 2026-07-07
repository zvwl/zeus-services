import type { Metadata } from "next";
import { Coffee } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/fulfill";
import { SectionHeading } from "@/components/ui";
import { DonateForm } from "@/components/DonateForm";
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
    </div>
  );
}
