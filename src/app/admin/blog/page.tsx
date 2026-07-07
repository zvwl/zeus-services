import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink } from "@/components/ui";
import { ActionButton } from "@/components/admin/ActionControls";
import { AdminTable } from "@/components/admin/AdminTable";
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
        <div>
          <h1 className="text-2xl font-extrabold text-white">Blog</h1>
          <p className="mt-1 text-sm text-zinc-500">
            News, guides and updates. Drafts stay hidden until published.
          </p>
        </div>
        <ButtonLink href="/admin/blog/new">
          <Plus className="h-4 w-4" /> New post
        </ButtonLink>
      </div>

      <div className="mt-6">
        <AdminTable
          minWidth={640}
          empty="No posts yet — hit “New post” to write your first article."
          columns={[
            { header: "Title" },
            { header: "Author" },
            { header: "Status" },
            { header: "Date" },
            { header: "" },
          ]}
          rows={posts.map((p) => ({
            key: p.id,
            cells: [
              <Link
                key="title"
                href={`/admin/blog/${p.id}`}
                className="font-medium text-primary-light hover:underline"
              >
                {p.title}
              </Link>,
              <span key="author" className="text-zinc-400">
                {p.author?.username ?? "—"}
              </span>,
              <Badge key="status" variant={p.is_published ? "success" : "warning"}>
                {p.is_published ? "published" : "draft"}
              </Badge>,
              <span key="date" className="text-xs text-zinc-500">
                {formatDate(p.published_at ?? p.created_at)}
              </span>,
              <ActionButton
                key="delete"
                action={deletePost}
                fields={{ id: p.id }}
                variant="danger"
                confirmText={`Delete "${p.title}"?`}
              >
                Delete
              </ActionButton>,
            ],
          }))}
        />
      </div>
    </div>
  );
}
