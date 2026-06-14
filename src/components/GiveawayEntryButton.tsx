"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { enterGiveaway, type ActionResult } from "@/app/actions";
import { Button } from "@/components/ui";

export function GiveawayEntryButton({
  giveawayId,
  ended,
  entered,
  signedIn,
}: {
  giveawayId: string;
  ended: boolean;
  entered: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  if (ended) {
    return (
      <Button className="w-full" disabled>
        Giveaway ended
      </Button>
    );
  }
  if (!signedIn) {
    return (
      <Button className="w-full" variant="gold" onClick={() => router.push("/login?next=back")}>
        Log in to enter
      </Button>
    );
  }
  if (entered || result?.ok) {
    return (
      <Button className="w-full" variant="success" disabled>
        ✓ You&apos;re entered — good luck!
      </Button>
    );
  }
  return (
    <div>
      <Button
        className="w-full"
        variant="gold"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const formData = new FormData();
            formData.set("giveaway_id", giveawayId);
            setResult(await enterGiveaway(formData));
          })
        }
      >
        {pending ? "Entering…" : "⚡ Enter giveaway"}
      </Button>
      {result && !result.ok && (
        <p className="mt-2 text-center text-xs text-red-400">{result.message}</p>
      )}
    </div>
  );
}
