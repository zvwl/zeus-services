"use client";

import { cn } from "@/lib/utils";

const THUMB_PX = 20;

/**
 * Violet range slider for custom-amount products (e.g. credit top-ups).
 * The filled part of the track is painted with an inline gradient (works in
 * both WebKit and Firefox with appearance-none), a value bubble tracks the
 * thumb, and min/max labels sit under the rail.
 */
export function BuyBoxSlider({
  min,
  max,
  step,
  value,
  onChange,
  ariaLabel = "Amount",
  className,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (n: number) => void;
  ariaLabel?: string;
  className?: string;
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  // Compensate for the thumb width so the bubble stays glued to the thumb
  // center at both extremes of the rail.
  const bubbleLeft = `calc(${pct}% + ${(0.5 - pct / 100) * THUMB_PX}px)`;

  return (
    <div className={cn("pt-10", className)}>
      <div className="relative">
        {/* Value bubble */}
        <div
          className="pointer-events-none absolute -top-10 z-10 -translate-x-1/2"
          style={{ left: bubbleLeft }}
          aria-hidden
        >
          <span className="block whitespace-nowrap rounded-lg border border-primary/40 bg-raised px-2.5 py-1 text-xs font-bold tabular-nums text-primary-light shadow-glow-sm">
            {value.toLocaleString()}
          </span>
          <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-[5px] rotate-45 border-b border-r border-primary/40 bg-raised" />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={ariaLabel}
          style={{
            background: `linear-gradient(to right, #7c3aed 0%, #8b5cf6 ${pct}%, #1e1e30 ${pct}%)`,
          }}
          className={cn(
            "h-2 w-full cursor-pointer appearance-none rounded-full outline-none",
            // WebKit thumb
            "[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full",
            "[&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-solid [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-glow-sm [&::-webkit-slider-thumb]:transition-shadow",
            "[&:focus-visible::-webkit-slider-thumb]:shadow-[0_0_0_6px_rgba(139,92,246,0.3)]",
            // Firefox thumb
            "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-white",
            "[&:focus-visible::-moz-range-thumb]:shadow-[0_0_0_6px_rgba(139,92,246,0.3)]"
          )}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-xs tabular-nums text-zinc-500">
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
}
