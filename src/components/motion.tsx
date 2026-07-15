"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

// IntersectionObserver + CSS reveals. This used to be framer-motion behind
// LazyMotion, which still cost ~29KB gz on every page (eager core + feature
// bundle fetched on mount) purely for these decorative entrances. The sheet
// below ships inline with the SSR HTML via MotionProvider, so the hidden
// state applies from first paint — no flash of un-revealed content.
const EASE = "cubic-bezier(0.21, 0.47, 0.32, 0.98)";

const MOTION_CSS = `
.mo-reveal {
  opacity: 0;
  transform: translateY(var(--mo-y, 20px));
  transition:
    opacity 0.55s ${EASE} var(--mo-delay, 0s),
    transform 0.55s ${EASE} var(--mo-delay, 0s);
}
.mo-nofade { opacity: 1; }
.mo-reveal.mo-in { opacity: 1; transform: none; }
@keyframes mo-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(calc(-1 * var(--mo-amp, 8px))); }
}
.mo-float { animation: mo-float 6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .mo-reveal { opacity: 1; transform: none; transition: none; }
  .mo-float { animation: none; }
}
`;

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MOTION_CSS }} />
      {/* Reveals SSR in their hidden state and only un-hide via JS, so with
          scripting off the content would stay invisible forever. */}
      <noscript
        dangerouslySetInnerHTML={{
          __html: "<style>.mo-reveal{opacity:1;transform:none}</style>",
        }}
      />
      {children}
    </>
  );
}

function useInView(once: boolean, disabled = false) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    // No IntersectionObserver (ancient browsers, some JS-executing bots):
    // reveal immediately — content must never be permanently hidden.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (once) io.disconnect();
      } else if (!once) {
        setInView(false);
      }
    });
    // Default rootMargin (0px) on purpose: a shrunken root (-60px) can never
    // fire for content sitting in the last strip of a page too short to
    // scroll, leaving it stuck hidden. The observer fires immediately for
    // elements already on screen, so above-the-fold content reveals right
    // after hydration.
    io.observe(el);
    return () => io.disconnect();
  }, [once, disabled]);
  return { ref, inView };
}

/**
 * Fade-up entrance when the element scrolls into view. Server components can
 * wrap any subtree in this (children stream through as RSC payload).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 20,
  once = true,
  fade = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  /**
   * fade={false} animates transform only, so the SSR'd markup never carries
   * opacity:0 — required when the wrapped content is the page's LCP candidate
   * (e.g. the auth card): text hidden until hydration turns a fast LCP into a
   * multi-second one on slow runs.
   */
  fade?: boolean;
}) {
  const { ref, inView } = useInView(once);
  return (
    <div
      ref={ref}
      className={cn("mo-reveal", !fade && "mo-nofade", inView && "mo-in", className)}
      style={
        {
          "--mo-y": `${y}px`,
          "--mo-delay": delay > 0 ? `${delay}s` : undefined,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

interface GroupState {
  shown: boolean;
  stagger: number;
  delay: number;
}

const GroupContext = createContext<GroupState | null>(null);

/**
 * Container that staggers its RevealItem children as they enter the viewport.
 * Use for grids: <RevealGroup className="grid ..."><RevealItem>…</RevealItem></RevealGroup>
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  const { ref, inView } = useInView(true);
  const ctx = useMemo(
    () => ({ shown: inView, stagger, delay }),
    [inView, stagger, delay]
  );
  return (
    <div ref={ref} data-mo-group="" className={className}>
      <GroupContext.Provider value={ctx}>{children}</GroupContext.Provider>
    </div>
  );
}

export function RevealItem({
  children,
  className,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const group = useContext(GroupContext);
  // Outside a group the item observes itself; inside one, the group's
  // observer drives every item so the whole grid staggers as a unit.
  const { ref, inView } = useInView(true, group !== null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const el = ref.current;
    const grp = el?.closest("[data-mo-group]");
    if (!el || !grp) return;
    // Stagger order = DOM order within the nearest group (framer derived the
    // same order from the React tree). Idempotent, so StrictMode re-runs and
    // nested groups are safe.
    const items = Array.from(grp.querySelectorAll("[data-mo-item]")).filter(
      (item) => item.closest("[data-mo-group]") === grp
    );
    const i = items.indexOf(el);
    if (i > 0) setIndex(i);
  }, [ref]);
  const shown = group ? group.shown : inView;
  const itemDelay = group ? group.delay + index * group.stagger : 0;
  return (
    <div
      ref={ref}
      data-mo-item=""
      className={cn("mo-reveal", shown && "mo-in", className)}
      style={
        {
          "--mo-y": `${y}px`,
          "--mo-delay": itemDelay > 0 ? `${itemDelay}s` : undefined,
          transitionDuration: "0.5s",
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

/**
 * Slow vertical float for decorative elements (hero showcase card, badges).
 * Disabled for reduced-motion users by the media query in MOTION_CSS.
 */
export function Float({
  children,
  className,
  amplitude = 8,
  duration = 6,
}: {
  children: ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
}) {
  return (
    <div
      className={cn("mo-float", className)}
      style={
        {
          "--mo-amp": `${amplitude}px`,
          animationDuration: `${duration}s`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
