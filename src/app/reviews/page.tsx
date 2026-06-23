import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { ReviewCard } from "@/components/cards";
import { ReviewForm } from "@/components/ReviewForm";
import { SectionHeading, Stars } from "@/components/ui";
import type { Review } from "@/lib/types";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "Real reviews from verified Zeuservices customers across top-ups, boosting and accounts.",
  alternates: { canonical: "/reviews" },
};
export const revalidate = 0;

export default async function ReviewsPage() {
  const supabase = await createClient();
  const [{ data }, user] = await Promise.all([
    supabase
      .from("reviews")
      .select("*, profile:profiles(username, avatar_url)")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(60),
    getUser(),
  ]);
  const reviews = (data as Review[]) ?? [];
  const avg =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10
        ) / 10
      : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHeading
        eyebrow="Wall of fame"
        title="Customer reviews"
        subtitle="Real feedback from verified buyers. Reviews are only accepted from accounts with a completed purchase."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass h-fit p-6 lg:sticky lg:top-24">
          <div className="text-center">
            <p className="text-5xl font-extrabold text-gradient">{avg || "—"}</p>
            <div className="mt-2 flex justify-center">
              <Stars rating={avg} />
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {reviews.length} verified {reviews.length === 1 ? "review" : "reviews"}
            </p>
          </div>
          <div className="mt-6 space-y-2">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-zinc-500">{d.star}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-raised">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500"
                    style={{
                      width: `${
                        reviews.length ? (d.count / reviews.length) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="w-6 text-right text-zinc-600">{d.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-edge pt-6">
            <ReviewForm signedIn={Boolean(user)} />
          </div>
        </div>

        <div className="lg:col-span-2">
          {reviews.length === 0 ? (
            <p className="glass p-10 text-center text-zinc-500">
              No reviews yet — be the first to share your experience!
            </p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
