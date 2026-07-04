import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { CoverImage } from "@/components/cards";
import { Badge } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { JsonLd } from "@/components/JsonLd";
import { formatDate, siteUrl } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";

export const revalidate = 3600;

// Prebuild published posts at deploy + ISR-refresh; new slugs on-demand.
export async function generateStaticParams() {
  try {
    const { data } = await createPublicClient()
      .from("blog_posts")
      .select("slug")
      .eq("is_published", true);
    return (data ?? []).map((b: { slug: string }) => ({ slug: b.slug }));
  } catch {
    return [];
  }
}

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

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <JsonLd data={articleJsonLd} />
      <Link href="/blog" className="text-sm text-zinc-500 hover:text-primary-light">
        ← All posts
      </Link>
      <div className="mt-6 flex flex-wrap gap-1.5">
        {post.tags?.map((t) => (
          <Badge key={t} variant="primary">
            {t}
          </Badge>
        ))}
      </div>
      <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white">
        {post.title}
      </h1>
      <p className="mt-4 text-sm text-zinc-500">
        By {post.author?.username ?? "Zeus Team"} ·{" "}
        {formatDate(post.published_at ?? post.created_at)}
      </p>
      <CoverImage
        src={post.image_url}
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
