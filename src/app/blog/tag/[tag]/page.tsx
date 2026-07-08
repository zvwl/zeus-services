import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { CoverImage } from "@/components/cards";
import { Badge, SectionHeading } from "@/components/ui";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";

// Static + revalidated: tag archives are topical hub pages for crawlers.
export const revalidate = 300;

const FALLBACK_COVER = "/media/blog-cover.webp";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const name = decodeURIComponent(tag);
  const title = `${name} — guides & news`;
  const description = `Every Zeuservices article tagged “${name}” — guides, tips and updates.`;
  return {
    title,
    description,
    alternates: { canonical: `/blog/tag/${encodeURIComponent(name)}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `/blog/tag/${encodeURIComponent(name)}`,
    },
  };
}

export default async function BlogTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const name = decodeURIComponent(tag);
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*, author:profiles(username, avatar_url)")
    .eq("is_published", true)
    .contains("tags", [name])
    .order("published_at", { ascending: false });

  const posts = (data as BlogPost[]) ?? [];
  // An empty tag archive is a soft-404 magnet — don't publish one.
  if (posts.length === 0) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <Reveal y={14}>
        <SectionHeading
          as="h1"
          eyebrow="Tag"
          title={name}
          subtitle={`${posts.length} ${posts.length === 1 ? "article" : "articles"} tagged “${name}”.`}
        />
      </Reveal>
      <RevealGroup className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
        {posts.map((post) => (
          <RevealItem key={post.id} className="h-full">
            <Link
              href={`/blog/${post.slug}`}
              className="group glass flex h-full flex-col overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow-sm"
            >
              <CoverImage
                src={post.image_url || FALLBACK_COVER}
                alt={post.title}
                fallbackText={post.title}
                className="aspect-[16/9] w-full"
              />
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {post.tags?.slice(0, 3).map((t) => (
                    <Badge key={t} variant="primary">
                      {t}
                    </Badge>
                  ))}
                </div>
                <h2 className="text-lg font-bold text-white transition group-hover:text-primary-light">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                    {post.excerpt}
                  </p>
                )}
                <p className="mt-auto pt-4 text-xs text-zinc-600">
                  {post.author?.username ?? "Zeus Team"} ·{" "}
                  {formatDate(post.published_at ?? post.created_at)}
                </p>
              </div>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
      <div className="mt-10">
        <Link
          href="/blog"
          className="text-sm text-zinc-400 transition hover:text-primary-light"
        >
          ← All posts
        </Link>
      </div>
    </div>
  );
}
