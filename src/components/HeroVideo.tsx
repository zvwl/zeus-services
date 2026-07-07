"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Ambient looping background video (Higgsfield-generated, first frame ==
 * last frame so the loop is seamless).
 *
 * - Renders the poster immediately (it doubles as the LCP-safe fallback);
 *   the video fades in only once it can actually play through.
 * - Respects prefers-reduced-motion by never starting playback.
 * - Pauses when scrolled offscreen so it costs nothing below the fold.
 */
export function HeroVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // React doesn't reliably render the `muted` attribute into SSR HTML;
    // without it browsers refuse programmatic play(). Set it imperatively.
    video.muted = true;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        onCanPlayThrough={() => setReady(true)}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
          ready ? "opacity-100" : "opacity-0"
        )}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
