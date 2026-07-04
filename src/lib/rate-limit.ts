// Best-effort in-memory rate limiter. On Vercel Fluid Compute an instance is
// reused across requests, so this meaningfully throttles bursts from a single
// IP hitting the same instance; it is NOT a substitute for a shared store
// (Upstash/Redis) or the platform WAF, but it cheaply blunts the obvious
// unauthenticated flooding of order/session-creating endpoints.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Returns true if the caller is allowed, false if they've exceeded `limit`
 * requests within `windowMs`. Keyed by an arbitrary identifier (e.g. IP + route).
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // Opportunistic cleanup so the map can't grow unbounded.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) {
        if (now >= v.resetAt) buckets.delete(k);
      }
    }
    return true;
  }

  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

/** Best-effort client IP from the standard proxy headers. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
