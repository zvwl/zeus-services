import Image from "next/image";
import { Gamepad2, Home } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { Reveal } from "@/components/motion";

export default function NotFound() {
  return (
    <div className="relative overflow-hidden">
      {/* Higgsfield 404 art behind a uniform veil so the copy stays legible */}
      <Image
        src="/media/not-found.webp"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="art-veil-full" />
      {/* Fade the art into the page background so the section ends cleanly */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent"
      />
      <div className="relative mx-auto flex min-h-[72vh] max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <Reveal y={14}>
          <p className="text-7xl font-extrabold text-gradient drop-shadow sm:text-8xl">
            404
          </p>
        </Reveal>
        <Reveal y={14} delay={0.08}>
          <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
            This page got struck by lightning
          </h1>
          <p className="mx-auto mt-3 max-w-md text-zinc-300">
            Zeus threw a bolt and this page didn&apos;t survive. It may have
            been moved, renamed, or vaporised entirely.
          </p>
        </Reveal>
        <Reveal y={12} delay={0.16}>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/" size="lg">
              <Home className="h-5 w-5" /> Back to safety
            </ButtonLink>
            <ButtonLink href="/games" variant="outline" size="lg">
              <Gamepad2 className="h-5 w-5" /> Browse games
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
