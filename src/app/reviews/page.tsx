import type { Metadata } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { getUser } from "@/lib/auth";
import { getReviewStats } from "@/lib/data";
import { ReviewCard } from "@/components/cards";
import { ReviewForm } from "@/components/ReviewForm";
import { JsonLd } from "@/components/JsonLd";
import { Star } from "lucide-react";
import { SectionHeading, Stars } from "@/components/ui";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion";
import type { Review } from "@/lib/types";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "Real reviews from verified Zeuservices customers across top-ups, boosting and accounts.",
  alternates: { canonical: "/reviews" },
};
export const revalidate = 0;

export default async function ReviewsPage() {
  const supabase = createPublicClient();
  const [{ data }, stats, user] = await Promise.all([
    supabase
      .from("reviews")
      .select("*, profile:profiles(username, avatar_url)")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(60),
    getReviewStats(),
    getUser(),
  ]);
  const reviews = (data as Review[]) ?? [];
  // All-time stats (cached, DB-computed) so the headline number matches the
  // homepage badge and the structured data — not just the 60 loaded reviews.
  const avg = stats.count > 0 ? stats.avg : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  // Review snippets for the trust page. Each review is about a purchased
  // product/service, so it's marked up as an ItemList of Review items (org-level
  // self-serving aggregateRating is against Google's guidelines).
  const reviewsJsonLd =
    reviews.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Zeuservices customer reviews",
          numberOfItems: stats.count,
          itemListElement: reviews.slice(0, 12).map((r, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Review",
              reviewRating: {
                "@type": "Rating",
                ratingValue: r.rating,
                bestRating: 5,
                worstRating: 1,
              },
              author: {
                "@type": "Person",
                name: r.profile?.username ?? r.author_name ?? "Verified buyer",
              },
              datePublished: r.created_at?.slice(0, 10),
              ...(r.content ? { reviewBody: r.content.slice(0, 500) } : {}),
            },
          })),
        }
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      {reviewsJsonLd && <JsonLd data={reviewsJsonLd} />}
      <Reveal y={14}>
        <SectionHeading
          as="h1"
          eyebrow="Wall of fame"
          title="Customer reviews"
          subtitle="Real feedback from verified buyers. Reviews are only accepted from accounts with a completed purchase."
        />
      </Reveal>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Reveal y={16} className="glass h-fit p-6 lg:sticky lg:top-24">
          <div className="text-center">
            <p className="text-5xl font-extrabold text-gradient">{avg || "—"}</p>
            <div className="mt-2 flex justify-center">
              <Stars rating={avg} />
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {stats.count} verified {stats.count === 1 ? "review" : "reviews"}
            </p>
          </div>
          <div className="mt-6 space-y-2">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-xs">
                <span className="flex w-8 items-center gap-0.5 text-zinc-500">
                  {d.star}
                  <Star className="h-3 w-3 fill-current" />
                </span>
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
        </Reveal>

        <div className="lg:col-span-2">
          {reviews.length === 0 ? (
            <p className="glass p-10 text-center text-zinc-500">
              No reviews yet — be the first to share your experience!
            </p>
          ) : (
            <RevealGroup className="grid gap-5 md:grid-cols-2" stagger={0.05}>
              {reviews.map((r) => (
                <RevealItem key={r.id} y={16} className="h-full">
                  <ReviewCard review={r} />
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>
      </div>
    </div>
  );
}
