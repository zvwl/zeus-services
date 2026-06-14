import { createClient } from "@/lib/supabase/server";
import { Badge, Card, Stars } from "@/components/ui";
import { ActionButton } from "@/components/admin/ActionControls";
import { ReviewReplyForm } from "@/components/admin/ReviewReplyForm";
import { moderateReview } from "@/app/admin/actions";
import { formatDateTime } from "@/lib/utils";
import type { Review } from "@/lib/types";

export const revalidate = 0;

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, profile:profiles(username, avatar_url)")
    .order("is_approved", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(100);
  const reviews = (data as Review[]) ?? [];

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-extrabold text-white">Reviews</h1>
      <p className="mt-1 text-sm text-zinc-500">
        New reviews are hidden until approved. Featured reviews appear first on
        the homepage.
      </p>

      <div className="mt-6 space-y-4">
        {reviews.map((r) => (
          <Card key={r.id} className={r.is_approved ? "" : "border-amber-400/30"}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Stars rating={r.rating} />
                <span className="text-sm font-medium text-white">
                  {r.profile?.username ?? r.author_name ?? "Customer"}
                </span>
                <span className="text-xs text-zinc-600">
                  {formatDateTime(r.created_at)}
                </span>
              </div>
              <div className="flex gap-1.5">
                {!r.is_approved && <Badge variant="warning">pending</Badge>}
                {r.is_featured && <Badge variant="gold">featured</Badge>}
              </div>
            </div>
            {r.title && <p className="mt-3 font-semibold text-white">{r.title}</p>}
            <p className="mt-1 text-sm text-zinc-400">{r.content}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-edge pt-4">
              <ActionButton
                action={moderateReview}
                fields={{ id: r.id, op: r.is_approved ? "unapprove" : "approve" }}
                variant={r.is_approved ? "outline" : "success"}
              >
                {r.is_approved ? "Unapprove" : "✓ Approve"}
              </ActionButton>
              <ActionButton
                action={moderateReview}
                fields={{ id: r.id, op: r.is_featured ? "unfeature" : "feature" }}
              >
                {r.is_featured ? "Unfeature" : "★ Feature"}
              </ActionButton>
              <ActionButton
                action={moderateReview}
                fields={{ id: r.id, op: "delete" }}
                variant="danger"
                confirmText="Delete this review permanently?"
              >
                Delete
              </ActionButton>
            </div>
            <div className="mt-3">
              <ReviewReplyForm reviewId={r.id} existing={r.admin_reply} />
            </div>
          </Card>
        ))}
        {reviews.length === 0 && (
          <Card className="text-center text-sm text-zinc-500">No reviews yet.</Card>
        )}
      </div>
    </div>
  );
}
