import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink } from "@/components/ui";
import { ActionButton } from "@/components/admin/ActionControls";
import { deletePost } from "@/app/admin/actions";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";

export const revalidate = 0;

export default async function AdminBlogPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*, author:profiles(username)")
    .order("created_at", { ascending: false });
  const posts = (data as BlogPost[]) ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-white">Blog</h1>
        <ButtonLink href="/admin/blog/new">
          <Plus className="h-4 w-4" /> New post
        </ButtonLink>
      </div>

      <div className="glass mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {posts.map((p) => (
              <tr key={p.id} className="transition hover:bg-raised/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/blog/${p.id}`}
                    className="font-medium text-primary-light hover:underline"
                  >
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {p.author?.username ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={p.is_published ? "success" : "warning"}>
                    {p.is_published ? "published" : "draft"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {formatDate(p.published_at ?? p.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <ActionButton
                    action={deletePost}
                    fields={{ id: p.id }}
                    variant="danger"
                    confirmText={`Delete "${p.title}"?`}
                  >
                    Delete
                  </ActionButton>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  No posts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
