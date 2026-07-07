import type { Metadata } from "next";
import { Markdown } from "@/components/Markdown";
import { Reveal } from "@/components/motion";
import { getPage } from "@/lib/data";

export const revalidate = 3600;

const DEFAULT_TITLE = "Privacy Policy";

// Fallback copy if the DB row is missing — the live text is editable in
// Admin → Pages (zeus.pages, slug "privacy").
const PRIVACY = `
Last updated: July 2026

## Who we are

Zeuservices is operated by a private individual based in the **United Kingdom**, who acts as the data controller for the personal data described below. We handle your data in line with UK GDPR and the Data Protection Act 2018.

## What we collect

- **Account data** — email address, username, avatar, and (if you sign in with Discord or Google) your public profile ID from that provider.
- **Order data** — the products you buy, the in-game details you provide for delivery (e.g. game username), order totals and currency.
- **Payment data** — handled entirely by **Stripe**. We never receive or store your card number.
- **Support data** — messages you send via tickets.
- **Technical data** — basic logs (IP, browser) for security and fraud prevention.

## How we use it

- To deliver the products and services you ordered.
- To secure your account (email verification, optional two-factor authentication).
- To respond to support requests.
- To run giveaways you choose to enter.
- To send transactional emails (order confirmations, password resets). We do not sell your data, ever.

## Sensitive order details

Boosting orders may require game account credentials. These are stored encrypted at rest, visible only to the assigned delivery staff, and we strongly recommend you change your password after completion.

## Where your data lives

Our database and authentication are hosted by **Supabase** (PostgreSQL). Payments are processed by **Stripe**. The site is hosted on **Vercel**. These providers may process data outside the UK; each is bound by its own data-processing agreement and standard contractual clauses.

## Your rights

You can access and update your profile in account settings. You may request a full export or deletion of your data at any time by opening a support ticket — we'll action it within 30 days, except data we must keep for legal/accounting reasons.

## Cookies

We use strictly necessary cookies for login sessions and a single preference cookie for your selected currency. No third-party advertising cookies.

## Contact

Privacy questions? Open a ticket on our [support page](/support) or reach us on [Discord](https://discord.gg/uGDuujHsBW). You also have the right to complain to the UK Information Commissioner's Office (ICO) if you believe your data has been mishandled.
`;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("privacy");
  return {
    title: page?.title ?? DEFAULT_TITLE,
    description:
      "What data Zeuservices collects, why we collect it, how long we keep it, and the rights you have over it. Payments are handled entirely by Stripe.",
    alternates: { canonical: "/privacy" },
  };
}

export default async function PrivacyPage() {
  const page = await getPage("privacy");
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Reveal y={14}>
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-light">
          Legal
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          {page?.title ?? DEFAULT_TITLE}
        </h1>
      </Reveal>
      <Reveal y={16} delay={0.08}>
        <div className="mt-8">
          <Markdown>{page?.content ?? PRIVACY}</Markdown>
        </div>
      </Reveal>
    </div>
  );
}
