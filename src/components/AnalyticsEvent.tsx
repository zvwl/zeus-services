"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Fires a GA4 event once when mounted. Used to record server-rendered
 * milestones like a completed purchase on the success page. Re-renders/refreshes
 * with the same GA transaction_id are de-duplicated by GA automatically.
 */
export function AnalyticsEvent({
  name,
  params,
}: {
  name: string;
  params?: Record<string, unknown>;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent(name, params ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
