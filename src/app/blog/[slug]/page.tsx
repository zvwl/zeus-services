import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostPageData } from "@/lib/data";
import { ArrowLeft, Clock } from "lucide-react";
import { CoverImage } from "@/components/cards";
import { Badge } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/motion";
import { formatDate, readingTime, siteUrl } from "@/lib/utils";

// No cookies are read here, so the page renders statically and revalidates —
// crawls stop paying a full DB-bound render per hit.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Same cached unit the page body uses — no extra query.
  const data = await getBlogPostPageData(slug);
  if (!data) return { title: "Post not found" };
  const { post } = data;
  const title = post.meta_title || post.title;
  const description =
    post.meta_description ||
    (post.excerpt || post.content || "")
      .replace(/[#*_~>`[\]()]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${post.slug}`,
      ...(post.published_at ? { publishedTime: post.published_at } : {}),
      images: post.image_url ? [{ url: post.image_url }] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getBlogPostPageData(slug);
  if (!data) notFound();
  const { post, pool } = data;

  // Related posts: newest others sharing a tag, padded with newest overall —
  // guides should pass equity to each other instead of dead-ending.
  const shared = pool.filter((p) =>
    p.tags?.some((t) => post.tags?.includes(t))
  );
  const related = [
    ...shared,
    ...pool.filter((p) => !shared.includes(p)),
  ].slice(0, 3);

  const base = siteUrl();
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    ...(post.image_url ? { image: post.image_url } : {}),
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at ?? post.published_at ?? post.created_at,
    author: { "@type": "Person", name: post.author?.username ?? "Zeus Team" },
    publisher: {
      "@type": "Organization",
      name: "Zeuservices",
      url: base,
    },
    ...(post.excerpt ? { description: post.excerpt } : {}),
    mainEntityOfPage: `${base}/blog/${post.slug}`,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${base}/blog` },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${base}/blog/${post.slug}`,
      },
    ],
  };

  const readMins = readingTime(post.content ?? "");

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <Reveal y={14}>
        <Link
          href="/blog"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-zinc-500 transition hover:text-primary-light sm:min-h-0"
        >
          <ArrowLeft className="h-4 w-4" /> All posts
        </Link>
        <div className="mt-6 flex flex-wrap gap-1.5">
          {post.tags?.map((t) => (
            <Link key={t} href={`/blog/tag/${encodeURIComponent(t)}`}>
              <Badge variant="primary">{t}</Badge>
            </Link>
          ))}
        </div>
        <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
          <span>By {post.author?.username ?? "Zeus Team"}</span>
          <span aria-hidden>·</span>
          <span>{formatDate(post.published_at ?? post.created_at)}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {readMins} min read
          </span>
        </p>
      </Reveal>
      {/* Priority cover = LCP candidate — never inside a framer <Reveal>
          (it would SSR at opacity:0 until hydration); paint immediately. */}
      <CoverImage
        src={post.image_url || "/media/blog-cover.webp"}
        alt={post.title}
        fallbackText={post.title}
        className="mt-8 aspect-[16/8] w-full rounded-2xl border border-edge"
        sizes="(max-width: 768px) 100vw, 768px"
        priority
      />
      <div className="mt-10">
        <Markdown>{post.content}</Markdown>
      </div>

      {related.length > 0 && (
        <aside className="mt-14 border-t border-edge pt-10">
          <h2 className="mb-6 text-xl font-bold text-white">Keep reading</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {related.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group glass flex h-full flex-col overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:border-primary/50"
              >
                <CoverImage
                  src={p.image_url || "/media/blog-cover.webp"}
                  alt={p.title}
                  fallbackText={p.title}
                  className="aspect-[16/9] w-full"
                />
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-sm font-bold leading-snug text-white transition group-hover:text-primary-light">
                    {p.title}
                  </h3>
                  <p className="mt-auto pt-3 text-xs text-zinc-600">
                    {formatDate(p.published_at ?? p.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      )}
    </article>
  );
}
