import Link from "next/link";
import type { Metadata } from "next";
import { LifeBuoy, MessageSquare, Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getSettings, setting } from "@/lib/data";
import { Badge, ButtonLink, Card, SectionHeading, statusBadgeVariant } from "@/components/ui";
import { TicketForm } from "@/components/TicketForm";
import { JsonLd } from "@/components/JsonLd";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion";
import { formatDateTime } from "@/lib/utils";
import type { SupportTicket } from "@/lib/types";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Need help with an order, delivery or your account? Open a support ticket or reach the Zeuservices team on Discord — we reply as fast as we can, usually within a few hours.",
  alternates: { canonical: "/support" },
};
export const revalidate = 0;

const SUPPORT_FAQS = [
  {
    q: "How fast will I get a reply?",
    a: "Tickets are usually answered within a few hours. Discord is live chat, so it's typically the fastest way to reach a human. For common questions — delivery times, payment methods, how boosts work — the FAQ answers instantly.",
  },
  {
    q: "What should I include in a ticket?",
    a: "Your order number (it's in your account dashboard and confirmation email), the game and platform, and the email you used at checkout. For payment problems, add roughly when you paid and the amount — that's enough for us to find the Stripe payment without you ever sharing card details.",
  },
  {
    q: "How do I track a ticket I've opened?",
    a: "Log in and come back to this page: every ticket you've opened is listed with its number and a status badge, and clicking one opens the full conversation thread where you and the team reply to each other.",
  },
  {
    q: "My order hasn't arrived — should I open a ticket?",
    a: "Check your account dashboard first — it shows live order status, and most orders complete within minutes to a few hours. If the delivery window shown on the product page has clearly passed, open a ticket with the order number and we'll chase it up.",
  },
  {
    q: "How do refunds work?",
    a: "Open a ticket with the category set to Refund request and include your order number. In short: paid but undelivered orders are fully refundable, delivered orders aren't, and accounts come with 7 days of cover instead — the refund policy has the full breakdown.",
  },
];

const supportFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: SUPPORT_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default async function SupportPage() {
  const [user, settings] = await Promise.all([getUser(), getSettings()]);
  const discord = setting(settings, "discord_invite");
  const supportEmail = setting(settings, "support_email");

  let tickets: SupportTicket[] = [];
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    tickets = (data as SupportTicket[]) ?? [];
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <JsonLd data={supportFaqJsonLd} />
      <Reveal y={14}>
        <SectionHeading
          as="h1"
          eyebrow="We're here to help"
          title="Support center"
          subtitle="Open a ticket and our team will get back to you — usually within a few hours."
          center
        />
      </Reveal>

      <RevealGroup className="mb-10 grid gap-4 sm:grid-cols-3" stagger={0.07}>
        <RevealItem className="h-full">
          <Card className="h-full text-center transition hover:border-primary/30">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
              <LifeBuoy className="h-5 w-5 text-primary-light" />
            </span>
            <h3 className="mt-3 font-semibold text-white">Browse the FAQ</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Most questions are answered instantly.
            </p>
            <Link
              href="/faq"
              className="mt-3 inline-flex min-h-[44px] items-center text-sm text-primary-light hover:underline sm:min-h-0"
            >
              Open FAQ →
            </Link>
          </Card>
        </RevealItem>
        <RevealItem className="h-full">
          <Card className="h-full text-center transition hover:border-primary/30">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
              <MessageSquare className="h-5 w-5 text-primary-light" />
            </span>
            <h3 className="mt-3 font-semibold text-white">Live chat on Discord</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Fastest way to reach the team.
            </p>
            {discord ? (
              <a
                href={discord}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-[44px] items-center text-sm text-primary-light hover:underline sm:min-h-0"
              >
                Join Discord →
              </a>
            ) : (
              <span className="mt-3 inline-block text-sm text-zinc-600">
                Coming soon
              </span>
            )}
          </Card>
        </RevealItem>
        <RevealItem className="h-full">
          <Card className="h-full text-center transition hover:border-primary/30">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
              <Ticket className="h-5 w-5 text-primary-light" />
            </span>
            <h3 className="mt-3 font-semibold text-white">Open a ticket</h3>
            <p className="mt-1 text-xs text-zinc-500">
              For order issues, refunds and account help.
            </p>
            <span className="mt-3 inline-block text-sm text-zinc-600">
              Form below ↓
            </span>
            {supportEmail && (
              <p className="mt-2 text-xs text-zinc-500">
                or email{" "}
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-primary-light hover:underline"
                >
                  {supportEmail}
                </a>
              </p>
            )}
          </Card>
        </RevealItem>
      </RevealGroup>

      <div className="grid gap-8 lg:grid-cols-2">
        <Reveal y={16}>
          <h2 className="mb-4 text-xl font-bold text-white">New ticket</h2>
          {user ? (
            <TicketForm />
          ) : (
            <Card className="text-center">
              <p className="text-sm text-zinc-400">
                Please log in to open a support ticket so we can track your
                orders and replies.
              </p>
              <ButtonLink href="/login?next=/support" className="mt-4">
                Log in
              </ButtonLink>
            </Card>
          )}
        </Reveal>
        <Reveal y={16} delay={0.08}>
          <h2 className="mb-4 text-xl font-bold text-white">My tickets</h2>
          {!user || tickets.length === 0 ? (
            <Card className="text-center text-sm text-zinc-500">
              {user ? "No tickets yet." : "Log in to see your tickets."}
            </Card>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/support/${t.id}`}
                  className="glass block p-4 transition hover:border-primary/40 hover:shadow-glow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">
                      #{t.ticket_number} — {t.subject}
                    </p>
                    <Badge variant={statusBadgeVariant(t.status)}>{t.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {t.category} · updated {formatDateTime(t.updated_at)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Reveal>
      </div>

      <Reveal y={16}>
        <section className="mt-14 max-w-3xl border-t border-edge pt-10">
          <div className="space-y-4 text-sm leading-relaxed text-zinc-400">
            <h2 className="text-xl font-bold text-white">
              How support works at Zeuservices
            </h2>
            <p>
              There are three ways to reach us, roughly ordered by speed: the{" "}
              <Link href="/faq" className="text-primary-light hover:underline">
                FAQ
              </Link>{" "}
              answers the most common questions instantly, Discord gets you a
              live human fastest, and a ticket is the right channel for
              anything tied to a specific order — tickets are usually answered
              within a few hours and keep the whole conversation in one
              thread.
              {supportEmail && (
                <>
                  {" "}
                  Prefer email?{" "}
                  <a
                    href={`mailto:${supportEmail}`}
                    className="text-primary-light hover:underline"
                  >
                    {supportEmail}
                  </a>{" "}
                  reaches the same team.
                </>
              )}
            </p>
            <p>
              When you open a ticket, pick the category that fits — Order
              issue, Delivery question, Refund request, Account &amp; login or
              Payment problem — and include your order number, the game and
              platform, and the email you used at checkout. That&apos;s
              usually everything we need to sort it in one reply. Refunds are
              covered in detail in the{" "}
              <Link href="/refunds" className="text-primary-light hover:underline">
                refund policy
              </Link>
              , and live order status is always visible in{" "}
              <Link href="/account" className="text-primary-light hover:underline">
                your account
              </Link>{" "}
              — worth a look before opening a delivery ticket, since most
              orders complete within minutes to a few hours.
            </p>
          </div>
          <div className="mt-8 space-y-4">
            {SUPPORT_FAQS.map((f) => (
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
