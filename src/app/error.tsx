"use client";

import { Home, RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui";
import { Reveal } from "@/components/motion";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative overflow-hidden">
      {/* Higgsfield storm art behind a uniform veil (plain img: this boundary
          should render even if the image optimizer is what broke) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/media/not-found.webp"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="art-veil-full" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent"
      />
      <div className="relative mx-auto flex min-h-[72vh] max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <Reveal y={14}>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary-light">
            Stray lightning bolt
          </p>
          <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            Something went wrong
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-zinc-300">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-zinc-500">
              Error reference: <code className="text-zinc-400">{error.digest}</code>
            </p>
          )}
        </Reveal>
        <Reveal y={12} delay={0.12}>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={reset} size="lg">
              <RotateCcw className="h-5 w-5" /> Try again
            </Button>
            <ButtonLink href="/" variant="outline" size="lg">
              <Home className="h-5 w-5" /> Back to home
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
