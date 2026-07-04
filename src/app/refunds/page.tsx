import type { Metadata } from "next";
import { Markdown } from "@/components/Markdown";
import { getPage } from "@/lib/data";

export const revalidate = 3600;

const DEFAULT_TITLE = "Refund Policy";

// Fallback copy if the DB row is missing — the live text is editable in
// Admin → Pages (zeus.pages, slug "refunds").
const REFUNDS = `
Last updated: July 2026

## The short version

| Situation | Refund? |
| --- | --- |
| Order paid but **not yet delivered / started** | Full refund |
| Order already delivered | Not refundable |
| Wrong details provided by you, delivery attempted | Case by case |
| Boost cancelled part-way through | Not refundable — exceptions at our discretion, depending on the game and service |
| Account purchased and credentials revealed | Not refundable (7-day cover applies instead) |

## How to request a refund

1. Reach us with your order number — open a ticket on the [support page](/support) or message us on [Discord](https://discord.gg/uGDuujHsBW).
2. Tell us what went wrong — screenshots help.
3. Requests are typically reviewed and processed within **3–5 working days**. Approved refunds are returned to your original payment method via Stripe, which can take a further 5–10 business days to appear on your statement.

## Account cover

Purchased accounts include **7 days of cover** from the moment of delivery:

- If the account is banned within those 7 days, we'll provide a service on that account **free of charge** to make up for it.
- If the account is inaccessible due to a fault on our side (wrong credentials, recovered by a previous owner), we replace it.

Cover only applies if you changed the password and email immediately after delivery, as instructed at handover.

## Chargebacks

Please contact us before disputing a charge with your bank. Chargebacks filed without contacting support first will lead to permanent suspension of your store account, and we will contest disputes with delivery evidence.
`;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("refunds");
  return {
    title: page?.title ?? DEFAULT_TITLE,
    description:
      "When Zeuservices orders qualify for a refund — undelivered orders, boosting, account cover and how to open a claim.",
    alternates: { canonical: "/refunds" },
  };
}

export default async function RefundsPage() {
  const page = await getPage("refunds");
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-extrabold text-white">
        {page?.title ?? DEFAULT_TITLE}
      </h1>
      <div className="mt-8">
        <Markdown>{page?.content ?? REFUNDS}</Markdown>
      </div>
    </div>
  );
}
