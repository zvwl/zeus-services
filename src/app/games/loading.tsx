// Streams instantly while the games grid renders, so first paint isn't held
// behind the data fetch. Card shapes match GameCard (aspect-[4/3]) to avoid CLS.
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mb-12 space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-raised" />
        <div className="h-9 w-56 animate-pulse rounded-lg bg-raised" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-raised/60" />
      </div>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
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
  );
}
