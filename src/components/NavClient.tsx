"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  type LucideIcon,
  ChevronDown,
  Gamepad2,
  Gift,
  HeartHandshake,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Newspaper,
  Package,
  Search,
  Settings,
  ShieldCheck,
  Star,
  User,
  X,
  Zap,
} from "lucide-react";
import { useCurrency } from "@/components/CurrencyProvider";
import { CartButton } from "@/components/CartButton";
import { DiscordIcon } from "@/components/ui";
import { cn } from "@/lib/utils";

interface NavUser {
  email: string;
  username: string | null;
  avatarUrl: string | null;
  staff: boolean;
}

// Brand wordmark treatment: "Zeu" white + "services" in the violet gradient
// (see the design system's brand-mark guideline). Falls back to splitting at
// the first space for multi-word names, or all-white for anything else.
function splitBrand(name: string): [string, string] {
  const idx = name.toLowerCase().indexOf("services");
  if (idx > 0) return [name.slice(0, idx), name.slice(idx)];
  const space = name.indexOf(" ");
  if (space > 0) return [name.slice(0, space), name.slice(space)];
  return [name, ""];
}

export function NavClient({
  siteName,
  logoUrl,
  categories,
  discordInvite,
  user,
}: {
  siteName: string;
  logoUrl?: string;
  categories: { name: string; slug: string }[];
  discordInvite: string;
  user: NavUser | null;
}) {
  const pathname = usePathname();
  const [brandStart, brandEnd] = splitBrand(siteName);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setUserOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node))
        setUserOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node))
        setMoreOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const links = [
    { href: "/games", label: "Games" },
    ...categories.map((c) => ({ href: `/category/${c.slug}`, label: c.name })),
  ];

  const moreLinks = [
    { href: "/giveaways", label: "Giveaways", icon: Gift },
    { href: "/blog", label: "Blog", icon: Newspaper },
    { href: "/reviews", label: "Reviews", icon: Star },
    { href: "/faq", label: "FAQ", icon: LifeBuoy },
    { href: "/support", label: "Support", icon: ShieldCheck },
    { href: "/donate", label: "Donate", icon: HeartHandshake },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-edge/80 bg-bg/80 backdrop-blur-lg">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          {logoUrl ? (
            // Optimizer-served and eager: the raw admin upload (up to 4MB) was
            // downloading full-size in the above-the-fold shell of every page.
            // width/height are an aspect hint; CSS keeps the rendered h-9 box.
            <Image
              src={logoUrl}
              alt={siteName}
              // Square hint matching the uploaded logo, so the pre-decode
              // layout box equals the decoded one (a wide hint reserved 190px
              // and collapsed on decode — a visible header shift).
              width={36}
              height={36}
              priority
              className="h-9 w-auto max-w-[190px] object-contain"
            />
          ) : (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-dark to-fuchsia-500 shadow-glow-sm">
                <Zap className="h-5 w-5 text-white" fill="currentColor" />
              </span>
              <span className="text-lg font-bold tracking-tight text-white">
                {brandStart}
                {brandEnd && <span className="text-gradient">{brandEnd}</span>}
              </span>
            </>
          )}
        </Link>

        {/* Desktop links */}
        <div className="ml-4 hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname === l.href
                  ? "bg-primary/15 text-primary-light"
                  : "text-zinc-400 hover:bg-raised hover:text-white"
              )}
            >
              {l.label}
            </Link>
          ))}
          <div ref={moreRef} className="relative">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-raised hover:text-white"
            >
              More <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {moreOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-edge bg-surface p-1.5 shadow-xl">
                {moreLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-raised hover:text-white"
                  >
                    <l.icon className="h-4 w-4 text-zinc-500" />
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Search"
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-raised hover:text-white"
          >
            <Search className="h-5 w-5" />
          </Link>

          <CartButton />

          <CurrencySwitcher />

          {discordInvite && (
            <a
              href={discordInvite}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-xl bg-[#5865F2] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#4752c4] md:flex"
            >
              <DiscordIcon className="h-4 w-4" />
              Discord
            </a>
          )}

          {user ? (
            <div ref={userRef} className="relative">
              <button
                onClick={() => setUserOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-edge bg-raised/60 py-1.5 pl-1.5 pr-3 transition hover:border-primary/40"
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-xs font-bold text-primary-light">
                    {(user.username ?? user.email)[0]?.toUpperCase()}
                  </span>
                )}
                <span className="hidden max-w-[110px] truncate text-sm text-zinc-300 sm:block">
                  {user.username ?? user.email}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
              </button>
              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-edge bg-surface p-1.5 shadow-xl">
                  {/* prefetch={false} on the auth-gated links: prefetching them
                      before the 2FA step-up caches the middleware redirect to
                      /verify-2fa, which the router replays after verification. */}
                  {user.staff && (
                    <Link
                      href="/admin"
                      prefetch={false}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-amber-300 hover:bg-raised"
                    >
                      <LayoutDashboard className="h-4 w-4" /> Admin panel
                    </Link>
                  )}
                  <Link
                    href="/account"
                    prefetch={false}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-raised hover:text-white"
                  >
                    <User className="h-4 w-4 text-zinc-500" /> My account
                  </Link>
                  <Link
                    href="/account/orders"
                    prefetch={false}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-raised hover:text-white"
                  >
                    <Package className="h-4 w-4 text-zinc-500" /> My orders
                  </Link>
                  <Link
                    href="/account/settings"
                    prefetch={false}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-raised hover:text-white"
                  >
                    <Settings className="h-4 w-4 text-zinc-500" /> Settings
                  </Link>
                  <form action="/auth/signout" method="post">
                    <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-zinc-300 transition hover:bg-raised hover:text-white"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-white shadow-glow-sm transition hover:bg-primary-dark"
              >
                Sign up
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            className="rounded-lg p-2 text-zinc-300 hover:bg-raised lg:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-edge bg-surface px-4 py-4 lg:hidden">
          <div className="grid grid-cols-2 gap-1.5">
            {([...links, ...moreLinks] as { href: string; label: string; icon?: LucideIcon }[]).map((l) => {
              const Icon = l.icon ?? Gamepad2;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-raised"
                >
                  <Icon className="h-4 w-4 text-zinc-500" />
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}

function CurrencySwitcher() {
  const { currency, rates, setCurrency } = useCurrency();
  return (
    <div className="relative">
      <select
        aria-label="Currency"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="cursor-pointer appearance-none rounded-xl border border-edge bg-raised/60 py-2 pl-3 pr-7 text-sm font-medium text-zinc-300 outline-none transition hover:border-primary/40"
      >
        {rates.map((r) => (
          <option key={r.code} value={r.code}>
            {r.code}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
    </div>
  );
}
