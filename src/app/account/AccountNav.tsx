"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound, LayoutDashboard, Package, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/settings", label: "Settings", icon: Settings },
  { href: "/account/security", label: "Security", icon: KeyRound },
];

/**
 * Account section nav — horizontal scrollable pill tabs on mobile, vertical
 * sidebar list on desktop (DESIGN.md §10). Client component purely for the
 * active-route highlight.
 */
export function AccountNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Account"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:gap-1.5 lg:overflow-visible lg:p-0"
    >
      {tabs.map((t) => {
        const active = isActive(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-[44px] shrink-0 items-center gap-2.5 rounded-xl border px-4 text-sm font-medium transition-all",
              active
                ? "border-primary/40 bg-primary/15 text-white shadow-glow-sm"
                : "border-edge bg-surface/60 text-zinc-400 hover:border-primary/30 hover:bg-raised hover:text-white"
            )}
          >
            <t.icon
              className={cn(
                "h-4 w-4",
                active ? "text-primary-light" : "text-zinc-500"
              )}
            />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
