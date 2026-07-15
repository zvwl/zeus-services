import type { Metadata } from "next";
import { getUser } from "@/lib/auth";
import {
  getLatestReviews,
  getReviewStats,
  getSettings,
  setting,
} from "@/lib/data";
import { ReviewCard } from "@/components/cards";
import { ReviewForm } from "@/components/ReviewForm";
import { LoadMoreReviews } from "./LoadMoreReviews";
import { JsonLd } from "@/components/JsonLd";
import { TrustBox } from "@/components/TrustBox";
import { TRUSTBOX } from "@/lib/trustbox";
import { Star } from "lucide-react";
import { SectionHeading, Stars } from "@/components/ui";
import { Reveal } from "@/components/motion";
import type { Review } from "@/lib/types";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "Real reviews from verified Zeuservices customers across top-ups, boosting and accounts.",
  alternates: { canonical: "/reviews" },
};
// The page stays dynamic (getUser for the review form), but the review/stat
// queries hit the tag-invalidated cache in lib/data.ts — review approval busts
// it via revalidatePath("/reviews"), with this window as the safety net.
export const revalidate = 300;

const FIRST_PAGE = 12;

export default async function ReviewsPage() {
  const [reviews, stats, settings, user] = await Promise.all([
    getLatestReviews(FIRST_PAGE),
    getReviewStats(),
    getSettings(),
    getUser(),
  ]);
  const trustpilotId = setting(settings, "trustpilot_business_unit_id");
  // All-time stats (cached, DB-computed) so the headline number and the
  // distribution bars match the homepage badge and the structured data — not
  // just the first page of loaded reviews.
  const avg = stats.count > 0 ? stats.avg : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: stats.byStar[star as 1 | 2 | 3 | 4 | 5],
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
          itemListElement: reviews.slice(0, 6).map((r, i) => ({
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
              ...(r.content ? { reviewBody: r.content.slice(0, 200) } : {}),
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
      {trustpilotId && (
        <div className="mb-8 max-w-md">
          <TrustBox
            businessUnitId={trustpilotId}
            templateId={TRUSTBOX.reviewCollector.templateId}
            height={TRUSTBOX.reviewCollector.height}
            token={setting(settings, "trustpilot_widget_token") || undefined}
          />
        </div>
      )}

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
                        stats.count ? (d.count / stats.count) * 100 : 0
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
            <>
              {/* CSS-only stagger — cards paint at first paint instead of
                  waiting for framer hydration; disabled under
                  prefers-reduced-motion via globals.css. */}
              <div className="grid gap-5 md:grid-cols-2">
                {reviews.map((r, i) => (
                  <div
                    key={r.id}
                    className="h-full animate-fade-up"
                    style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                  >
                    <ReviewCard review={r as Review} />
                  </div>
                ))}
              </div>
              <LoadMoreReviews
                initialIds={reviews.map((r) => r.id)}
                total={stats.count}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
