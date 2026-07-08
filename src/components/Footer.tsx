import Link from "next/link";
import Image from "next/image";
import { Zap } from "lucide-react";
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
  // that are actually set.
  const socials = [
    {
      label: "Discord",
      href: discord,
      path: "M20.32 4.37a19.8 19.8 0 0 0-4.93-1.51 13.8 13.8 0 0 0-.64 1.28 18.3 18.3 0 0 0-5.5 0 13.8 13.8 0 0 0-.64-1.28c-1.71.29-3.37.8-4.93 1.51A20.3 20.3 0 0 0 .1 18.06a19.9 19.9 0 0 0 6.07 3.03c.49-.66.93-1.37 1.3-2.1a12.9 12.9 0 0 1-2.05-.98c.17-.12.34-.25.5-.38a14.2 14.2 0 0 0 12.16 0c.17.13.33.26.5.38-.65.39-1.34.72-2.05.98.37.73.81 1.44 1.3 2.1a19.9 19.9 0 0 0 6.07-3.03 20.3 20.3 0 0 0-3.58-13.69ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.95-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Zm7.96 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.95-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Z",
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
                  loading="lazy"
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
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
                  <path d={s.path} />
                </svg>
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
