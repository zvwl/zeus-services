"use client";

import { useEffect, useState } from "react";

function parts(target: string) {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
    done: diff <= 0,
  };
}

export function Countdown({ target }: { target: string }) {
  const [t, setT] = useState<ReturnType<typeof parts> | null>(null);

  useEffect(() => {
    setT(parts(target));
    const id = setInterval(() => setT(parts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!t) {
    return <div className="h-[68px] w-64 animate-pulse rounded-xl bg-raised" />;
  }
  if (t.done) {
    return (
      <span className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300">
        Ended
      </span>
    );
  }
  const cells = [
    { label: "Days", value: t.d },
    { label: "Hrs", value: t.h },
    { label: "Min", value: t.m },
    { label: "Sec", value: t.s },
  ];
  return (
    <div className="flex gap-2" role="timer" aria-label="Time remaining">
      {cells.map((c) => (
        <div
          key={c.label}
          className="flex w-16 flex-col items-center rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-2 py-2"
        >
          <span className="text-xl font-bold tabular-nums text-white">
            {String(c.value).padStart(2, "0")}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-amber-200/70">
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}
