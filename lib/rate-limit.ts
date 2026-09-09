/**
 * Best-effort in-memory rate limiter. Works correctly for a single
 * long-lived server process (e.g. `next start` on a traditional Node
 * server) but NOT across multiple serverless/edge instances, where each
 * instance has its own memory. Before relying on this in production on
 * Vercel's serverless runtime, back it with a shared store — Upstash
 * Redis is the standard pairing (`@upstash/ratelimit` + `@upstash/redis`)
 * and is a drop-in replacement for `checkRateLimit` below. This module
 * exists so every call site (upload, procurement submission) already has
 * the right shape and doesn't need to change when that swap happens.
 */

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>();

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<{ ok: boolean; remaining: number }> {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count };
}
