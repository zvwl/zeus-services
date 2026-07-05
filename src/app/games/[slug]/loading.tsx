// Without this, navigations to a game detail page fell back to the parent
// /games grid skeleton — a wrong-shaped flash on one of the hottest click
// paths. Shape roughly matches the game hub (banner + product grid).
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mb-8 h-4 w-64 animate-pulse rounded bg-raised/60" />
      <div className="mb-10 space-y-3">
        <div className="h-10 w-72 animate-pulse rounded-lg bg-raised" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-raised/60" />
      </div>
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
  );
}
