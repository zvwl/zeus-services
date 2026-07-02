import { NextResponse } from "next/server";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { originFromRequest } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    if (!stripeConfigured() || !hasAdminClient()) {
      return NextResponse.json(
        { error: "Donations are not configured yet." },
        { status: 503 }
      );
    }
    const body = await req.json();
    const amount = Math.round(Number(body.amount) * 100) / 100;
    const currency = String(body.currency ?? "USD").toUpperCase();
    const name = String(body.name ?? "").slice(0, 60).trim() || null;
    const message = String(body.message ?? "").slice(0, 280).trim() || null;

    if (!Number.isFinite(amount) || amount < 1 || amount > 1000) {
      return NextResponse.json(
        { error: "Amount must be between 1 and 1000." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const db = createAdminClient();
    const { data: rateRow } = await db
      .from("exchange_rates")
      .select("code")
      .eq("code", currency)
      .maybeSingle();
    if (!rateRow) {
      return NextResponse.json({ error: "Unsupported currency." }, { status: 400 });
    }

    const { data: donation, error } = await db
      .from("donations")
      .insert({
        user_id: user?.id ?? null,
        name,
        message,
        amount,
        currency,
        status: "pending",
      })
      .select("id")
      .single();
    if (error || !donation) {
      return NextResponse.json(
        { error: "Could not create donation." },
        { status: 500 }
      );
    }

    const origin = originFromRequest(req);
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: "Buy Zeuservices a coffee",
              description: "Thank you for supporting us!",
            },
          },
        },
      ],
      metadata: { type: "donation", donation_id: donation.id },
      customer_email: user?.email ?? undefined,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${origin}/donate?thanks=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/donate?cancelled=${donation.id}`,
    });

    await db
      .from("donations")
      .update({ stripe_session_id: session.id })
      .eq("id", donation.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Donate error:", err);
    return NextResponse.json({ error: "Donation failed." }, { status: 500 });
  }
}
