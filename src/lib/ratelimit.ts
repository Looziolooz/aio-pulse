// PATH: src/lib/ratelimit.ts
//
// ─── Rate Limiting ────────────────────────────────────────────────────────────
//
// Two modes:
//
//   DEVELOPMENT / no Redis:
//     Uses an in-process Map — works fine locally, resets on restart.
//
//   PRODUCTION (Vercel / serverless):
//     Uncomment the Upstash block below after installing:
//       npm install @upstash/ratelimit @upstash/redis
//     Then add to .env.local:
//       UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
//       UPSTASH_REDIS_REST_TOKEN=AXxxxx
//     Free tier: 10 000 requests/day — sufficient for most SaaS projects.
//
// ─────────────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  /** true = request is allowed, false = limit exceeded */
  success: boolean
  /** how many requests are still allowed in this window */
  remaining: number
  /** timestamp (ms) when the window resets */
  resetAt: number
}

// ─── In-memory store (dev / fallback) ─────────────────────────────────────────

interface MemEntry {
  count: number
  resetAt: number
}

const _store = new Map<string, MemEntry>()

// Sweep expired entries every 5 minutes so the Map doesn't grow forever
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [k, v] of _store) {
      if (v.resetAt < now) _store.delete(k)
    }
  }, 5 * 60 * 1000)
}

// ─── checkRateLimit ───────────────────────────────────────────────────────────
//
// Parameters
//   identifier  unique key per client — use IP or userId
//   limit       max requests allowed per window (default 20)
//   windowMs    window size in milliseconds (default 60 000 = 1 min)
//
// Returns RateLimitResult
//
export async function checkRateLimit(
  identifier: string,
  limit = 20,
  windowMs = 60_000,
): Promise<RateLimitResult> {

  // ══════════════════════════════════════════════════════════════════════════
  // PRODUCTION BLOCK — uncomment after installing @upstash/ratelimit + @upstash/redis
  // ══════════════════════════════════════════════════════════════════════════
  //
  // import { Ratelimit } from '@upstash/ratelimit'
  // import { Redis } from '@upstash/redis'
  //
  // if (
  //   process.env['UPSTASH_REDIS_REST_URL'] &&
  //   process.env['UPSTASH_REDIS_REST_TOKEN']
  // ) {
  //   const redis = Redis.fromEnv()
  //   const ratelimit = new Ratelimit({
  //     redis,
  //     limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
  //     analytics: true,
  //     prefix: 'aio-pulse:rl',
  //   })
  //   const { success, remaining, reset } = await ratelimit.limit(identifier)
  //   return { success, remaining, resetAt: reset }
  // }
  //
  // ══════════════════════════════════════════════════════════════════════════

  // ── In-memory fallback ────────────────────────────────────────────────────
  const now = Date.now()
  const existing = _store.get(identifier)

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs
    _store.set(identifier, { count: 1, resetAt })
    return { success: true, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count++
  return {
    success: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  }
}

// ─── getClientIp ─────────────────────────────────────────────────────────────
// Extracts real client IP from Next.js request headers.
// Handles Vercel, Cloudflare, and direct connections.
export function getClientIp(
  headers: { get: (key: string) => string | null },
): string {
  return (
    headers.get('x-real-ip') ??
    headers.get('cf-connecting-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}
