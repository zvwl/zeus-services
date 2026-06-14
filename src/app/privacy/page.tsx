import type { Metadata } from "next";
import { Markdown } from "@/components/Markdown";

export const metadata: Metadata = { title: "Privacy Policy" };

const PRIVACY = `
Last updated: June 2026

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

Our database and authentication are hosted by **Supabase** (PostgreSQL, EU region). Payments are processed by **Stripe**. The site is hosted on **Vercel**.

## Your rights

You can access and update your profile in account settings. You may request a full export or deletion of your data at any time by opening a support ticket — we'll action it within 30 days, except data we must keep for legal/accounting reasons.

## Cookies

We use strictly necessary cookies for login sessions and a single preference cookie for your selected currency. No third-party advertising cookies.

## Contact

Privacy questions? Open a ticket on our [support page](/support).
`;

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-extrabold text-white">Privacy Policy</h1>
      <div className="mt-8">
        <Markdown>{PRIVACY}</Markdown>
      </div>
    </div>
  );
}
