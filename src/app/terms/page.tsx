import type { Metadata } from "next";
import { Markdown } from "@/components/Markdown";

export const metadata: Metadata = { title: "Terms & Conditions" };

const TERMS = `
Last updated: June 2026

## 1. Introduction

Welcome to Zeuservices ("we", "us", "our"). By accessing our website and purchasing our services — including game currency top-ups, account boosting and game accounts (the "Services") — you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the site.

## 2. Eligibility

You must be at least 16 years old (or the age of digital consent in your country) to make purchases. By ordering, you confirm the payment method used belongs to you or that you have the owner's permission.

## 3. Digital products & delivery

- **Top-ups** are delivered to the game account details you provide at checkout. Make sure they are correct — we are not responsible for top-ups sent to incorrectly entered accounts.
- **Boosting services** require temporary access to your game account. Our boosters use VPNs matched to your region and never touch anything unrelated to the ordered service. You should change your password after the service is complete.
- **Accounts** are delivered with full credentials. After delivery, you must change the email and password immediately. Warranty is void if you fail to secure the account after handover.

Delivery times shown on product pages are estimates. "Instant" products are typically delivered within minutes of payment confirmation.

## 4. Game publisher disclaimer

Zeuservices is **not affiliated with, endorsed by, or sponsored by** any game publisher (including Epic Games, Riot Games, Roblox Corporation, Supercell, Rockstar Games or any other rights holder). All trademarks belong to their respective owners. You acknowledge that the use of third-party services may be against certain games' Terms of Service and carries inherent risk; you accept that risk when ordering.

## 5. Payments

All payments are processed securely by Stripe. We never see or store your card details. Prices may be displayed in multiple currencies; the charge is made in the currency selected at checkout. We reserve the right to cancel and refund any order flagged as fraudulent.

## 6. Refunds

See our [Refund Policy](/refunds). In short: refunds are available before delivery has started; once a digital product has been delivered or a boost has begun, refunds are assessed case by case.

## 7. Account & conduct

You are responsible for keeping your Zeuservices account secure (we recommend enabling 2FA). We may suspend accounts involved in fraud, chargebacks, harassment of staff, or abuse of promotions/giveaways.

## 8. Giveaways

Giveaways are free to enter and not tied to any purchase. Winners are selected randomly from valid entries. We may disqualify entries created with duplicate or bot accounts.

## 9. Limitation of liability

To the maximum extent permitted by law, our total liability for any claim related to an order is limited to the amount you paid for that order. We are not liable for indirect losses, including in-game penalties imposed by game publishers.

## 10. Changes

We may update these terms at any time. Continued use of the site after changes constitutes acceptance. Material changes will be announced on the website.

## 11. Contact

Questions? Open a ticket on our [support page](/support) or reach us via the email in the site footer.
`;

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-extrabold text-white">Terms &amp; Conditions</h1>
      <div className="mt-8">
        <Markdown>{TERMS}</Markdown>
      </div>
    </div>
  );
}
