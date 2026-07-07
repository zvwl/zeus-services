"use client";

import { useState } from "react";
import { X, Zap } from "lucide-react";

/**
 * Dismissible announcement bar. Dismissal is persisted in a cookie keyed by a
 * hash of the message, so the bar comes back when the admin changes the copy.
 * The server (Navbar) reads the same cookie and skips rendering entirely, so a
 * dismissed bar never flashes on load.
 */
export function AnnouncementBar({
  message,
  dismissKey,
}: {
  message: string;
  dismissKey: string;
}) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  function dismiss() {
    document.cookie = `announcement_dismissed=${dismissKey}; path=/; max-age=${
      60 * 60 * 24 * 30
    }; samesite=lax`;
    setOpen(false);
  }

  return (
    <div className="bg-gradient-to-br from-primary to-primary-dark text-[13px] font-medium text-white">
      <div className="relative mx-auto flex max-w-7xl items-center justify-center gap-2.5 px-10 py-2">
        <Zap className="h-3.5 w-3.5 shrink-0" fill="currentColor" />
        <span className="text-center">{message}</span>
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="absolute right-3 flex text-white/80 transition hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
