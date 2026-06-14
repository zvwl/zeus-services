import type { Metadata } from "next";
import { Markdown } from "@/components/Markdown";

export const metadata: Metadata = { title: "Refund Policy" };

const REFUNDS = `
Last updated: June 2026

## The short version

| Situation | Refund? |
| --- | --- |
| Order paid but **not yet delivered / started** | ✅ Full refund |
| Wrong details provided by you, delivery attempted | ⚠️ Case by case |
| Instant product already delivered | ❌ Not refundable |
| Boost partially completed | ⚠️ Pro-rata refund of the incomplete part |
| Account purchased and credentials revealed | ❌ Not refundable (warranty applies instead) |

## How to request a refund

1. Open a ticket on the [support page](/support) with your order number.
2. Tell us what went wrong — screenshots help.
3. Approved refunds are returned to your original payment method via Stripe within 5–10 business days.

## Account warranty

Purchased accounts include a **48-hour warranty**: if the account is inaccessible due to a fault on our side (wrong credentials, recovered by previous owner), we replace it or refund in full — provided you changed the password and email immediately after delivery as instructed.

## Chargebacks

Please contact us before disputing a charge with your bank. Chargebacks filed without contacting support first will lead to permanent suspension of your store account, and we will contest disputes with delivery evidence.
`;

export default function RefundsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-extrabold text-white">Refund Policy</h1>
      <div className="mt-8">
        <Markdown>{REFUNDS}</Markdown>
      </div>
    </div>
  );
}
