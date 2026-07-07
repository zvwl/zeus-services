// Streams instantly while the games grid renders, so first paint isn't held
// behind the data fetch. Shapes match the hub hero banner + GameCard grid
// (aspect-[4/3]) to avoid CLS.
export default function Loading() {
  return (
    <div>
      <div className="border-b border-edge">
        <div className="mx-auto max-w-7xl space-y-3 px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-24">
          <div className="h-4 w-24 animate-pulse rounded bg-raised" />
          <div className="h-10 w-64 animate-pulse rounded-lg bg-raised" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-raised/60" />
          <div className="flex gap-3 pt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-6 w-28 animate-pulse rounded-full bg-raised/60" />
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass overflow-hidden p-0">
              <div className="aspect-[4/3] w-full animate-pulse bg-raised" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-raised" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-raised/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
