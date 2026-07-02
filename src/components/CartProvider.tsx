"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  cartCount,
  cartLineKey,
  cartSubtotalUsd,
  unionMaxCarts,
} from "@/lib/cart";
import { loadServerCart, saveServerCart } from "@/app/cart-actions";
import type { CartLine } from "@/lib/types";

const STORAGE_KEY = "zeus_cart_v1";

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotalUsd: number;
  ready: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addLine: (line: Omit<CartLine, "key">) => void;
  updateQty: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readLocal(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(lines: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // storage full / unavailable — non-fatal
  }
}

export function CartProvider({
  authed,
  children,
}: {
  authed: boolean;
  children: ReactNode;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const authedRef = useRef(authed);
  const prevAuthedRef = useRef(authed);

  // On mount: load the local cart, and if signed in, merge it with the saved
  // server cart (server display data wins, quantities are max-merged so this is
  // idempotent across reloads).
  useEffect(() => {
    const wasAuthed = prevAuthedRef.current;
    prevAuthedRef.current = authed;
    authedRef.current = authed;

    // Signing out on a shared device must not leave the previous user's cart —
    // which can contain sensitive custom-field values (credentials, IDs) — in
    // localStorage for the next visitor. Clear everything on the true→false edge.
    if (wasAuthed && !authed) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      setLines([]);
      setReady(true);
      return;
    }

    const local = readLocal();
    if (!authed) {
      setLines(local);
      setReady(true);
      return;
    }
    let cancelled = false;
    loadServerCart()
      .then((server) => {
        if (cancelled) return;
        const merged = unionMaxCarts(local, server);
        setLines(merged);
        writeLocal(merged);
        // Persist the merge so the server reflects any guest additions.
        void saveServerCart(merged);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLines(local);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [authed]);

  // Single funnel for every mutation: update state, mirror to localStorage, and
  // (when signed in) persist to the DB so the cart follows the user.
  const commit = useCallback(
    (updater: (prev: CartLine[]) => CartLine[]) => {
      setLines((prev) => {
        const next = updater(prev);
        writeLocal(next);
        if (authedRef.current) void saveServerCart(next);
        return next;
      });
    },
    []
  );

  const addLine = useCallback(
    (line: Omit<CartLine, "key">) => {
      const key = cartLineKey(line.productId, line.variantId, line.customFields, {
        customAmount: line.customAmount,
        addonIds: line.addons?.map((a) => a.id),
      });
      commit((prev) => {
        const idx = prev.findIndex((l) => l.key === key);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = {
            ...copy[idx],
            quantity: Math.min(99, copy[idx].quantity + line.quantity),
          };
          return copy;
        }
        return [...prev, { ...line, key }];
      });
    },
    [commit]
  );

  const updateQty = useCallback(
    (key: string, quantity: number) => {
      commit((prev) =>
        prev.flatMap((l) =>
          l.key === key
            ? quantity <= 0
              ? []
              : [{ ...l, quantity: Math.min(99, quantity) }]
            : [l]
        )
      );
    },
    [commit]
  );

  const removeLine = useCallback(
    (key: string) => commit((prev) => prev.filter((l) => l.key !== key)),
    [commit]
  );

  const clear = useCallback(() => commit(() => []), [commit]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: cartCount(lines),
      subtotalUsd: cartSubtotalUsd(lines),
      ready,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      addLine,
      updateQty,
      removeLine,
      clear,
    }),
    [lines, ready, isOpen, addLine, updateQty, removeLine, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
