"use client";

import Link from "next/link";
import Image from "next/image";
import { Zap } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Reveal } from "@/components/motion";
import { Button } from "@/components/ui";

export function AuthShell({
  title,
  subtitle,
  logoUrl,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  logoUrl?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="relative isolate overflow-hidden">
      {/* Storm backdrop — pure atmosphere. Veiled + faded into the page bg at
          the top and bottom edges so it never competes with the card. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 select-none">
        <Image
          src="/media/auth-backdrop.webp"
          alt=""
          fill
          priority
          // Next 15.1/React 19 no longer emits fetchpriority from `priority`
          // alone — set it explicitly so the backdrop keeps its head start.
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="art-veil-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-bg/80 via-transparent to-bg" />
      </div>

      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md flex-col justify-center px-4 py-14 sm:py-20">
        {/* fade={false}: the title/card is the LCP candidate when the backdrop
            is excluded — it must not SSR at opacity:0 waiting for hydration. */}
        <Reveal y={16} fade={false}>
          <Link
            href="/"
            aria-label="Zeuservices — back to home"
            className="mx-auto mb-6 flex h-11 w-fit items-center gap-2"
          >
            {logoUrl ? (
              // Optimizer-served: the raw admin upload (a 1.5MB PNG) was
              // downloading full-size on every auth page via a plain <img>.
              // Square intrinsic hint — the upload is roughly square (see
              // NavClient); a wide hint pre-reserves ~176px and visibly
              // re-centers on decode. Eager, but no `priority`: the backdrop
              // owns the preload.
              <Image
                src={logoUrl}
                alt="Logo"
                width={44}
                height={44}
                loading="eager"
                className="h-11 w-auto max-w-[200px] object-contain"
              />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-dark to-fuchsia-500 shadow-glow-sm">
                <Zap className="h-6 w-6 text-white" fill="currentColor" />
              </span>
            )}
          </Link>
          <h1 className="text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-relaxed text-zinc-400">
              {subtitle}
            </p>
          )}
          <div className="glass mt-8 p-6 shadow-[0_24px_80px_-32px_rgba(139,92,246,0.4)] sm:p-8">
            {children}
          </div>
        </Reveal>
      </div>
    </div>
  );
}

export function OAuthButtons({ next = "/" }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);

  async function signInWith(provider: "discord" | "google") {
    setError(null);
    try {
      // supabase-js (~64KB gz) loads on demand — it's only needed at click
      // time, so it stays off the hydration critical path.
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) setError(error.message);
    } catch {
      // Chunk-load failure (deploy skew, dropped connection) — surface it
      // instead of a silent dead button.
      setError("Couldn't reach the authentication service — try again.");
    }
  }

  return (
    <div className="space-y-2.5">
      <Button
        type="button"
        variant="outline"
        className="min-h-[44px] w-full bg-[#5865F2]/10 hover:border-[#5865F2]/60"
        onClick={() => signInWith("discord")}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#5865F2">
          <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
        </svg>
        Continue with Discord
      </Button>
      <Button
        type="button"
        variant="outline"
        className="min-h-[44px] w-full"
        onClick={() => signInWith("google")}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Continue with Google
      </Button>
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-edge" />
        <span className="text-xs uppercase tracking-wider text-zinc-500">or</span>
        <span className="h-px flex-1 bg-edge" />
      </div>
    </div>
  );
}
