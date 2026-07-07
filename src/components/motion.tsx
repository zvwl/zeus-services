"use client";

import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  useReducedMotion,
} from "framer-motion";
import type { ReactNode } from "react";

// LazyMotion + `m` keeps the animation runtime ~5kb instead of shipping the
// full framer-motion bundle on every page. `reducedMotion="user"` disables
// transform/opacity animation for visitors with prefers-reduced-motion.
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

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
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      // margin 0: a shrunken root (-60px) can never fire for content sitting
      // in the last strip of a page too short to scroll, leaving it stuck at
      // opacity 0. Triggering right at the viewport edge is visually the same.
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "0px" }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </m.div>
  );
}

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
  return (
    <m.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px" }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      variants={{ hidden: {}, show: {} }}
    >
      {children}
    </m.div>
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
  return (
    <m.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: EASE },
        },
      }}
    >
      {children}
    </m.div>
  );
}

/**
 * Slow vertical float for decorative elements (hero showcase card, badges).
 * Disabled automatically for reduced-motion users.
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
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <m.div
      className={className}
      animate={{ y: [0, -amplitude, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </m.div>
  );
}
