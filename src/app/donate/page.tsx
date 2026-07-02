import type { Metadata } from "next";
import { Coffee } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/fulfill";
import { SectionHeading } from "@/components/ui";
import { DonateForm } from "@/components/DonateForm";
import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import type { Donation } from "@/lib/types";

export const metadata: Metadata = { title: "Donate" };
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

  // Back-out cleanup: drop the still-pending (unpaid) donation row.
  if (cancelled && hasAdminClient()) {
    try {
      const db = createAdminClient();
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
      <SectionHeading
        eyebrow="Buy us a coffee"
        title="Support Zeuservices"
        subtitle="Love what we do? Tips keep the giveaways flowing and the support team caffeinated."
        center
      />

      {thanks && (
        <p className="mx-auto mb-8 max-w-md rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-300">
          Thank you so much for your support! You&apos;re a legend.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <DonateForm />
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <Coffee className="h-5 w-5 text-gold" /> Recent supporters
          </h2>
          {donations.length === 0 ? (
            <p className="glass p-8 text-center text-sm text-zinc-500">
              Be the first to buy us a coffee!
            </p>
          ) : (
            <div className="space-y-3">
              {donations.map((d) => (
                <div key={d.id} className="glass p-4">
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
