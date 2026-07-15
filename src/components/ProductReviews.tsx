"use client";

import { useState } from "react";
import { ReviewCard } from "@/components/cards";
import { Button } from "@/components/ui";
import { RevealGroup, RevealItem } from "@/components/motion";
import type { SlimReview } from "@/lib/data";
import type { Review } from "@/lib/types";

const STEP = 6;

/**
 * Product reviews grid that reveals reviews in batches, so a product with many
 * reviews never makes the page run on forever. `total` is the full approved
 * count (the list itself is capped server-side). Takes slim rows — everything
 * passed here crosses the server→client boundary in the RSC flight payload.
 */
export function ProductReviews({
  reviews,
  total,
}: {
  reviews: SlimReview[];
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
    // Single root: this sits in the 1fr track beside the rating summary panel,
    // so the grid and the show-more control must be one grid item.
    <div>
      {/* Stable keys: already-shown cards keep identity when more are revealed,
          so only the new batch animates in. */}
      <RevealGroup className="grid gap-5 md:grid-cols-2" stagger={0.06}>
        {reviews.slice(0, visible).map((r) => (
          <RevealItem key={r.id} y={16} className="h-full">
            <ReviewCard review={r as Review} />
          </RevealItem>
        ))}
      </RevealGroup>
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
    </div>
  );
}
