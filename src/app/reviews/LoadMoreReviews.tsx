"use client";

import { useState } from "react";
import { ReviewCard } from "@/components/cards";
import { Button } from "@/components/ui";
import type { SlimReview } from "@/lib/data";
import type { Review } from "@/lib/types";

const PAGE = 12;

/**
 * Appends pages of reviews below the server-rendered first page. Extra pages
 * come from /api/reviews as slim JSON, so they never double-ship in HTML +
 * RSC flight the way server-rendered cards do. `total` is the all-time
 * approved count, so the button knows when to stop without an extra request.
 * `initialIds` are the server-rendered cards' ids — the SSR page and
 * /api/reviews are cached independently, so a review approved between the two
 * caches shifts the boundary row into both and must be deduped here.
 */
export function LoadMoreReviews({
  initialIds,
  total,
}: {
  initialIds: string[];
  total: number;
}) {
  const [extra, setExtra] = useState<SlimReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(false);
  const [failed, setFailed] = useState(false);

  const loaded = initialIds.length + extra.length;
  const exhausted = ended || loaded >= total;

  async function loadMore() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?offset=${loaded}&limit=${PAGE}`);
      if (!res.ok) throw new Error(`reviews page failed: ${res.status}`);
      const { reviews } = (await res.json()) as { reviews: SlimReview[] };
      // Dedupe against the SSR page and prior batches: a review approved
      // between clicks shifts the offset window, which would otherwise repeat
      // the boundary row.
      setExtra((prev) => {
        const seen = new Set([...initialIds, ...prev.map((r) => r.id)]);
        return [...prev, ...reviews.filter((r) => !seen.has(r.id))];
      });
      if (reviews.length < PAGE) setEnded(true);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  if (exhausted && extra.length === 0) return null;

  return (
    <>
      {extra.length > 0 && (
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {extra.map((r, i) => (
            // Stable keys: already-shown cards keep identity when a batch is
            // appended, so only the new batch runs the fade-up animation.
            <div
              key={r.id}
              className="h-full animate-fade-up"
              style={{ animationDelay: `${Math.min(i % PAGE, 8) * 60}ms` }}
            >
              <ReviewCard review={r as Review} />
            </div>
          ))}
        </div>
      )}
      {!exhausted && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more reviews"}
          </Button>
          {failed && (
            <p className="mt-2 text-xs text-red-400">
              Couldn&apos;t load more — try again.
            </p>
          )}
        </div>
      )}
    </>
  );
}
