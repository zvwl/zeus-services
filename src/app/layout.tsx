import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { CartProvider } from "@/components/CartProvider";
import { CartDrawer } from "@/components/CartDrawer";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { JsonLd } from "@/components/JsonLd";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getRates, getSettings, setting } from "@/lib/data";
import { getUser } from "@/lib/auth";
import { siteUrl } from "@/lib/utils";

// Self-hosted via next/font: no render-blocking Google Fonts CSS request, no
// layout shift, and the woff2 files are served same-origin with the app.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Non-production surfaces (Vercel previews, or a separately-deployed dev site
// with NEXT_PUBLIC_NOINDEX=1) must never be indexed — they would compete with
// the live domain as duplicate content.
const isNoindexDeployment =
  (Boolean(process.env.VERCEL_ENV) &&
    process.env.VERCEL_ENV !== "production") ||
  process.env.NEXT_PUBLIC_NOINDEX === "1";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = setting(settings, "site_name", "Zeuservices");
  const tagline = setting(
    settings,
    "tagline",
    "Buy cheap game top-ups, boosting and accounts — fast, secure delivery."
  );
  const logoUrl = setting(settings, "logo_url");
  const title = `${siteName} — Game Top-Ups, Boosting & Accounts`;
  // Google Search Console verification token (Settings → URL prefix → HTML tag).
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s — ${siteName}` },
    description: tagline,
    applicationName: siteName,
    keywords: [
      "game top-ups",
      "cheap game top-ups",
      "buy V-Bucks",
      "cheap V-Bucks",
      "Fortnite V-Bucks",
      "Rocket League credits",
      "GTA Online cash",
      "GTA 5 modded accounts",
      "GTA Online boosting",
      "game boosting",
      "rank boosting service",
      "buy game accounts",
      "in-game currency",
      "gaming marketplace",
      siteName,
    ],
    // Tab favicon: the admin logo when set, otherwise the default mark. Always
    // providing one stops the browser from requesting (and 404-ing) /favicon.ico.
    icons: { icon: logoUrl || "/favicon.svg" },
    // No `alternates.canonical` here: layout metadata is inherited by every
    // page, so a canonical of "/" would declare all pages that don't override
    // it as duplicates of the homepage. Each page sets its own canonical.
    robots: isNoindexDeployment
      ? { index: false, follow: false }
      : { index: true, follow: true },
    // OpenGraph/Twitter images come from the dynamic opengraph-image.tsx route
    // (a real 1200×630 branded card) — far better than the old 32px favicon.
    // No og:url for the same reason as canonical above. Twitter title/
    // description are left unset so they resolve from each page's own metadata
    // instead of pinning the sitewide defaults on every page.
    openGraph: {
      type: "website",
      siteName,
      title,
      description: tagline,
    },
    twitter: {
      card: "summary_large_image",
    },
    ...(googleVerification
      ? { verification: { google: googleVerification } }
      : {}),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [rates, settings, cookieStore, user] = await Promise.all([
    getRates(),
    getSettings(),
    cookies(),
    getUser(),
  ]);
  const initialCurrency = cookieStore.get("currency")?.value ?? "USD";
  // Show a warning bar on any non-production (preview/dev) deployment.
  const isPreview =
    Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== "production";

  const siteName = setting(settings, "site_name", "Zeuservices");
  const logoUrl = setting(settings, "logo_url");
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl(),
    ...(logoUrl ? { logo: logoUrl } : {}),
    sameAs: [
      setting(settings, "discord_invite"),
      setting(settings, "twitter_url"),
      setting(settings, "youtube_url"),
      setting(settings, "tiktok_url"),
    ].filter(Boolean),
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl()}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
        <CurrencyProvider initial={initialCurrency} rates={rates}>
          <CartProvider authed={Boolean(user)}>
            {isPreview && (
              <div className="bg-amber-500 px-4 py-1.5 text-center text-xs font-bold tracking-wide text-black">
                STAGING / DEV PREVIEW — not the live site. Changes here are for
                testing only.
              </div>
            )}
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <CookieConsent />
            <CartDrawer />
          </CartProvider>
        </CurrencyProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
