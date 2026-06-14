"use client";

import { useCurrency } from "@/components/CurrencyProvider";
import { cn } from "@/lib/utils";

/** Renders a USD-denominated price in the visitor's selected currency. */
export function Price({
  usd,
  compareUsd,
  from,
  className,
}: {
  usd: number;
  compareUsd?: number | null;
  from?: boolean;
  className?: string;
}) {
  const { format } = useCurrency();
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span>
        {from && <span className="mr-1 text-xs font-normal text-zinc-500">from</span>}
        {format(usd)}
      </span>
      {compareUsd != null && compareUsd > usd && (
        <span className="text-sm font-normal text-zinc-500 line-through">
          {format(compareUsd)}
        </span>
      )}
    </span>
  );
}
