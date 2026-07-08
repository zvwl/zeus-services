import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card, Stars } from "@/components/ui";
import { ActionButton } from "@/components/admin/ActionControls";
import { ReviewReplyForm } from "@/components/admin/ReviewReplyForm";
import { moderateReview } from "@/app/admin/actions";
import { cn, formatDateTime } from "@/lib/utils";
import type { Review } from "@/lib/types";

export const revalidate = 0;

const REVIEW_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "featured", label: "Featured" },
];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: filterRaw } = await searchParams;
  const filter = REVIEW_FILTERS.some((f) => f.key === filterRaw)
    ? filterRaw!
    : "all";

  const supabase = await createClient();
  let query = supabase
    .from("reviews")
    .select("*, profile:profiles(username, avatar_url)")
    .order("is_approved", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter === "pending") query = query.eq("is_approved", false);
  else if (filter === "approved") query = query.eq("is_approved", true);
  else if (filter === "featured") query = query.eq("is_featured", true);
  const { data } = await query;
  const reviews = (data as Review[]) ?? [];

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-extrabold text-white">Reviews</h1>
      <p className="mt-1 text-sm text-zinc-500">
        New reviews are hidden until approved. Featured reviews appear first on
        the homepage.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {REVIEW_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={
              f.key === "all"
                ? "/admin/reviews"
                : `/admin/reviews?filter=${f.key}`
            }
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
              filter === f.key
                ? "border-primary/50 bg-primary/15 text-primary-light"
                : "border-edge bg-raised/50 text-zinc-400 hover:text-white"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

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
                {r.is_featured ? "Unfeature" : "Feature"}
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
          <Card className="text-center text-sm text-zinc-500">
            {filter === "all" ? "No reviews yet." : "No reviews match this filter."}
          </Card>
        )}
      </div>
    </div>
  );
}
