"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createPromotionCode,
  setPromotionCodeActive,
  setPromotionCodePublic,
} from "@/app/admin/actions";
import { Badge, Button, Card } from "@/components/ui";

/** Serializable snapshot of a Stripe promotion code for the admin table. */
export interface PromoRow {
  id: string;
  code: string;
  active: boolean;
  percentOff: number | null;
  /** Cents, in `currency`. */
  amountOff: number | null;
  currency: string | null;
  timesRedeemed: number;
  maxRedemptions: number | null;
  /** ISO date or null. */
  expiresAt: string | null;
  isPublic: boolean;
  couponValid: boolean;
}

function discountLabel(row: PromoRow) {
  if (row.percentOff != null) return `${row.percentOff}% off`;
  if (row.amountOff != null) {
    return `${(row.amountOff / 100).toFixed(2)} ${row.currency?.toUpperCase() ?? "USD"} off`;
  }
  return "—";
}

export function DiscountsClient({
  codes,
  stripeOk,
}: {
  codes: PromoRow[];
  stripeOk: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      const res = await fn();
      setMsg({ ok: res.ok, text: res.message });
      router.refresh();
    });

  if (!stripeOk) {
    return (
      <Card className="p-6 text-sm text-zinc-400">
        Stripe isn&apos;t configured in this environment, so discount codes
        can&apos;t be managed here. Set <code>STRIPE_SECRET_KEY</code> and
        reload.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div>
          <h2 className="font-bold text-white">Create a code</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Codes live in Stripe and work at checkout instantly — customers
            type them on the payment page. &ldquo;Show publicly&rdquo; also
            lists the code on{" "}
            <a
              href="/discount-codes"
              target="_blank"
              className="text-primary-light hover:underline"
            >
              /discount-codes
            </a>
            ; leave it off for private creator/partner codes.
          </p>
        </div>
        <form
          action={(formData) => run(() => createPromotionCode(formData))}
          className="grid gap-3 sm:grid-cols-2"
        >
          <div>
            <label className="label">Code</label>
            <input
              name="code"
              className="input uppercase"
              placeholder="ZEUS10"
              required
              minLength={3}
              maxLength={20}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select name="kind" className="input">
                <option value="percent">% off</option>
                <option value="amount">USD off</option>
              </select>
            </div>
            <div>
              <label className="label">Value</label>
              <input
                name="value"
                type="number"
                step="0.01"
                min="0.01"
                className="input"
                placeholder="10"
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Max uses (blank = unlimited)</label>
            <input
              name="max_redemptions"
              type="number"
              min="1"
              className="input"
              placeholder="100"
            />
          </div>
          <div>
            <label className="label">Expires in days (blank = never)</label>
            <input
              name="expires_days"
              type="number"
              min="1"
              className="input"
              placeholder="30"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300 sm:col-span-2">
            <input type="checkbox" name="public" className="h-4 w-4 accent-primary" />
            Show publicly on the /discount-codes page
          </label>
          <div className="sm:col-span-2">
            <Button disabled={pending}>
              {pending ? "Creating…" : "Create code"}
            </Button>
          </div>
        </form>
        {msg && (
          <p
            className={`rounded-xl border px-3 py-2 text-sm ${
              msg.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {msg.text}
          </p>
        )}
      </Card>

      <Card className="space-y-1 p-0">
        <div className="border-b border-edge px-5 py-4">
          <h2 className="font-bold text-white">All codes</h2>
        </div>
        {codes.length === 0 ? (
          <p className="px-5 py-8 text-sm text-zinc-500">
            No promotion codes yet — create your first one above. ZEUS10 at 10%
            is the classic opener for coupon-site listings.
          </p>
        ) : (
          <div className="divide-y divide-edge">
            {codes.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3.5"
              >
                <code className="rounded-lg bg-raised px-2.5 py-1 font-mono text-sm font-bold text-white">
                  {c.code}
                </code>
                <span className="text-sm text-zinc-300">{discountLabel(c)}</span>
                <span className="text-xs text-zinc-500">
                  {c.timesRedeemed}
                  {c.maxRedemptions ? `/${c.maxRedemptions}` : ""} used
                  {c.expiresAt
                    ? ` · expires ${new Date(c.expiresAt).toLocaleDateString("en-GB")}`
                    : ""}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  {c.isPublic && <Badge variant="primary">Public</Badge>}
                  <Badge variant={c.active && c.couponValid ? "gold" : undefined}>
                    {c.active && c.couponValid ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(() => setPromotionCodePublic(c.id, !c.isPublic))
                    }
                  >
                    {c.isPublic ? "Unlist" : "List publicly"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(() => setPromotionCodeActive(c.id, !c.active))
                    }
                  >
                    {c.active ? "Deactivate" : "Activate"}
                  </Button>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
