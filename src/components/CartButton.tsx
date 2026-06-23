"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/CartProvider";

export function CartButton() {
  const { count, ready, open } = useCart();
  return (
    <button
      onClick={open}
      aria-label={`Open cart${count ? ` (${count} item${count === 1 ? "" : "s"})` : ""}`}
      className="relative rounded-lg p-2 text-zinc-400 transition hover:bg-raised hover:text-white"
    >
      <ShoppingCart className="h-5 w-5" />
      {ready && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white shadow-glow-sm">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
