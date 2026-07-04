"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/CartProvider";

/**
 * Rendered on the checkout success page when the purchase originated from the
 * cart (?cart=1). Empties the cart once the order is confirmed. Single-item
 * "Buy now" purchases don't render this, so they leave the cart untouched.
 */
export function ClearCart() {
  const { hardClear } = useCart();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    hardClear();
  }, [hardClear]);
  return null;
}
