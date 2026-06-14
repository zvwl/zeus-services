import Link from "next/link";
import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CoverImage } from "@/components/cards";
import { Badge, EmptyState, SectionHeading } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";

export const metadata: Metadata = { title: "Blog" };
export const revalidate = 0;

export default async function BlogPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*, author:profiles(username, avatar_url)")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  const posts = (data as BlogPost[]) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHeading
        eyebrow="News & guides"
        title="The Zeus blog"
        subtitle="Game guides, platform updates, sales announcements and behind-the-scenes."
      />
      {posts.length === 0 ? (
        <EmptyState
          icon={<Newspaper className="h-10 w-10" />}
          title="No posts yet"
          description="Our first articles are coming soon."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group glass overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:border-primary/50"
            >
              <CoverImage
                src={post.image_url}
                alt={post.title}
                fallbackText={post.title}
                className="aspect-[16/9] w-full"
              />
              <div className="p-5">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {post.tags?.slice(0, 3).map((t) => (
                    <Badge key={t} variant="primary">
                      {t}
                    </Badge>
                  ))}
                </div>
                <h2 className="text-lg font-bold text-white group-hover:text-primary-light">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                    {post.excerpt}
                  </p>
                )}
                <p className="mt-4 text-xs text-zinc-600">
                  {post.author?.username ?? "Zeus Team"} ·{" "}
                  {formatDate(post.published_at ?? post.created_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
