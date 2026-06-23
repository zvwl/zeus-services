# ⚡ Zeuservices — Gaming Marketplace

A full-stack gaming storefront: **game top-ups, boosting services and accounts**, with Stripe payments, Supabase auth/database, Discord & Google login, multi-currency pricing, giveaways, donations, a support center and a complete admin CMS.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Auth + Storage) · Stripe Checkout · Vercel

---

## Features

### Storefront
- **Dynamic homepage** built from admin-managed sections (hero, stats, categories, featured products, games, reviews, giveaway banner, Discord CTA, FAQ, rich text)
- **Catalog**: games → categories (Top-Ups / Boosting / Accounts — extensible) → products with **variants** (e.g. V-Bucks amounts) and **custom checkout questions** (e.g. "Riot ID", "Current rank", credentials for boosting)
- **Multi-currency** (USD/EUR/GBP/CAD/AUD): switcher in the navbar, charges in the chosen currency via Stripe, admin-editable rates
- **Stripe Checkout** with server-side price validation, stock tracking, guest checkout, webhook fulfillment + success-page fallback (works even before the webhook fires)
- Instant vs. manual delivery, per-item delivery payloads visible in the customer's order history
- Blog (Markdown), verified-customer reviews with admin moderation/replies, FAQ, giveaways with countdown + random winner draw, "buy me a coffee" donations with public supporter wall, support tickets with threaded replies
- Search, legal pages (Terms / Privacy / Refunds), 404/error pages

### Accounts & security
- Email/password signup with **email verification**, plus **Discord** and **Google** OAuth (and account linking)
- **2FA (TOTP)** enroll/manage in Account → Security, enforced at login
- Password reset flow, profile settings (username, avatar upload, preferred currency)
- Banned users are blocked from checkout

### Admin panel (`/admin`)
- Role system: `customer` → `support` → `admin` → `super_admin`, stored in `zeus.profiles.role`
  - Protected by **RLS policies + a database trigger** — only super admins can change roles, even with direct API access
  - First signup matching `site_settings.bootstrap_admin_emails` automatically becomes super admin
- Dashboard: revenue chart (30d), orders, customers, open tickets, pending reviews, donations, audit log
- Manage: orders (status + manual delivery of items), products (variants, checkout questions, images, pricing, stock, featured), games, categories, customers (ban/unban), reviews (approve/feature/reply), blog, FAQs, giveaways (draw winner), support tickets (priority/status), donations
- **Layout editor**: add/reorder/toggle/edit homepage sections live
- Settings: branding, announcement bar, Discord invite, socials, exchange rates
- Team page (super admin only): promote/demote staff
- Image uploads to Supabase Storage (`zeus-assets` admin-only, `zeus-avatars` per-user)
- Every admin action is written to an audit log

---

## Architecture notes

- **All app tables live in the dedicated `zeus` Postgres schema** in the Supabase project, fully isolated from the pre-existing tables in `public` (an older app's data was found there and was intentionally left untouched). The schema is exposed through the Data API alongside `public`.
- All Supabase clients are created with `db: { schema: "zeus" }`.
- The SQL in `supabase/migrations/` is the source of truth and has already been applied to project `xdvbhungoadwlmeddelt`.
- Orders are created server-side with the service role; the client never sets prices.
- Sensitive checkout answers (e.g. boosting credentials) are only readable by the order's owner and staff (RLS).

## Environment variables

Copy `.env.example` → `.env.local` (local) and add the same in Vercel → Settings → Environment Variables:

| Variable | Required for | Where to find it |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | everything | Supabase → Project Settings → API (has a safe in-code fallback) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | everything | same (safe in-code fallback) |
| `SUPABASE_SERVICE_ROLE_KEY` | checkout, webhooks, stats | same page — **keep secret** |
| `STRIPE_SECRET_KEY` | payments | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | payment fulfillment | Stripe → Developers → Webhooks (endpoint: `/api/webhooks/stripe`) |
| `NEXT_PUBLIC_SITE_URL` | Stripe redirects | your deployed URL, no trailing slash |
| `DISCORD_WEBHOOK_URL` | optional staff notifications | Discord channel → Integrations → Webhooks |

## Going live — checklist

1. **Env vars** — add the table above to Vercel, then redeploy.
2. **Stripe webhook** — Stripe Dashboard → Developers → Webhooks → Add endpoint:
   `https://YOUR-DOMAIN/api/webhooks/stripe`, events: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
   (Until then, the success page confirms payments directly with Stripe as a fallback.)
3. **Auth URLs** — Supabase → Authentication → URL Configuration: set Site URL to your domain and add `https://YOUR-DOMAIN/auth/callback` to Redirect URLs.
4. **Discord login** — [Discord Developer Portal](https://discord.com/developers/applications) → New application → OAuth2: copy Client ID/Secret into Supabase → Authentication → Providers → Discord, and add the Supabase callback URL (`https://xdvbhungoadwlmeddelt.supabase.co/auth/v1/callback`) to Discord's redirect list.
5. **Google login** — [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth client (Web) → same idea, paste into Supabase → Providers → Google.
6. **Email verification** — Supabase → Authentication → Sign In / Up → enable "Confirm email" (recommended). For production email volume, configure custom SMTP under Authentication → Emails.
7. **Admin access** — sign in with `daniel.holecek20@gmail.com` (already promoted to super admin). Add more staff via Admin → Team.
8. **Branding** — Admin → Settings: set your Discord invite, announcement, socials; Admin → Layout to arrange the homepage; upload product/game images in their edit pages.

## Local development

```bash
npm install
npm run dev   # http://localhost:3000
```

## Project structure

```
src/
├── app/                  # routes (storefront, account, auth, admin, api)
│   ├── api/checkout      # Stripe Checkout session creation
│   ├── api/webhooks/stripe
│   ├── api/donate
│   ├── admin/            # full admin panel + server actions
│   └── account/          # customer dashboard, orders, settings, security
├── components/           # UI kit, cards, navbar, sections, admin forms
└── lib/                  # supabase clients, stripe, currency, auth, fulfillment
supabase/migrations/      # full schema, RLS, storage, seed (already applied)
```
