/**
 * In-repo fallback intros for the category hub pages (/category/[slug]).
 * The admin-editable `categories.intro` wins when set; these render only when
 * it's empty, so the hubs never ship thin (Semrush low-word-count issue).
 * Wired into category/[slug]/page.tsx, which renders the intro through the
 * <Markdown> component — Markdown links work.
 */
export const CATEGORY_COPY: Record<string, string> = {
  topups: `Top-ups put in-game currency on the account you already own — [GTA Online money](/games/gta-5/topups), [Fortnite V-Bucks](/games/fortnite/topups) and [Forza Horizon 6 credits](/games/forza-horizon-6/topups) — for less than the official stores charge. Compared to buying direct (Shark Cards, the item shop), you'll typically pay a fraction of the price for the same balance — that's why players switch and stay.

The flow is the same for every game: pick your amount, check out with Stripe-secured payment (your card details never touch our servers), then follow the short delivery instructions for your platform. Most top-up orders complete within minutes to a few hours — each product page shows its current delivery window — and you can watch progress live in your dashboard until the balance lands.

You keep your own account, characters and progress throughout; nothing is replaced, only currency is added. Every order carries our warranty, and support is on Discord and tickets around the clock. Filter by game below, or jump to a game page to see everything we stock for it.`,
  boosting: `Boosting is work done on your own account by experienced players — like our [GTA 5 rank boosts, money boosts and recoveries](/games/gta-5/boosting), with more titles added as the community asks for them. You pick the target — a rank, a cash balance, an unlock — and our staff get you there quickly and discreetly.

Some boosts need temporary login access; others are played alongside you. Each product page states exactly which, along with current turnaround times. Where login access is needed, change your password before and after the service — full guidance comes with your order, and you can follow progress from your dashboard the whole way.

Checkout is Stripe-secured, every order carries our warranty, and support is around the clock on Discord and tickets. Because you're upgrading the account you already own, you keep your characters, progress and purchases — the boost just skips the grind. Not sure which service fits? Open a ticket or ask on Discord and we'll point you at the right one.`,
  accounts: `Ready-to-play accounts delivered with full credentials and email access, so you can change the password immediately and make the account permanently yours. The headline act is our [GTA 5 modded accounts](/games/gta-5/accounts) preloaded with cash, rank and unlocks — and each listing states exactly what's on the account before you buy. New titles join the range as stock lands, so check [all games](/games) for what's live right now.

Delivery is fast, and instant for many accounts: credentials appear in your Zeuservices dashboard and inbox as soon as payment clears through Stripe's secure checkout. From there, change the email, password and 2FA and it's yours — the full email access included with every account is what makes that possible.

Every account purchase includes 7 days of cover from delivery, and the support team is on Discord and tickets 24/7 if anything needs sorting. Not sure whether to buy an account or level up your own? [Boosting](/category/boosting) upgrades the account you already play on instead.`,
};
