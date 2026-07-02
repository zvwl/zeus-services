import Link from "next/link";
import type { Metadata } from "next";
import { LifeBuoy, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getSettings, setting } from "@/lib/data";
import { Badge, ButtonLink, Card, SectionHeading, statusBadgeVariant } from "@/components/ui";
import { TicketForm } from "@/components/TicketForm";
import { formatDateTime } from "@/lib/utils";
import type { SupportTicket } from "@/lib/types";

export const metadata: Metadata = { title: "Support" };
export const revalidate = 0;

export default async function SupportPage() {
  const [user, settings] = await Promise.all([getUser(), getSettings()]);
  const discord = setting(settings, "discord_invite");

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
      <SectionHeading
        eyebrow="We're here 24/7"
        title="Support center"
        subtitle="Open a ticket and our team will get back to you — usually within a few hours."
        center
      />

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <LifeBuoy className="mx-auto h-6 w-6 text-primary-light" />
          <h3 className="mt-2 font-semibold text-white">Browse the FAQ</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Most questions are answered instantly.
          </p>
          <Link href="/faq" className="mt-3 inline-block text-sm text-primary-light hover:underline">
            Open FAQ →
          </Link>
        </Card>
        <Card className="text-center">
          <MessageSquare className="mx-auto h-6 w-6 text-primary-light" />
          <h3 className="mt-2 font-semibold text-white">Live chat on Discord</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Fastest way to reach the team.
          </p>
          {discord ? (
            <a
              href={discord}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm text-primary-light hover:underline"
            >
              Join Discord →
            </a>
          ) : (
            <span className="mt-3 inline-block text-sm text-zinc-600">Coming soon</span>
          )}
        </Card>
        <Card className="text-center">
          <h3 className="mt-2 font-semibold text-white">Open a ticket</h3>
          <p className="mt-1 text-xs text-zinc-500">
            For order issues, refunds and account help.
          </p>
          <span className="mt-3 inline-block text-sm text-zinc-600">Form below ↓</span>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
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
        </div>
        <div>
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
                  className="glass block p-4 transition hover:border-primary/40"
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
        </div>
      </div>
    </div>
  );
}
