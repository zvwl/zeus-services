"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateReview } from "@/app/admin/actions";
import { Button } from "@/components/ui";

export function ReviewReplyForm({
  reviewId,
  existing,
}: {
  reviewId: string;
  existing: string | null;
}) {
  const router = useRouter();
  const [reply, setReply] = useState(existing ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex gap-2"
      action={() =>
        startTransition(async () => {
          const formData = new FormData();
          formData.set("id", reviewId);
          formData.set("op", "reply");
          formData.set("reply", reply);
          await moderateReview(formData);
          router.refresh();
        })
      }
    >
      <input
        className="input flex-1 py-1.5 text-xs"
        placeholder="Public reply from the store (optional)…"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        maxLength={500}
      />
      <Button size="sm" variant="outline" disabled={pending}>
        {pending ? "…" : existing ? "Update reply" : "Reply"}
      </Button>
    </form>
  );
}
