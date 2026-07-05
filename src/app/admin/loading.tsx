// Streams inside the admin shell while a section's data loads (the support
// inbox and orders tables were blocking first paint on their full queries).
export default function Loading() {
  return (
    <div className="space-y-6 p-2">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-raised" />
      <div className="glass overflow-hidden p-0">
        <div className="border-b border-edge px-5 py-4">
          <div className="h-4 w-1/3 animate-pulse rounded bg-raised" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-edge/60 px-5 py-4 last:border-0">
            <div className="h-4 w-full animate-pulse rounded bg-raised/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
