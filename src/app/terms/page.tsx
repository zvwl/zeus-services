import type { Metadata } from "next";
import { Markdown } from "@/components/Markdown";
import { getPage } from "@/lib/data";

const DEFAULT_TITLE = "Terms & Conditions";

// Fallback copy if the DB row is missing — the live text is editable in
// Admin → Pages (zeus.pages, slug "terms").
const TERMS = `
Last updated: July 2026

## 1. Introduction

Welcome to Zeuservices ("we", "us", "our"). Zeuservices is operated by a private individual based in the United Kingdom. By accessing our website and purchasing our services — including game currency top-ups, account boosting and game accounts (the "Services") — you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the site.

We sell worldwide; these terms apply wherever you order from.

## 2. Eligibility

You must be at least 16 years old (or the age of digital consent in your country) to make purchases. By ordering, you confirm the payment method used belongs to you or that you have the owner's permission.

## 3. Digital products & delivery

- **Top-ups and in-game currency** are delivered directly to the game account details you provide at checkout. Make sure they are correct — we are not responsible for deliveries sent to incorrectly entered accounts.
- **Boosting services** require temporary access to your game account, which you authorise by placing the order. Our staff are experienced in handling customer accounts: we only ever access an account with the owner's explicit permission, we never attempt to access accounts we are not authorised to use, and we never touch anything unrelated to the service you ordered. You should change your password after the service is complete.
- **Accounts** are delivered with full credentials. After delivery, you must change the email and password immediately. Cover is void if you fail to secure the account after handover.

Delivery typically takes between 10 minutes and 2 hours depending on availability and how busy we are. Delivery times shown on product pages are estimates, not guarantees.

## 4. Game publisher disclaimer

Zeuservices is **not affiliated with, endorsed by, or sponsored by** any game publisher (including Epic Games, Rockstar Games, Take-Two Interactive, Psyonix or any other rights holder). All trademarks belong to their respective owners. You acknowledge that the use of third-party services may be against certain games' Terms of Service and carries inherent risk; you accept that risk when ordering.

## 5. Payments

All payments are processed securely by Stripe. We never see or store your card details. Prices may be displayed in multiple currencies; the charge is made in the currency selected at checkout. We reserve the right to cancel and refund any order flagged as fraudulent.

## 6. Refunds

See our [Refund Policy](/refunds). In short: you can get a full refund any time before delivery has started. Once a digital product has been delivered, it is not refundable. Boosts cancelled part-way through are generally not refundable; any exception is at our discretion and depends on the game and service. Purchased accounts come with 7 days of cover instead of a refund.

## 7. Account & conduct

You are responsible for keeping your Zeuservices account secure (we recommend enabling 2FA). We may suspend accounts involved in fraud, chargebacks, harassment of staff, or abuse of promotions/giveaways.

## 8. Giveaways

Giveaways are free to enter and not tied to any purchase. Winners are selected randomly from valid entries. We may disqualify entries created with duplicate or bot accounts.

## 9. Limitation of liability

To the maximum extent permitted by law, our total liability for any claim related to an order is limited to the amount you paid for that order. We are not liable for indirect losses, including in-game penalties imposed by game publishers.

## 10. Governing law

These terms are governed by the laws of England and Wales, and any dispute is subject to the non-exclusive jurisdiction of the courts of England and Wales. Nothing in these terms affects statutory consumer rights that apply in your country of residence.

## 11. Changes

We may update these terms at any time. Continued use of the site after changes constitutes acceptance. Material changes will be announced on the website.

## 12. Contact

Questions? Open a ticket on our [support page](/support) or reach us on [Discord](https://discord.gg/uGDuujHsBW).
`;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("terms");
  return {
    title: page?.title ?? DEFAULT_TITLE,
    description:
      "The terms that apply when you buy game top-ups, boosting or accounts from Zeuservices — eligibility, delivery, refunds and acceptable use.",
    alternates: { canonical: "/terms" },
  };
}

export default async function TermsPage() {
  const page = await getPage("terms");
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-extrabold text-white">
        {page?.title ?? DEFAULT_TITLE}
      </h1>
      <div className="mt-8">
        <Markdown>{page?.content ?? TERMS}</Markdown>
      </div>
    </div>
  );
}
