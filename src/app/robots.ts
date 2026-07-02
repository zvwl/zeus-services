import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  // Vercel previews / a separately-deployed dev site must never be crawled —
  // they would compete with the live domain as duplicate content. (Pages also
  // emit a noindex meta tag in this mode; see app/layout.tsx.)
  const isNoindexDeployment =
    (Boolean(process.env.VERCEL_ENV) &&
      process.env.VERCEL_ENV !== "production") ||
    process.env.NEXT_PUBLIC_NOINDEX === "1";
  if (isNoindexDeployment) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private/transient surfaces out of the index. /cart and /search
      // are deliberately NOT listed: they carry a noindex meta tag instead,
      // which Google can only see if crawling stays allowed.
      disallow: ["/admin", "/account", "/api/", "/auth/", "/checkout/"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
