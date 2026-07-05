// Streams instantly while the product page renders (media + buy box columns).
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="mb-8 h-4 w-64 animate-pulse rounded bg-raised/60" />
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-[16/10] w-full animate-pulse rounded-2xl bg-raised" />
        <div className="space-y-4">
          <div className="h-10 w-3/4 animate-pulse rounded-lg bg-raised" />
          <div className="h-4 w-full animate-pulse rounded bg-raised/60" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-raised/60" />
          <div className="glass mt-6 space-y-4 p-6">
            <div className="h-6 w-1/3 animate-pulse rounded bg-raised" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-raised" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-raised" />
          </div>
        </div>
      </div>
    </div>
  );
}
