// Without this, navigations to a game detail page fell back to the parent
// /games grid skeleton — a wrong-shaped flash on one of the hottest click
// paths. Shape matches the banner hero + product grid.
export default function Loading() {
  return (
    <div>
      <div className="relative h-64 animate-pulse border-b border-edge bg-raised/50 sm:h-80">
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl space-y-3 px-4 pb-8 sm:px-6 sm:pb-10">
          <div className="h-6 w-40 animate-pulse rounded-full bg-raised" />
          <div className="h-10 w-72 animate-pulse rounded-lg bg-raised" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-raised/60" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6 h-7 w-48 animate-pulse rounded bg-raised" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass overflow-hidden p-0">
              <div className="aspect-[16/10] w-full animate-pulse bg-raised" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-1/3 animate-pulse rounded bg-raised/60" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-raised" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
