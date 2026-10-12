import 'server-only';

/**
 * Best-effort, in-memory sliding-window rate limiter for the form and search endpoints.
 *
 * Counters live in this server instance only: they reset on restart and are
 * not shared between instances or serverless invocations. That is enough to
 * slow down casual abuse of the forms and the search API; it is not a
 * security boundary. Memory is bounded: at most MAX_KEYS clients are tracked
 * (least recently seen evicted first) and each keeps at most `limit` stamps.
 */

const MAX_KEYS = 10_000;
const MAX_KEY_LENGTH = 100;

/** key → request timestamps inside the current window, oldest first. Map order doubles as LRU order. */
const hits = new Map<string, number[]>();

export type RateLimitResult = {
  ok: boolean;
  /** Requests still allowed in the current window. */
  remaining: number;
  /** Seconds until the next request is allowed (0 when `ok`). */
  retryAfter: number;
};

/**
 * Records one request for `key` and reports whether it is within `limit`
 * requests per `windowMs`. Rejected requests are not recorded, so a client
 * that keeps retrying is let through again as soon as the window slides.
 */
export function rateLimit(key: string, limit: number, windowMs = 60_000, now = Date.now()): RateLimitResult {
  const k = key.slice(0, MAX_KEY_LENGTH);
  const since = now - windowMs;
  const recent = (hits.get(k) ?? []).filter((t) => t > since);

  if (recent.length >= limit) {
    remember(k, recent);
    return { ok: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
  }

  recent.push(now);
  remember(k, recent);
  return { ok: true, remaining: limit - recent.length, retryAfter: 0 };
}

function remember(key: string, stamps: number[]) {
  hits.delete(key);
  hits.set(key, stamps);
  while (hits.size > MAX_KEYS) {
    const oldest = hits.keys().next().value;
    if (oldest === undefined) break;
    hits.delete(oldest);
  }
}

/**
 * True when the deployment sits behind a proxy that overwrites the forwarding
 * headers (TRUST_PROXY=1, or Vercel, whose edge sets x-real-ip itself).
 */
function trustsProxy(): boolean {
  return process.env.TRUST_PROXY === '1' || Boolean(process.env.VERCEL);
}

/**
 * Identifies the client. Behind a trusted proxy: `x-real-ip`, else the LAST
 * `x-forwarded-for` entry (the one appended by the closest proxy; earlier
 * entries are whatever the client chose to send). Otherwise `x-real-ip` may be
 * client-supplied, so only the last `x-forwarded-for` hop is used. Without
 * either, every client shares an 'anon' bucket.
 */
export function clientKey(request: Request): string {
  const realIp = trustsProxy() ? request.headers.get('x-real-ip')?.trim() : undefined;
  if (realIp) return realIp.slice(0, MAX_KEY_LENGTH);
  const forwarded = request.headers
    .get('x-forwarded-for')
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1);
  return forwarded ? forwarded.slice(0, MAX_KEY_LENGTH) : 'anon';
}

/** Clears every counter (tests only). */
export function resetRateLimits() {
  hits.clear();
}
