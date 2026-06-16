import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { getRates, getSettings, setting } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = setting(settings, "site_name", "Zeus Services");
  const tagline = setting(
    settings,
    "tagline",
    "Premium game top-ups, boosting and accounts."
  );
  return {
    title: { default: `${siteName} — Game Top-Ups, Boosting & Accounts`, template: `%s — ${siteName}` },
    description: tagline,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [rates, cookieStore] = await Promise.all([getRates(), cookies()]);
  const initialCurrency = cookieStore.get("currency")?.value ?? "USD";

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
        <CurrencyProvider initial={initialCurrency} rates={rates}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieConsent />
        </CurrencyProvider>
      </body>
    </html>
  );
}
