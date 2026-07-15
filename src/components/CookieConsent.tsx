"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Cookie } from "lucide-react";
import { GA_ID, analyticsEnabled, trackPageView } from "@/lib/analytics";

type Consent = "accepted" | "declined";
const COOKIE_NAME = "cookie_consent";

function writeConsent(value: Consent) {
  // Remember the choice for 6 months.
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${
    60 * 60 * 24 * 180
  }; samesite=lax; secure`;
}

// Best-effort: Consent Mode only stops future writes — a decline leaves any
// previously-set GA cookies in place. GA sets them on the apex domain, so
// expire with and without an explicit domain (none derivable on localhost).
function expireGaCookies() {
  try {
    const expire = "=; path=/; max-age=0";
    const labels = window.location.hostname.split(".");
    const apex = labels.length >= 2 ? labels.slice(-2).join(".") : null;
    for (const name of ["_ga", `_ga_${GA_ID.replace(/^G-/, "")}`]) {
      document.cookie = name + expire;
      if (apex) document.cookie = `${name}${expire}; domain=.${apex}`;
    }
  } catch {
    // Cleanup must never break the consent flow.
  }
}

export function CookieConsent({
  initialConsent = null,
}: {
  initialConsent?: Consent | null;
}) {
  const pathname = usePathname();
  // Seeded from the server-read cookie so the banner is in the first HTML
  // flush — the old mount-effect gate made it render-delayed by ~278KB of JS
  // and it was the LCP element on thin pages (14.1s lab LCP on /login).
  // Every route renders dynamically, so the server cookie and this initial
  // state always agree — no hydration mismatch.
  const [open, setOpen] = useState(initialConsent === null); // banner on first visit

  // Track client-side navigations (a cookieless ping while consent is denied
  // — Consent Mode governs storage, not whether events fire). The initial
  // document load is skipped: gtag('config') already sends the first
  // page_view, and the parse-time gtag stub means this effect's mount call
  // would now queue a duplicate (it used to no-op while gtag was undefined).
  const firstLoad = useRef(true);
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    trackPageView(pathname);
  }, [pathname]);

  const choose = useCallback((value: Consent) => {
    writeConsent(value);
    setOpen(false);
    // Consent Mode v2 upgrade/downgrade at the moment of choice. window.gtag
    // is guaranteed here — the inline script below defined it at parse time.
    window.gtag!("consent", "update", {
      analytics_storage: value === "accepted" ? "granted" : "denied",
    });
    if (value === "declined") expireGaCookies();
  }, []);

  // No analytics configured → nothing to consent to.
  if (!analyticsEnabled) return null;

  return (
    <>
      {/* Consent Mode v2: the tag ALWAYS loads, but with storage denied by
          default — GA runs cookieless until the visitor accepts. (The old
          load-after-accept gating made the tag invisible to Google's
          detection and dropped every non-accepting visitor from
          measurement.) Ordering guarantee: the consent DEFAULT is a plain
          SSR'd inline script that executes synchronously during HTML parse,
          so a consent UPDATE (click handler, necessarily post-hydration) can
          never precede it. js/config queue lazyOnload, and gtag.js processes
          dataLayer in order — updates pushed before config are honored when
          config runs. React never re-executes dangerouslySetInnerHTML on
          re-render, so the default can't fire twice. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "window.dataLayer=window.dataLayer||[];" +
            "window.gtag=window.gtag||function(){dataLayer.push(arguments);};" +
            `window.gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'${
              initialConsent === "accepted" ? "granted" : "denied"
            }'});`,
        }}
      />
      <Script id="ga-config" strategy="lazyOnload">
        {`window.gtag('js',new Date());
window.gtag('config','${GA_ID}',{anonymize_ip:true});`}
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
