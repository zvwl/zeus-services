import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoverImage } from "@/components/cards";
import { Badge } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";

export const revalidate = 0;

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*, author:profiles(username, avatar_url)")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) notFound();
  const post = data as BlogPost;

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
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
      />
      <div className="mt-10">
        <Markdown>{post.content}</Markdown>
      </div>
    </article>
  );
}
