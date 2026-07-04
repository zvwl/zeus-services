-- Zeuservices — richer hub-page content + an About page, for SEO depth.
--
-- 1. `intro` (long-form markdown) on categories and games so hub pages have real
--    content instead of a one-line blurb. Rendered under the heading; the short
--    `description` stays as the card subtitle.
-- 2. An editable About page in zeus.pages (slug 'about'), shown in Admin -> Pages
--    like Terms/Privacy/Refunds.

alter table zeus.categories add column if not exists intro text;
alter table zeus.games      add column if not exists intro text;

-- ── Category intros ─────────────────────────────────────────────────────────
update zeus.categories set intro = $md$Top-ups are the fastest way to get more out of your favourite games without paying full in-game price. At Zeuservices we top up **Fortnite V-Bucks** and **Rocket League Credits** directly to your account, with **GTA Online cash** available as a boosting service.

The reason our top-ups cost less is simple and we are happy to explain it: we buy in regions and currencies where game pricing is lower, and pass the saving on to you. There is no generator and no loophole to dress up — just regional pricing, handled at scale by people who do it every day.

Every order is delivered by hand by our team, typically within **10 minutes to 2 hours**, and you can track it live from your account the whole time. Checkout runs through Stripe in your choice of USD, EUR, GBP, CAD or AUD, and your card details never touch our servers.$md$
where slug = 'topups';

update zeus.categories set intro = $md$Skip the grind. Our boosting services put experienced players on the job so you can enjoy the parts of the game you actually care about — a higher **GTA Online** rank, the cash to buy what you want, or specific unlocks handled for you.

Boosting works by one of our team playing on your account **with the authorisation you give by placing the order**. We only ever access an account with the owner's explicit permission, we never touch anything unrelated to the service, and we recommend changing your password once the work is done. This is account piloting by experienced staff — nothing more.

Delivery is typically **10 minutes to 2 hours** and tracked live from your account. You can get a full refund any time before a boost starts; a boost cancelled part-way through is generally not refundable, with discretionary exceptions. Buying boosting can be against a game's terms of service — we are upfront about that trade-off and manage the risk carefully.$md$
where slug = 'boosting';

update zeus.categories set intro = $md$Ready-to-play accounts, delivered with full credentials so you can jump straight in. Our most popular account service is **GTA 5 modded accounts** — high-rank, cash-ready characters that save you weeks of grinding.

When you buy an account you receive the login details directly at handover. **You must change the email and password immediately** to secure it — cover is void if you do not.

Every account purchase includes **7 days of cover**: if the account is banned within 7 days of delivery, we provide a service on that account free of charge to make up for it. Because credentials are revealed on delivery, accounts are not refundable, but the 7-day cover applies instead. Using purchased or modded accounts can be against a game's terms of service; we do not pretend the risk is zero and reduce it through experience.$md$
where slug = 'accounts';

-- ── Game intros ─────────────────────────────────────────────────────────────
update zeus.games set intro = $md$Fortnite services from Zeuservices, delivered fast by an experienced team. Top up **V-Bucks** for the Battle Pass, the Crew subscription or that item-shop skin you have had your eye on — at a lower price than the in-game store.

Our V-Bucks cost less because we buy in regions where game pricing is lower and pass the saving on. Delivery is by hand, **with your authorisation**, typically within 10 minutes to 2 hours and tracked live from your account. Buying currency through a third party can be against Fortnite's terms of service; we are honest about that and deliver carefully. Zeuservices is not affiliated with Epic Games.$md$
where slug = 'fortnite';

update zeus.games set intro = $md$Everything for **GTA 5 and GTA Online**, in one place. Get a cash boost delivered to your character, level up your rank and unlocks without the grind, or pick up a ready-to-play modded account — all handled by staff who do this every day.

Cash and boosting are delivered by our team playing on your account **with the authorisation you give by ordering**; modded accounts arrive with full credentials you secure at handover (7-day cover applies). Delivery is typically 10 minutes to 2 hours, tracked live. **GTA 6 services are planned for launch** (currently slated for November 2026). Using third-party services can be against Rockstar's terms of service — we are upfront about that. Not affiliated with Rockstar Games or Take-Two Interactive.$md$
where slug = 'gta-5';

update zeus.games set intro = $md$Cheap **Rocket League Credits**, topped up straight to your account by the Zeuservices team. Use them on the item shop, Rocket Pass Premium, blueprints and trading — without paying full in-game price.

Our Credits cost less thanks to regional pricing: we buy where game pricing is lower and pass the saving on. Delivery is by hand, **with your authorisation**, typically within 10 minutes to 2 hours and tracked live from your account. Buying currency through a third party can be against the game's terms of service; we deliver carefully and are honest about the trade-off. Not affiliated with Psyonix or Epic Games.$md$
where slug = 'rocket-league';

-- ── About page ──────────────────────────────────────────────────────────────
insert into zeus.pages (slug, title, content)
values ('about', 'About Zeuservices', $md$Zeuservices is a game-services store: cheap top-ups, professional boosting and ready-to-play accounts for the games people actually play. We are run by a private individual based in the **United Kingdom**, we sell **worldwide**, and we have served **thousands of gamers over more than a year** of trading.

## What we sell

- **GTA 5 & GTA Online** — cash drops, rank and unlock boosting, and modded accounts (our biggest service).
- **Fortnite** — V-Bucks top-ups.
- **Rocket League** — Credits top-ups.

**GTA 6 services are planned for launch**, currently slated for November 2026, though release dates can always shift.

## Why we are cheaper

There is no trick here, and we will not dress one up. Our prices are lower because we make purchases in **regions and currencies where game pricing is lower** and pass the savings on to you. That is the whole model — the same regional-pricing lever anyone can see, handled at scale by people who do it every day.

## How we deliver

Most orders are delivered by one of our experienced staff accessing your account **with the authorisation you give by placing the order**, and delivering directly. We only ever access an account with the owner's explicit permission, we never attempt to access accounts we are not authorised to use, and we never touch anything unrelated to the service you ordered. We recommend changing your password once delivery is complete.

Delivery typically takes **10 minutes to 2 hours** depending on availability and how busy the team is, and you can track your order live from your account the whole time.

## Being honest about risk

Buying game currency, boosting or accounts through a third party can be against a game's terms of service. We will not pretend the risk is zero — any store that does is waving a red flag. What we can honestly say is that we reduce the risk through experience and careful delivery, and that we are upfront about the trade-off rather than dismissive of it.

## Payments, refunds and cover

Checkout runs through **Stripe** — cards, Apple Pay and Google Pay, in USD, EUR, GBP, CAD or AUD — and your card details never touch our servers. You can get a **full refund any time before delivery starts**; once a digital order has been delivered it is not refundable. Purchased accounts come with **7 days of cover** instead: banned within 7 days, and you get a free service on that account. Full details are on our [refund policy](/refunds).

## Talk to us

Questions before or after ordering are always welcome. Open a [support ticket](/support) or join us on [Discord](https://discord.gg/uGDuujHsBW) — you can also find us on [TikTok](https://www.tiktok.com/@zxzeusxzz). Our [verified customer reviews](/reviews) are public.

Zeuservices is not affiliated with Epic Games, Rockstar Games, Take-Two Interactive, Psyonix or any other publisher. All trademarks belong to their respective owners.$md$)
on conflict (slug) do nothing;
