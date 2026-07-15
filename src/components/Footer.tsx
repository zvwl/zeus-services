import Link from "next/link";
import Image from "next/image";
import { Zap } from "lucide-react";
import { DiscordIcon } from "@/components/ui";
import { getActiveGames, getCategories, getSettings, setting } from "@/lib/data";

export async function Footer() {
  const [games, categories, settings] = await Promise.all([
    getActiveGames(6),
    getCategories(),
    getSettings(),
  ]);
  const siteName = setting(settings, "site_name", "Zeuservices");
  const discord = setting(settings, "discord_invite");
  const logoUrl = setting(settings, "logo_url");

  // Social profiles are admin-managed (Admin → Settings); only render the ones
  // that are actually set. Discord renders via the shared sprite (SvgDefs);
  // the rest are one-off paths kept inline.
  const socials: { label: string; href: string; path?: string }[] = [
    {
      label: "Discord",
      href: discord,
    },
    {
      label: "X (Twitter)",
      href: setting(settings, "twitter_url"),
      path: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.4Z",
    },
    {
      label: "YouTube",
      href: setting(settings, "youtube_url"),
      path: "M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z",
    },
    {
      label: "TikTok",
      href: setting(settings, "tiktok_url"),
      path: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.9 2.9 0 0 1-5.2 1.74 2.9 2.9 0 0 1 2.31-4.64c.3 0 .58.05.85.13V9.4a6.33 6.33 0 0 0-.85-.05A6.34 6.34 0 1 0 15.86 15.7V9.01a8.16 8.16 0 0 0 4.77 1.52V7.07a4.85 4.85 0 0 1-1.04-.38Z",
    },
  ].filter((s) => Boolean(s.href));

  const columns: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
    {
      // Sitewide links to every game hub — crawlers and shoppers both need
      // more than one path into the money pages.
      title: "Games",
      links: [
        { label: "All games", href: "/games" },
        ...games.map((g) => ({
          label: g.name,
          href: `/games/${g.slug}`,
        })),
      ],
    },
    {
      title: "Shop",
      links: categories.map((c) => ({
        label: c.name,
        href: `/category/${c.slug}`,
      })),
    },
    {
      title: "Community",
      links: [
        ...(discord
          ? [{ label: "Discord server", href: discord, external: true }]
          : []),
        { label: "Giveaways", href: "/giveaways" },
        { label: "Discount codes", href: "/discount-codes" },
        { label: "Reviews", href: "/reviews" },
        { label: "Blog", href: "/blog" },
        { label: "Donate", href: "/donate" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "About us", href: "/about" },
        { label: "Help center", href: "/support" },
        { label: "FAQ", href: "/faq" },
        { label: "My orders", href: "/account/orders" },
        { label: "Account settings", href: "/account/settings" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Terms & Conditions", href: "/terms" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Refund Policy", href: "/refunds" },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-edge bg-surface/50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={siteName}
                  width={40}
                  height={40}
                  // Eager, not priority: on short pages (/support, /refunds)
                  // the footer is in the first viewport and this logo becomes
                  // the LCP element — lazy-loading it tanked LCP. `priority`
                  // would preload it on every page, hurting long pages where
                  // it's far below the fold.
                  loading="eager"
                  className="h-10 w-auto max-w-[200px] object-contain"
                />
              ) : (
                <>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-dark to-fuchsia-500">
                    <Zap className="h-5 w-5 text-white" fill="currentColor" />
                  </span>
                  <span className="text-lg font-bold text-white">{siteName}</span>
                </>
              )}
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">
              {setting(
                settings,
                "tagline",
                "Premium game top-ups, boosting and accounts — fast, safe and trusted by thousands of gamers."
              )}
            </p>
            <p className="mt-6 text-xs text-zinc-600">
              Payments secured by{" "}
              <span className="font-semibold text-zinc-400">Stripe</span> · We
              never store card details.
            </p>
            {/* Trust badges — one aligned row. */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {/* ScamAdviser seal — display terms require the logo to link to
                  our detail page. Logo self-hosted; rated "Very Likely Safe". */}
              <a
                href="https://www.scamadviser.com/check-website/zeuservices.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center rounded-lg bg-white/95 px-2.5 transition hover:bg-white"
                aria-label="Zeuservices is rated Very Likely Safe on ScamAdviser — view the report"
              >
                <Image
                  src="/media/scamadviser-seal.webp"
                  alt="Check zeuservices.com on ScamAdviser.com — rated Very Likely Safe"
                  width={156}
                  height={30}
                  // Eager for the same short-page-LCP reason as the logo above.
                  loading="eager"
                  className="h-[26px] w-auto"
                />
              </a>
              {setting(settings, "trustpilot_business_unit_id") && (
                // Native Trustpilot link badge, styled to match the
                // ScamAdviser chip. The official TrustBox iframe centers
                // itself and can't be aligned in a narrow column (and loaded
                // Trustpilot's script sitewide) — the real widget lives on
                // /reviews instead.
                <a
                  href="https://uk.trustpilot.com/review/zeuservices.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-white/95 px-2.5 transition hover:bg-white"
                  aria-label="Review Zeuservices on Trustpilot"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-[17px] w-[17px]"
                    fill="#00B67A"
                    aria-hidden
                  >
                    <path d="M12 1.5l3.09 6.26 6.91 1-5 4.87 1.18 6.88L12 17.27l-6.18 3.24L7 13.63l-5-4.87 6.91-1L12 1.5z" />
                  </svg>
                  <span className="text-[13px] font-semibold leading-none text-zinc-900">
                    Review us on Trustpilot
                  </span>
                </a>
              )}
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) =>
                  l.external ? (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-zinc-500 transition hover:text-primary-light"
                      >
                        {l.label}
                      </a>
                    </li>
                  ) : (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-zinc-500 transition hover:text-primary-light"
                      >
                        {l.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-edge pt-8 sm:flex-row">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} {siteName}. All rights reserved. Not
            affiliated with any game publisher.
          </p>
          <div className="flex items-center gap-5">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-zinc-600 transition hover:text-primary-light"
              >
                {s.path ? (
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
                    <path d={s.path} />
                  </svg>
                ) : (
                  <DiscordIcon className="h-[18px] w-[18px]" />
                )}
              </a>
            ))}
            <span className="text-xs text-zinc-600">
              United Kingdom · Delivering worldwide
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
