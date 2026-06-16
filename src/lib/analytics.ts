// Lightweight Google Analytics 4 helpers. Completely inert until
// NEXT_PUBLIC_GA_ID is set AND the visitor has accepted analytics cookies
// (the CookieConsent component only injects gtag after consent).
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
export const analyticsEnabled = Boolean(GA_ID);

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Fire a GA4 event (no-op when analytics isn't loaded/consented). */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

/** Manual page_view for client-side (SPA) navigations. */
export function trackPageView(path: string) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "page_view", { page_path: path });
  }
}
