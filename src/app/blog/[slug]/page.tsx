import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { ArrowLeft, Clock } from "lucide-react";
import { CoverImage } from "@/components/cards";
import { Badge } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/motion";
import { formatDate, readingTime, siteUrl } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("title, slug, excerpt, content, image_url, published_at")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return { title: "Post not found" };
  const description = (data.excerpt || data.content || "")
    .replace(/[#*_~>`[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  return {
    title: data.title,
    description,
    alternates: { canonical: `/blog/${data.slug}` },
    openGraph: {
      type: "article",
      title: data.title,
      description,
      url: `/blog/${data.slug}`,
      ...(data.published_at ? { publishedTime: data.published_at } : {}),
      images: data.image_url ? [{ url: data.image_url }] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*, author:profiles(username, avatar_url)")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) notFound();
  const post = data as BlogPost;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    ...(post.image_url ? { image: post.image_url } : {}),
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at ?? post.published_at ?? post.created_at,
    author: { "@type": "Person", name: post.author?.username ?? "Zeus Team" },
    ...(post.excerpt ? { description: post.excerpt } : {}),
    mainEntityOfPage: `${siteUrl()}/blog/${post.slug}`,
  };

  const readMins = readingTime(post.content ?? "");

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <JsonLd data={articleJsonLd} />
      <Reveal y={14}>
        <Link
          href="/blog"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-zinc-500 transition hover:text-primary-light sm:min-h-0"
        >
          <ArrowLeft className="h-4 w-4" /> All posts
        </Link>
        <div className="mt-6 flex flex-wrap gap-1.5">
          {post.tags?.map((t) => (
            <Badge key={t} variant="primary">
              {t}
            </Badge>
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
    </article>
  );
}
