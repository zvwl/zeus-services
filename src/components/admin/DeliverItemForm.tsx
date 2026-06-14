"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck } from "lucide-react";
import { deliverOrderItem } from "@/app/admin/actions";
import { Button } from "@/components/ui";

export function DeliverItemForm({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [payload, setPayload] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={() =>
        startTransition(async () => {
          const formData = new FormData();
          formData.set("item_id", itemId);
          formData.set("payload", payload);
          const res = await deliverOrderItem(formData);
          if (!res.ok) setError(res.message);
          else router.refresh();
        })
      }
    >
      <p className="label">Deliver this item</p>
      <textarea
        className="input min-h-[80px] font-mono text-xs"
        placeholder={
          "Delivery message shown to the customer — account credentials, redemption code, or completion notes."
        }
        value={payload}
        onChange={(e) => setPayload(e.target.value)}
      />
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <Button size="sm" className="mt-3" disabled={pending || !payload.trim()}>
        <PackageCheck className="h-4 w-4" />
        {pending ? "Delivering…" : "Mark delivered"}
      </Button>
    </form>
  );
}
