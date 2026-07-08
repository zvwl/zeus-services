import { createPublicClient } from "@/lib/supabase/public";
import { siteUrl } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";

// RSS is a cheap discovery/recrawl signal — regenerate at most hourly.
export const revalidate = 3600;

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export async function GET() {
  const base = siteUrl();
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("title, slug, excerpt, content, published_at, created_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(30);
  const posts = (data as Pick<
    BlogPost,
    "title" | "slug" | "excerpt" | "content" | "published_at" | "created_at"
  >[]) ?? [];

  const items = posts
    .map((p) => {
      const url = `${base}/blog/${p.slug}`;
      const date = new Date(p.published_at ?? p.created_at).toUTCString();
      const summary = (p.excerpt || p.content || "")
        .replace(/[#*_~>`[\]()]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 300);
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${date}</pubDate>
      <description>${escapeXml(summary)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Zeuservices Blog</title>
    <link>${base}/blog</link>
    <atom:link href="${base}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Guides, tips and news on game top-ups, boosting and accounts.</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
