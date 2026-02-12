/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Suitable for single-instance Vercel serverless (best-effort).
 * Each cold start resets the window. For strict rate limiting at scale,
 * swap this with @upstash/ratelimit + Redis.
 */

type Entry = { count: number; resetAt: number }

const buckets = new Map<string, Entry>()

// Prevent unbounded memory growth
const MAX_KEYS = 10_000

function evictStale(now: number) {
  if (buckets.size < MAX_KEYS) return
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key)
    if (buckets.size < MAX_KEYS * 0.8) break
  }
}

/**
 * Check whether a request identified by `key` is within limits.
 *
 * @returns `{ allowed: true }` if under the limit, or
 *          `{ allowed: false, retryAfterMs }` if exceeded.
 */
export function rateLimit(
  key: string,
  { maxRequests, windowMs }: { maxRequests: number; windowMs: number },
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now()
  evictStale(now)

  const entry = buckets.get(key)

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (entry.count < maxRequests) {
    entry.count++
    return { allowed: true }
  }

  return { allowed: false, retryAfterMs: entry.resetAt - now }
}
