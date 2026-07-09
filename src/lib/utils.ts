import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function siteUrl(path = "") {
  // VERCEL_PROJECT_PRODUCTION_URL (host only, no protocol) is a server-side
  // safety net so canonicals/sitemap never point at localhost if
  // NEXT_PUBLIC_SITE_URL is missing from the deployment's env.
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return `${base}${path}`;
}

/**
 * Origin to use for Stripe redirect URLs. Prefers the request's own origin so
 * the buyer is returned to the exact domain they're on (production, a Vercel
 * preview, etc.) — keeping their session cookies intact. Only trusts the
 * configured site host or *.vercel.app; otherwise falls back to siteUrl().
 */
export function originFromRequest(req: Request): string {
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      const host = new URL(origin).host;
      let configuredHost = "";
      try {
        configuredHost = new URL(siteUrl()).host;
      } catch {
        // ignore
      }
      if (host === configuredHost || host.endsWith(".vercel.app")) {
        return origin.replace(/\/$/, "");
      }
    } catch {
      // ignore malformed origin
    }
  }
  return siteUrl();
}

export function truncate(text: string, length: number) {
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}

/**
 * Meta-description truncation: collapses whitespace and cuts at a word
 * boundary instead of mid-word ("…trusted by thousa" reads as broken copy in
 * the SERP and Semrush flags it). No ellipsis — search engines add their own.
 */
export function metaText(text: string, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut.slice(0, max)).replace(
    /[,;:\s]+$/,
    ""
  );
}

/**
 * Estimated reading time in whole minutes (220 wpm, min 1). Single source of
 * truth — the blog post page and the admin markdown editor must agree.
 */
export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/**
 * Cleans a user search term before it's interpolated into a PostgREST `.or()`
 * / `.ilike()` filter. Commas and parentheses are the OR-list separators and
 * grouping tokens in PostgREST, so an un-stripped comma silently breaks the
 * whole filter (→ "no results"); `%` and `_` are ilike wildcards, and `\` is
 * the escape char. We drop all of them and cap the length.
 */
export function sanitizeSearchTerm(input: string, max = 80) {
  return input
    .replace(/[,()\\%_*:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/**
 * Sanitises a post-auth `next` redirect target so it can only ever point at a
 * path on this site — never an absolute URL to an attacker-controlled host
 * (open-redirect / phishing). Anything that isn't a single-slash-prefixed
 * relative path falls back to the home page.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/") {
  if (!next) return fallback;
  // Must start with exactly one "/" (rejects "//evil.com" and "/\evil.com")
  // and must not smuggle a scheme or backslash.
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  if (next.includes("://") || next.includes("\\")) return fallback;
  return next;
}
