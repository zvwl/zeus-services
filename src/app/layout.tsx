import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { JsonLd } from "@/components/JsonLd";
import { getRates, getSettings, setting } from "@/lib/data";
import { siteUrl } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = setting(settings, "site_name", "Zeus Services");
  const tagline = setting(
    settings,
    "tagline",
    "Premium game top-ups, boosting and accounts."
  );
  const logoUrl = setting(settings, "logo_url");
  const title = `${siteName} — Game Top-Ups, Boosting & Accounts`;
  const ogImage = logoUrl || "/favicon.svg";
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s — ${siteName}` },
    description: tagline,
    applicationName: siteName,
    // Tab favicon: the admin logo when set, otherwise the default mark. Always
    // providing one stops the browser from requesting (and 404-ing) /favicon.ico.
    icons: { icon: logoUrl || "/favicon.svg" },
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName,
      title,
      description: tagline,
      url: "/",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: tagline,
      images: [ogImage],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [rates, settings, cookieStore] = await Promise.all([
    getRates(),
    getSettings(),
    cookies(),
  ]);
  const initialCurrency = cookieStore.get("currency")?.value ?? "USD";
  // Show a warning bar on any non-production (preview/dev) deployment.
  const isPreview =
    Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== "production";

  const siteName = setting(settings, "site_name", "Zeus Services");
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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
        <CurrencyProvider initial={initialCurrency} rates={rates}>
          {isPreview && (
            <div className="bg-amber-500 px-4 py-1.5 text-center text-xs font-bold tracking-wide text-black">
              ⚠️ STAGING / DEV PREVIEW — not the live site. Changes here are for
              testing only.
            </div>
          )}
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieConsent />
        </CurrencyProvider>
      </body>
    </html>
  );
}
