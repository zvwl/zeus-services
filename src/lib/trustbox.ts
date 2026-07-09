/**
 * Standard Trustpilot TrustBox template ids (global constants, not per-account).
 *
 * Lives outside TrustBox.tsx on purpose: that file is "use client", and any
 * export imported from a client module by a Server Component (Footer, reviews
 * page) becomes an opaque client reference — reading .templateId off it
 * crashes the render.
 */
export const TRUSTBOX = {
  /** "Review us on Trustpilot" prompt — the right widget until reviews build up. */
  reviewCollector: { templateId: "56278e9abfbbba0bdcd568bc", height: "52px" },
  /** Compact "TrustScore x.x | n reviews" line — footer-friendly. */
  microReviewCount: { templateId: "5419b6a8b0d04a076446a9ad", height: "24px" },
} as const;
