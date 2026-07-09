"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Trustpilot?: {
      loadFromElement: (el: HTMLElement, force?: boolean) => void;
    };
  }
}

/**
 * Trustpilot TrustBox embed. Renders nothing useful until the bootstrap script
 * initialises it; the fallback link inside keeps it accessible (and is what
 * crawlers see). Requires widget.trustpilot.com in the CSP (next.config.mjs).
 */
export function TrustBox({
  businessUnitId,
  templateId,
  height,
  token,
  className,
}: {
  businessUnitId: string;
  templateId: string;
  height: string;
  /** data-token from the embed snippet — the Review Collector includes one. */
  token?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    // The widget lives in the footer on most pages — don't pay for Trustpilot's
    // bootstrap (script + iframe) until the box is near the viewport. The
    // SSR'd fallback link below is what crawlers see either way.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLoad(true);
          observer.disconnect();
          // The bootstrap script scans the DOM once on load; widgets mounted
          // after a client-side navigation need an explicit kick.
          if (window.Trustpilot && ref.current) {
            window.Trustpilot.loadFromElement(ref.current, true);
          }
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {load && (
        <Script
          src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
          strategy="lazyOnload"
        />
      )}
      <div
        ref={ref}
        className={cn("trustpilot-widget", className)}
        data-locale="en-GB"
        data-template-id={templateId}
        data-businessunit-id={businessUnitId}
        data-style-height={height}
        data-style-width="100%"
        data-theme="dark"
        {...(token ? { "data-token": token } : {})}
      >
        <a
          href="https://uk.trustpilot.com/review/zeuservices.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zinc-500 transition hover:text-primary-light"
        >
          Review us on Trustpilot
        </a>
      </div>
    </>
  );
}
