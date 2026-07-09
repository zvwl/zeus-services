"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Cookie } from "lucide-react";
import { GA_ID, analyticsEnabled, trackPageView } from "@/lib/analytics";

type Consent = "accepted" | "declined";
const COOKIE_NAME = "cookie_consent";

function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )cookie_consent=([^;]+)/);
  const value = match ? decodeURIComponent(match[1]) : null;
  return value === "accepted" || value === "declined" ? value : null;
}

function writeConsent(value: Consent) {
  // Remember the choice for 6 months.
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${
    60 * 60 * 24 * 180
  }; samesite=lax`;
}

export function CookieConsent() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<Consent | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = readConsent();
    setConsent(current);
    setOpen(current === null); // show the banner on first visit
    setMounted(true);
  }, []);

  // Track client-side navigations (a cookieless ping while consent is denied
  // — Consent Mode governs storage, not whether events fire).
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  const choose = useCallback((value: Consent) => {
    writeConsent(value);
    setConsent(value);
    setOpen(false);
    // Consent Mode v2 upgrade/downgrade at the moment of choice.
    window.gtag?.("consent", "update", {
      analytics_storage: value === "accepted" ? "granted" : "denied",
    });
  }, []);

  // No analytics configured → nothing to consent to.
  if (!mounted || !analyticsEnabled) return null;

  return (
    <>
      {/* Consent Mode v2: the tag ALWAYS loads, but with storage denied by
          default — GA runs cookieless until the visitor accepts. (The old
          load-after-accept gating made the tag invisible to Google's
          detection and dropped every non-accepting visitor from
          measurement.) The inline block must queue the consent default
          BEFORE config; dataLayer preserves command order even if gtag.js
          finishes loading first. */}
      <Script id="ga-init" strategy="lazyOnload">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=window.gtag||gtag;
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'${
          consent === "accepted" ? "granted" : "denied"
        }'});
gtag('js',new Date());
gtag('config','${GA_ID}',{anonymize_ip:true});`}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="lazyOnload"
      />

      {/* Floating cookie button to reopen/change the choice anytime. */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Cookie settings"
          className="fixed bottom-4 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-edge bg-surface/90 text-zinc-300 shadow-lg backdrop-blur transition hover:border-primary/50 hover:text-white"
        >
          <Cookie className="h-5 w-5" />
        </button>
      )}

      {/* Consent banner */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
          <div className="glass mx-auto flex max-w-3xl flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary-light" />
              <p className="text-sm text-zinc-300">
                We use cookies for analytics to see how the store is used and
                improve your experience.{" "}
                <a href="/privacy" className="text-primary-light hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => choose("declined")}
                className="rounded-xl border border-edge px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-raised"
              >
                Decline
              </button>
              <button
                onClick={() => choose("accepted")}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-glow-sm transition hover:bg-primary-dark"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
