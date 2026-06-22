import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private/transient surfaces out of the index.
      disallow: ["/admin", "/account", "/api/", "/auth/", "/checkout/"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
