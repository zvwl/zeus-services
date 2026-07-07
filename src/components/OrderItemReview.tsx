"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { ReviewForm } from "@/components/ReviewForm";

/**
 * "Leave a review" entry point shown on a completed order item. Expands the
 * shared ReviewForm pre-linked to that item's product, so the review lands on
 * the product page (after admin approval).
 */
export function OrderItemReview({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-edge bg-raised/50 px-3.5 py-2 text-sm font-medium text-zinc-300 transition hover:border-primary/40 hover:bg-raised hover:text-white"
      >
        <Star className="h-4 w-4 text-amber-400" /> Review {productName}
      </button>
    );
  }

  return (
    <div className="mt-3">
      <ReviewForm productId={productId} signedIn />
    </div>
  );
}
