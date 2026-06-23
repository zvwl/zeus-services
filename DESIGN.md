# Zeuservices — Design System & UI Direction

> Design brief for redesigning the Zeuservices storefront UI to be more modern, polished, and fully responsive — **while keeping the established "electric glass" brand language**. Evolve and elevate; do not reinvent the brand.

---

## 1. What Zeuservices is

A premium **gaming-services marketplace**. Customers buy:
- **Top-ups** — in-game currency (e.g. V-Bucks, Robux, Riot Points)
- **Boosting** — rank/level boosting services (often with custom inputs like "Current rank", "Riot ID", credentials)
- **Accounts** — pre-made game accounts

It also runs **giveaways**, a **blog**, **customer reviews**, **donations** ("buy us a coffee"), a **support/ticket center**, and a full **customer account area** (orders, 2FA security, settings). Payments are via Stripe; multi-currency (USD/EUR/GBP/CAD/AUD).

**Audience:** gamers roughly 16–30, **majority on mobile**. They expect speed, trust, and a storefront that feels as premium as the games they play.

**Brand name:** always written as **"Zeuservices"** — one word, capital Z. Never "Zeus Services" or "ZeuServices".

---

## 2. Brand personality & mood

**"Electric glass."** A cinematic, near-black dark theme charged with **Zeus / lightning energy**. The feeling sits at the intersection of:
- **Stripe-grade polish** — restrained, trustworthy, precise spacing, no clutter.
- **Premium gaming storefront** — energetic, a little dramatic, with glow and motion (think a high-end Fortnite/Valorant shop, not a cheap reseller site).

| Should feel | Should NOT feel |
|---|---|
| Premium, sleek, confident | Cheap, busy, "gamer RGB chaos" |
| Fast, frictionless | Cluttered, heavy, slow |
| Trustworthy (real payments, real accounts) | Sketchy, spammy |
| Energetic, alive (subtle glow + motion) | Static and flat, OR overstimulating |

Motifs: ⚡ lightning bolt, subtle radial "energy" glows, glassmorphic surfaces floating over a dark gradient.

---

## 3. Design principles

1. **Mobile-first, fully responsive.** Every screen must reflow gracefully from a 360px phone to a 1440px+ desktop. This is the #1 goal of the redesign.
2. **Depth through light, not borders.** Use soft violet glows, layered translucent surfaces, and gentle gradients to create hierarchy — not heavy lines or boxes.
3. **Generous breathing room.** More whitespace, clearer hierarchy, fewer cramped grids. Let products and CTAs stand out.
4. **One clear action per view.** Each screen has an obvious primary CTA (Buy, Sign in, Enter giveaway). De-emphasize everything secondary.
5. **Consistent, reusable components.** Reuse the component kit below everywhere — buttons, badges, glass cards, inputs — so the experience feels like one cohesive product.
6. **Motion with purpose.** Subtle fade-up on entrance, smooth hover/press states, glow on focus. Never gratuitous animation.

---

## 4. Color tokens (exact — keep these)

These are the live Tailwind tokens. Build the design on them so it maps directly back to code.

### Surfaces (dark, near-black, layered)
| Token | Hex | Use |
|---|---|---|
| `bg` | `#07070e` | Page background (almost black, slight blue-violet) |
| `surface` | `#0c0c16` | Card / panel base |
| `raised` | `#12121f` | Inputs, raised elements, hover fills |
| `edge` | `#1e1e30` | Borders / hairlines |

The page background also carries two soft radial glows: a violet glow top-center and a faint gold glow top-right (see §7).

### Brand
| Token | Hex | Use |
|---|---|---|
| `primary` | `#8b5cf6` | Primary actions, links, focus, active state (violet) |
| `primary-dark` | `#7c3aed` | Primary hover/pressed |
| `primary-light` | `#a78bfa` | Eyebrows, accents on dark, link hover |
| `gold` | `#fbbf24` | Prestige accent: VIP, giveaways, ratings, premium highlights — **use sparingly** |

### Text (zinc scale on dark)
| Use | Color |
|---|---|
| Headings / emphasis | `white` / `zinc-100` |
| Body | `zinc-300` |
| Muted / secondary | `zinc-400` |
| Disabled / hint | `zinc-500` / `zinc-600` |

### Semantic (status)
| Status | Style |
|---|---|
| success (`completed`, `paid`, `answered`) | emerald — `bg-emerald-500/15 text-emerald-300 border-emerald-500/30` |
| info (`processing`, `open`) | sky — `bg-sky-500/10 text-sky-300 border-sky-500/30` |
| warning (`pending`) | amber — `bg-amber-500/10 text-amber-300 border-amber-500/30` |
| danger (`cancelled`, `refunded`, `closed`) | red — `bg-red-500/10 text-red-300 border-red-500/30` |

### Signature gradients
- **Text gradient (violet):** `from-violet-400 via-#8b5cf6 to-fuchsia-400`, clipped to text — for hero headlines & key words.
- **Text gradient (gold):** `from-amber-200 via-#fbbf24 to-amber-500` — for giveaway/VIP/prestige headlines.
- **Gold button:** `from-amber-400 to-amber-500`, dark text — high-emphasis prestige CTA.

---

## 5. Typography

- **Font:** Inter (system sans fallback). One family, everything.
- **Scale:** Display/hero `text-5xl`–`text-6xl` bold; section H2 `text-3xl`/`text-4xl` bold; H3 `text-xl`; body `text-sm`/`text-base`; captions/labels `text-xs`.
- **Eyebrows:** small, `uppercase tracking-widest`, `primary-light` color, above section titles.
- **Headings** are white & bold; **body** is `zinc-300`–`zinc-400` and relaxed leading.
- Hero headlines may use the violet text-gradient on one keyword for emphasis.

---

## 6. Spacing, radius, elevation

- **Radius:** generous and soft. Cards `rounded-2xl` (16px), buttons/inputs `rounded-xl` (12px), small chips/badges `rounded-full`, small buttons `rounded-lg`.
- **Spacing scale:** Tailwind default (4px base). Sections get vertical rhythm of ~`py-16` to `py-24` on desktop, tighter on mobile. Cards use `p-6`.
- **Containers:** centered max-width (~`max-w-7xl`) with comfortable side padding (`px-4` mobile → `px-8` desktop).
- **Elevation = glow, not drop shadow.** Use the violet glow shadows:
  - `glow`: `0 0 40px -8px rgba(139,92,246,0.45)`
  - `glow-sm`: `0 0 24px -6px rgba(139,92,246,0.35)`
  - `glow-gold`: `0 0 32px -8px rgba(251,191,36,0.4)`

---

## 7. Surfaces & glassmorphism

- **`.glass` card** = `rounded-2xl border border-edge bg-surface/80 backdrop-blur-sm`. This is the workhorse surface: translucent dark panel, hairline edge, subtle blur. Use it for product cards, panels, modals, the buy box, etc.
- **Page background** is `#07070e` with two baked-in radial glows:
  - Violet: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139,92,246,0.13), transparent)`
  - Gold (faint): `radial-gradient(ellipse 60% 40% at 90% 10%, rgba(251,191,36,0.05), transparent)`
- **Custom scrollbar**, smooth scroll, violet text-selection (`bg-primary/40`).
- Cards on hover: lift subtly + intensify glow + border shifts toward `primary/50`.

---

## 8. Component kit (reuse everywhere)

### Buttons (`variant` × `size`)
| Variant | Style |
|---|---|
| **primary** | solid violet `#8b5cf6`, white text, `glow-sm` → `glow` on hover. Default CTA. |
| **gold** | amber gradient, near-black text, gold glow. Prestige/featured CTA (donate, VIP, enter giveaway). |
| **outline** | translucent raised fill, `edge` border → `primary/50` on hover. Secondary. |
| **ghost** | transparent, fills `raised` on hover. Tertiary / nav. |
| **danger** | translucent red. Destructive. |
| **success** | translucent emerald. Positive confirm. |

Sizes: `sm` (px-3 py-1.5, rounded-lg), `md` (px-4 py-2.5, rounded-xl), `lg` (px-6 py-3, rounded-xl). All buttons: `inline-flex items-center gap-2`, support a leading icon, smooth `transition-all`, dim+lock when disabled.

### Badges / chips
Pill, `rounded-full border px-2.5 py-0.5 text-xs`. Variants: default (zinc), primary (violet), gold, success, warning, danger, info. Used for status, tags, "Instant delivery", "Verified buyer", "VIP", stock.

### Inputs
`.input` = `rounded-xl border border-edge bg-raised px-4 py-2.5 text-sm`, placeholder `zinc-500`, focus → `border-primary/60` + `ring-2 ring-primary/20`. Labels (`.label`) = small `zinc-400` above the field.

### Other primitives
- **Stars** — 5-star rating, amber filled / `zinc-700` empty.
- **Spinner** — violet, spinning.
- **EmptyState** — glass panel, centered icon + title + description + action; used when a list is empty.
- **SectionHeading** — optional violet eyebrow, big bold white title, muted subtitle; can be centered.
- **Icons** — `lucide-react`, thin/consistent stroke, sized to text.

---

## 9. Motion

- **Entrance:** `fade-up` (opacity 0 + translateY 12px → settled) over ~0.5s, staggered for grids.
- **Shimmer:** for loading skeletons / highlight sweeps (3s linear loop).
- **Hover/press:** buttons brighten + glow; cards lift + glow; links shift to `violet-300`.
- **Focus:** always a visible violet ring (`ring-primary/20`) for accessibility.
- Keep it subtle and fast (150–300ms transitions). Respect `prefers-reduced-motion`.

---

## 10. Responsive rules (critical)

Mobile-first. Tailwind breakpoints: `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.

- **Navbar:** full horizontal nav + "More" dropdown + currency switcher + user menu on desktop → condensed bar with **hamburger drawer** on mobile. Sticky top. Announcement bar above it (dismissible).
- **Product / game grids:** 1 col (mobile) → 2 (sm) → 3 (lg) → 4 (xl). Consistent card aspect ratios.
- **Product detail:** two-column on desktop (media left, sticky **BuyBox** right) → single stacked column on mobile, with the **BuyBox as a sticky bottom action bar** (price + Buy) on small screens.
- **Account / admin:** sidebar nav on desktop → top tab bar or drawer on mobile. Tables become stacked cards on mobile (never horizontal-scroll a wide table).
- **Hero:** large split layout on desktop → centered, stacked, shorter on mobile.
- Touch targets ≥ 44px. No hover-only interactions. Text remains legible (min ~14px body).

---

## 11. Accessibility

- Maintain AA contrast on the dark theme (white/zinc-300 text on near-black passes; check muted `zinc-500` on `surface`).
- Visible focus rings everywhere (violet).
- Semantic headings, labelled inputs, `aria-label` on icon-only buttons, alt text on imagery.
- Don't rely on color alone for status — pair with text/icon.

---

## 12. Screens to design (priority order)

**Tier 1 — storefront core**
1. **Homepage** — sticky nav + announcement bar; hero (gradient headline + lightning energy + primary CTA + trust signals); category tiles (Top-Ups / Boosting / Accounts); featured products grid; popular games grid; stats band (orders, customers, rating); reviews strip; giveaway banner (gold); Discord CTA; FAQ accordion; footer.
2. **Category / listing page** — title + game filter pills + responsive product grid + empty state.
3. **Game detail** — banner hero (game art + gradient overlay) + products grouped by category.
4. **Product detail** — cover/media, trust badges (instant/manual delivery, Stripe-secured, 24/7 support), **BuyBox** (variant selector e.g. currency amounts, custom checkout fields, quantity stepper, live price, Buy CTA), markdown description, reviews (avg rating + 1–5 distribution bars + list), related products.
5. **Search results** — search field + results grid + empty state.
6. **Cart-less checkout result** — Stripe redirects out, so design the **order success / confirmation** page (order ref, items, delivered payloads/credentials, "processing" note for manual delivery) and the **cancelled** page.

**Tier 2 — account & auth**
7. **Auth** — login (email/password, magic-link option, Discord + Google OAuth, **2FA TOTP challenge step**), signup (with email-verification confirmation state), forgot/reset password. Use a shared centered glass auth shell with logo.
8. **Account dashboard** — overview (profile card, lifetime spend, verified/Discord badges, recent orders), orders list, order detail (delivered items, masked credentials, "leave a review"), **security** (change password, 2FA enroll with QR, connected accounts), settings (username, avatar upload, preferred currency).

**Tier 3 — engagement**
9. **Giveaways** — list (active vs ended) + detail (live countdown, entry count, enter button states).
10. **Donate** — preset/custom amounts + name/message + public supporter wall.
11. **Support center** + **ticket thread** (FAQ/Discord/ticket cards; threaded messages staff vs customer).
12. **Blog** index + post, **Reviews wall** (avg + distribution + verified-buyer review form).
13. **Legal** (Terms/Privacy/Refunds) + **404 / error** (lightning-themed).

**Tier 4 — optional**
14. **Admin CMS** (sidebar dashboard with KPI cards + revenue chart, orders/products/customers tables-as-cards-on-mobile, forms). Lower priority — keep it functional and consistent with the kit; storefront polish matters most.

---

## 13. Imagery & illustration direction

- Product/game art is user-uploaded; design **graceful fallbacks**: when no image, use a deterministic dark gradient tile (violet→surface) with the title — never a broken image.
- Favor abstract energy/lightning textures and soft violet/gold glows for hero and banner backgrounds, kept subtle so they never fight the content.
- Keep imagery dark-friendly; overlay gradients on photos so text stays legible.

---

## 14. Summary for the generator

Modernize the Zeuservices storefront into a **sleek, premium, fully responsive dark "electric glass" UI**: near-black `#07070e` canvas with soft violet/gold radial glows, violet `#8b5cf6` primary actions, gold `#fbbf24` prestige accents used sparingly, glassmorphic `rounded-2xl` cards with hairline `#1e1e30` edges and violet glow on hover, Inter typography with bold white headings and `zinc-300/400` body, generous spacing, subtle fade-up motion, and a mobile-first layout that reflows beautifully on every screen. Trustworthy like Stripe, energetic like a premium game store — never cluttered or cheap.
