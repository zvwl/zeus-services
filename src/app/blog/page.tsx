import Link from "next/link";
import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { CoverImage } from "@/components/cards";
import { Badge, EmptyState, SectionHeading } from "@/components/ui";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides, tips and news on game top-ups, boosting and accounts from the Zeuservices team.",
  alternates: { canonical: "/blog" },
};
export const revalidate = 0;

// Higgsfield fallback art so posts without a cover never render as a plain
// gradient tile.
const FALLBACK_COVER = "/media/blog-cover.webp";

export default async function BlogPage() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*, author:profiles(username, avatar_url)")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  const posts = (data as BlogPost[]) ?? [];
  const [featured, ...rest] = posts;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <Reveal y={14}>
        <SectionHeading
          as="h1"
          eyebrow="News & guides"
          title="The Zeuservices blog"
          subtitle="Game guides, platform updates, sales announcements and behind-the-scenes."
        />
      </Reveal>
      {posts.length === 0 ? (
        <EmptyState
          icon={<Newspaper className="h-10 w-10" />}
          title="No posts yet"
          description="Our first articles are coming soon."
        />
      ) : (
        <>
          {/* Featured story — magazine-style lead with copy over veiled art.
              The priority cover is the LCP element, so it must NOT sit inside
              a framer <Reveal> (SSR at opacity:0 until hydration) — only the
              overlaid title/meta text animates in. */}
          <Link
            href={`/blog/${featured.slug}`}
            className="group relative block overflow-hidden rounded-2xl border border-edge transition duration-300 hover:border-primary/50 hover:shadow-glow-sm"
          >
            <CoverImage
              src={featured.image_url || FALLBACK_COVER}
              alt={featured.title}
              fallbackText={featured.title}
              className="aspect-[16/10] w-full sm:aspect-[21/9]"
              sizes="(max-width: 768px) 100vw, 1152px"
              priority
            />
            <div className="art-veil" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
              <Reveal y={18}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="gold">Latest</Badge>
                  {featured.tags?.slice(0, 3).map((t) => (
                    <Badge key={t} variant="primary">
                      {t}
                    </Badge>
                  ))}
                </div>
                <h2 className="mt-3 max-w-3xl text-2xl font-extrabold leading-tight text-white transition group-hover:text-primary-light sm:text-3xl">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-zinc-300">
                    {featured.excerpt}
                  </p>
                )}
                <p className="mt-3 text-xs text-zinc-400">
                  {featured.author?.username ?? "Zeus Team"} ·{" "}
                  {formatDate(featured.published_at ?? featured.created_at)}
                </p>
              </Reveal>
            </div>
          </Link>

          {rest.length > 0 && (
            <RevealGroup
              className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              stagger={0.07}
            >
              {rest.map((post) => (
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
          )}
        </>
      )}
    </div>
  );
}
