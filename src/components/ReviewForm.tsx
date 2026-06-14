"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitReview, type ActionResult } from "@/app/actions";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export function ReviewForm({
  productId,
  signedIn,
}: {
  productId?: string;
  signedIn: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <p className="glass p-5 text-sm text-zinc-400">
        <Link href="/login" className="text-primary-light underline">
          Log in
        </Link>{" "}
        to leave a review. Only verified customers can review.
      </p>
    );
  }

  return (
    <form
      className="glass space-y-4 p-5"
      action={(formData) => {
        formData.set("rating", String(rating));
        if (productId) formData.set("product_id", productId);
        startTransition(async () => {
          const res = await submitReview(formData);
          setResult(res);
          if (res.ok) {
            setRating(0);
            (document.getElementById("review-form-content") as HTMLTextAreaElement).value = "";
          }
        });
      }}
    >
      <h3 className="font-semibold text-white">Write a review</h3>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${i} stars`}
            className="p-0.5"
          >
            <svg
              viewBox="0 0 20 20"
              className={cn(
                "h-7 w-7 transition",
                i <= (hover || rating) ? "text-amber-400" : "text-zinc-700"
              )}
              fill="currentColor"
            >
              <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.18 3.62a1 1 0 0 0 .95.7h3.8c.97 0 1.37 1.24.59 1.8l-3.08 2.25a1 1 0 0 0-.36 1.12l1.17 3.62c.3.92-.75 1.69-1.54 1.12l-3.07-2.24a1 1 0 0 0-1.18 0l-3.07 2.24c-.79.57-1.84-.2-1.54-1.12l1.17-3.62a1 1 0 0 0-.36-1.12L2.53 9.05c-.78-.56-.38-1.8.6-1.8h3.79a1 1 0 0 0 .95-.69l1.18-3.63Z" />
            </svg>
          </button>
        ))}
      </div>
      <input
        name="title"
        placeholder="Title (optional)"
        className="input"
        maxLength={120}
      />
      <textarea
        id="review-form-content"
        name="content"
        placeholder="How was your experience?"
        className="input min-h-[110px]"
        maxLength={2000}
        required
      />
      {result && (
        <p
          className={cn(
            "rounded-xl px-3 py-2 text-sm",
            result.ok
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border border-red-500/30 bg-red-500/10 text-red-300"
          )}
        >
          {result.message}
        </p>
      )}
      <Button type="submit" disabled={pending || rating === 0}>
        {pending ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
