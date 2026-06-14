import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PostForm } from "@/components/admin/PostForm";
import type { BlogPost } from "@/lib/types";

export const revalidate = 0;

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let post: BlogPost | null = null;
  if (id !== "new") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!data) notFound();
    post = data as BlogPost;
  }

  return (
    <div className="max-w-3xl">
      <Link href="/admin/blog" className="text-sm text-zinc-500 hover:text-primary-light">
        ← All posts
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold text-white">
        {post ? "Edit post" : "New post"}
      </h1>
      <div className="mt-6">
        <PostForm post={post} />
      </div>
    </div>
  );
}
