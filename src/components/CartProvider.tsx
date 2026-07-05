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
// Present while the stored cart belongs to a signed-in user. Sign-out via the
// navbar is a native form POST (full document load), so the in-memory
// true→false auth edge below never fires on that path — this marker lets the
// next signed-out mount detect and clear the previous user's leftover cart.
const AUTHED_MARKER_KEY = "zeus_cart_authed";

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
  hardClear: () => void;
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

  // Debounced server persistence. Every quantity +/- updates local state and
  // localStorage INSTANTLY (optimistic), but the DB sync is a Next.js Server
  // Action — and each invocation makes Next refetch the whole current route's
  // server components. Firing that on every click floods the network and makes
  // the cart feel frozen. Instead we coalesce rapid edits into a single sync a
  // short moment after the user stops interacting.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<CartLine[] | null>(null);
  // Set by hardClear() (on the checkout-success page) so the mount-time
  // server-cart merge can't resurrect a cart we just emptied after payment.
  const skipServerMerge = useRef(false);

  const flushSave = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (pendingSave.current !== null) {
      const toSave = pendingSave.current;
      pendingSave.current = null;
      void saveServerCart(toSave);
    }
  }, []);

  const scheduleSave = useCallback(
    (next: CartLine[]) => {
      pendingSave.current = next;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(flushSave, 700);
    },
    [flushSave]
  );

  // Flush any pending sync when the tab is hidden/closed or the provider
  // unmounts, so the last edit isn't lost before the debounce fires.
  useEffect(() => {
    const onHide = () => flushSave();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushSave();
    });
    return () => {
      window.removeEventListener("pagehide", onHide);
      flushSave();
    };
  }, [flushSave]);

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
        localStorage.removeItem(AUTHED_MARKER_KEY);
      } catch {
        // ignore
      }
      setLines([]);
      setReady(true);
      return;
    }

    const local = readLocal();
    if (!authed) {
      // Sign-out is a full document load, so the edge-clear above never runs
      // on that path: detect a cart left behind by a signed-in user via the
      // marker and clear it here instead. Guest carts have no marker.
      let staleAuthedCart = false;
      try {
        staleAuthedCart = localStorage.getItem(AUTHED_MARKER_KEY) === "1";
      } catch {
        // ignore
      }
      if (staleAuthedCart) {
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(AUTHED_MARKER_KEY);
        } catch {
          // ignore
        }
        setLines([]);
        setReady(true);
        return;
      }
      setLines(local);
      setReady(true);
      return;
    }
    try {
      localStorage.setItem(AUTHED_MARKER_KEY, "1");
    } catch {
      // ignore
    }
    // Just emptied the cart after a successful checkout — don't merge the (now
    // being deleted) server cart back in.
    if (skipServerMerge.current) {
      skipServerMerge.current = false;
      setLines(local);
      setReady(true);
      return;
    }
    let cancelled = false;
    loadServerCart()
      .then((server) => {
        if (cancelled) return;
        // Merge against the CURRENT state (functional update) as well as the
        // pre-load local cart, so any line the user added while this fetch was
        // in flight isn't overwritten and lost.
        setLines((current) => {
          const merged = unionMaxCarts(unionMaxCarts(local, current), server);
          writeLocal(merged);
          // Persist the merge only when it actually differs from the server
          // cart — the unconditional save was a delete+insert pair per mount.
          const sameAsServer =
            merged.length === server.length &&
            merged.every((l) => {
              const s = server.find((x) => x.key === l.key);
              return s !== undefined && s.quantity === l.quantity;
            });
          if (!sameAsServer) scheduleSave(merged);
          return merged;
        });
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLines((current) => unionMaxCarts(local, current));
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
        if (authedRef.current) scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
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

  // Empty the cart immediately and authoritatively after a completed checkout:
  // cancel any pending debounced save, wipe local + state, block the next
  // mount-time server merge, and push an immediate empty save to the DB (the
  // server cart is also cleared at fulfillment, this is the belt-and-braces).
  const hardClear = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    pendingSave.current = null;
    skipServerMerge.current = true;
    writeLocal([]);
    setLines([]);
    if (authedRef.current) void saveServerCart([]);
  }, []);

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
      hardClear,
    }),
    [lines, ready, isOpen, addLine, updateQty, removeLine, clear, hardClear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
