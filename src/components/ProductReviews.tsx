"use client";

import { useState } from "react";
import { ReviewCard } from "@/components/cards";
import { Button } from "@/components/ui";
import type { Review } from "@/lib/types";

const STEP = 6;

/**
 * Product reviews grid that reveals reviews in batches, so a product with many
 * reviews never makes the page run on forever. `total` is the full approved
 * count (the list itself is capped server-side).
 */
export function ProductReviews({
  reviews,
  total,
}: {
  reviews: Review[];
  total: number;
}) {
  const [visible, setVisible] = useState(STEP);

  if (reviews.length === 0) {
    return (
      <p className="mt-4 text-sm text-zinc-500">
        No reviews for this product yet — be the first!
      </p>
    );
  }

  return (
    <>
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {reviews.slice(0, visible).map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
      {visible < reviews.length ? (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => setVisible((v) => v + STEP)}>
            Show more reviews
          </Button>
        </div>
      ) : total > reviews.length ? (
        <p className="mt-5 text-center text-xs text-zinc-500">
          Showing the {reviews.length} most recent of {total} reviews.
        </p>
      ) : null}
    </>
  );
}
