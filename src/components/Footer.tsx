import Link from "next/link";
import { Zap } from "lucide-react";
import { getCategories, getSettings, setting } from "@/lib/data";

export async function Footer() {
  const [categories, settings] = await Promise.all([
    getCategories(),
    getSettings(),
  ]);
  const siteName = setting(settings, "site_name", "Zeuservices");
  const discord = setting(settings, "discord_invite");
  const logoUrl = setting(settings, "logo_url");

  const columns: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
    {
      title: "Shop",
      links: [
        { label: "All games", href: "/games" },
        ...categories.map((c) => ({
          label: c.name,
          href: `/category/${c.slug}`,
        })),
      ],
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
        <div className="grid gap-10 md:grid-cols-6">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="h-10 w-auto max-w-[200px] object-contain"
                />
              ) : (
                <>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-600">
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
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <span>United Kingdom · Delivering worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
